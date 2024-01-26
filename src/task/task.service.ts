import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  ForbiddenException,
  StreamableFile,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { CreateTaskDto, Task, TaskResult, TaskResultEvaluation, TaskTraining } from './task';
import { join } from 'path';
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  lstatSync,
  createReadStream,
  mkdirSync,
  copyFileSync,
  renameSync,
} from 'fs';
import { UUID } from 'crypto';
import { ModelService } from '../model/model.service';
import {
  dataDirectory,
  encoding,
  extension,
  trainingDirectory,
} from '../config';

@Injectable()
export class TaskService {
  constructor(
    @Inject(forwardRef(() => ModelService))
    private readonly modelService: ModelService,
  ) {}

  addTask(sessionId: UUID, createTask: CreateTaskDto) {
    const task = new Task(sessionId, createTask.values, createTask.training);
    task.saveInputfile();
    Logger.log(
      `Created new task "${task.id}" for session "${sessionId}"`,
      'TaskService',
    );
    return task.toDto();
  }

  editTask(sessionId: UUID, taskId: UUID, training: TaskTraining) {
    const task = this.findTask(sessionId, taskId, false) as Task;
    renameSync(
      task.directory,
      join(
        dataDirectory,
        sessionId,
        `${training === TaskTraining.ENABLED ? '1' : '0'}_${taskId}`,
      ),
    );
    task.training = training;
    Logger.log(
      `${
        training === TaskTraining.ENABLED ? 'Enabled' : 'Disabled'
      } training for task "${task.id}" of session "${sessionId}"`,
      'TaskService',
    );
    if (training === TaskTraining.DISABLED) {
      task.results = task.results.map((result) => {
        if (result.evaluation !== TaskResultEvaluation.NEUTRAL) {
          try {
            rmSync(join(trainingDirectory, task.id), {
              recursive: true,
              force: true,
            });
            Logger.log(
              `Deleted training data of task "${task.id}"`,
              'TaskService',
            );
          } catch (err) {
            Logger.error(err, 'TaskService');
            throw new InternalServerErrorException();
          }
          result.evaluation = TaskResultEvaluation.NEUTRAL;
        }
        return result;
      });
    }
    return task.toDto();
  }

  deleteTask(sessionId: UUID, taskId: UUID) {
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    try {
      rmSync(taskDirectory, { recursive: true, force: true });
      Logger.log(
        `Deleted task "${taskId}" of session "${sessionId}"`,
        'TaskService',
      );
    } catch (err) {
      Logger.error(err, 'TaskService');
      throw new InternalServerErrorException();
    }
  }

  findTask(sessionId: UUID, taskId: UUID, toDto = true, parseValues = false) {
    const timestampRegEx = /(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/;
    const { taskDirectory, training } = this.findDirectories(sessionId, taskId);
    const inputFilename = readdirSync(taskDirectory).find((name) =>
      name.match(/input_.+?.txt/),
    );
    const di = inputFilename.match(timestampRegEx);
    if (!inputFilename || !di) {
      Logger.error(`Inputfile of task "${taskId}" not found`, 'TaskService');
      throw new InternalServerErrorException();
    }
    const date = new Date(
      Date.parse(`${di[1]}-${di[2]}-${di[3]}T${di[4]}:${di[5]}:${di[6]}.000Z`),
    );
    const results = readdirSync(taskDirectory)
      .filter((name) => name.match(/output_.+?.json/))
      .map((filename) => {
        const rm = filename.match(
          this.composedRegex(/output_/, timestampRegEx, /_(.+?)_(\d+).json/),
        );
        if (!rm) {
          Logger.error(
            `A result file of task "${taskId}" has been renamed`,
            'TaskService',
          );
          throw new InternalServerErrorException();
        }
        const model = this.modelService.findModelByName(rm[7]);
        const modelResoution = model.resolutions.find(
          (resolution) => resolution == (rm[8] as any),
        );
        model.resolutions = [modelResoution];
        return {
          filename,
          uriFile: `/v1/tasks/${taskId}/results/${filename}`,
          uriData: `/v1/tasks/${taskId}/results/${filename.slice(
            0,
            -extension.length,
          )}`,
          date: new Date(
            Date.parse(
              `${rm[1]}-${rm[2]}-${rm[3]}T${rm[4]}:${rm[5]}:${rm[6]}.000Z`,
            ),
          ),
          model,
          evaluation: existsSync(
            join(
              trainingDirectory,
              taskId,
              TaskResultEvaluation.POSITIVE,
              filename,
            ),
          )
            ? TaskResultEvaluation.POSITIVE
            : existsSync(
                  join(
                    trainingDirectory,
                    taskId,
                    TaskResultEvaluation.NEGATIVE,
                    filename,
                  ),
                )
              ? TaskResultEvaluation.NEGATIVE
              : TaskResultEvaluation.NEUTRAL,
        } as TaskResult;
      });
    const task = new Task(
      sessionId,
      parseValues
        ? this.parseInputfile(join(taskDirectory, inputFilename))
        : undefined,
      training,
      taskId,
      date,
      results,
    );
    return toDto ? task.toDto() : task;
  }

  findTasks(sessionId: UUID) {
    const sessionDirectory = join(dataDirectory, sessionId);
    if (existsSync(sessionDirectory)) {
      return readdirSync(sessionDirectory)
        .filter((name) => lstatSync(join(sessionDirectory, name)).isDirectory())
        .map((name: string) => this.findTask(sessionId, name.slice(2) as UUID));
    } else {
      throw new NotFoundException();
    }
  }

  runTask(sessionId: UUID, taskId: UUID, modelId: number, resolution: number) {
    const model = this.modelService.findModel(modelId);
    const modelResoution = model.resolutions.find((res) => res == resolution);
    if (modelResoution > 0) {
      // TODO: Implement Queues! https://docs.nestjs.com/techniques/queues
      model.resolutions = [modelResoution];
      Logger.log(`Running task "${taskId}" ...`, 'TaskService');
      return (this.findTask(sessionId, taskId, false) as Task).run(model);
    } else {
      throw new BadRequestException();
    }
  }

  findTaskResult(
    sessionId: UUID,
    taskId: UUID,
    fileId: string,
  ): StreamableFile | any {
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    // if filename contains extension: provide download
    if (fileId.slice(-extension.length).toLocaleLowerCase() === extension) {
      const filepath = join(taskDirectory, fileId);
      if (!existsSync(filepath)) {
        throw new NotFoundException();
      }
      return new StreamableFile(createReadStream(filepath));
    }
    // if filename does not contain extension: return filecontent
    const filepath = join(taskDirectory, fileId + extension);
    if (!existsSync(filepath)) {
      throw new NotFoundException();
    }
    try {
      return JSON.parse(readFileSync(filepath, encoding));
    } catch (err) {
      Logger.error(err, 'TaskService');
      throw new InternalServerErrorException();
    }
  }

  evaluateTaskResult(
    sessionId: UUID,
    taskId: UUID,
    fileId: string,
    evalutation: TaskResultEvaluation,
  ) {
    const task = this.findTask(sessionId, taskId, false) as Task;
    if (task.training === TaskTraining.DISABLED) {
      throw new ForbiddenException();
    }
    const evaluatedResult = task.results.find(
      (result) =>
        result.filename ===
        (fileId.slice(-extension.length).toLocaleLowerCase() === extension
          ? fileId
          : fileId + extension),
    );
    if (!evaluatedResult) {
      throw new NotFoundException();
    }
    const trainingTaskDirectory = join(trainingDirectory, task.id);
    try {
      if (evalutation === TaskResultEvaluation.NEUTRAL) {
        const cleanup = (evaluation: TaskResultEvaluation) => {
          const evaluationPath = join(
            trainingTaskDirectory,
            evaluation,
            evaluatedResult.filename,
          );
          if (existsSync(evaluationPath)) {
            rmSync(evaluationPath, { force: true });
            const evaluationDirectory = join(trainingTaskDirectory, evaluation);
            if (!readdirSync(evaluationDirectory).length) {
              rmSync(evaluationDirectory, { recursive: true, force: true });
            }
            if (readdirSync(trainingTaskDirectory).length === 1) {
              rmSync(trainingTaskDirectory, { recursive: true, force: true });
            }
            return true;
          }
          return false;
        };
        cleanup(TaskResultEvaluation.POSITIVE) ||
          cleanup(TaskResultEvaluation.NEGATIVE);
      } else {
        if (!existsSync(trainingTaskDirectory)) {
          mkdirSync(trainingTaskDirectory, { recursive: true });
          copyFileSync(
            join(task.directory, task.inputFilename),
            join(trainingTaskDirectory, task.inputFilename),
          );
        }
        const preEvaluationDirectory = join(
          trainingTaskDirectory,
          evalutation !== TaskResultEvaluation.POSITIVE
            ? TaskResultEvaluation.POSITIVE
            : TaskResultEvaluation.NEGATIVE,
        );
        const wrongEvaluatedPath = join(
          preEvaluationDirectory,
          evaluatedResult.filename,
        );
        const evaluationDirectory = join(trainingTaskDirectory, evalutation);
        if (!existsSync(evaluationDirectory)) {
          mkdirSync(evaluationDirectory, { recursive: true });
        }
        if (existsSync(wrongEvaluatedPath)) {
          renameSync(
            wrongEvaluatedPath,
            join(evaluationDirectory, evaluatedResult.filename),
          );
          if (!readdirSync(preEvaluationDirectory).length) {
            rmSync(preEvaluationDirectory, { recursive: true, force: true });
          }
        } else {
          copyFileSync(
            join(task.directory, evaluatedResult.filename),
            join(evaluationDirectory, evaluatedResult.filename),
          );
        }
      }
    } catch (err) {
      Logger.error(err, 'TaskService');
      throw new InternalServerErrorException();
    }
    evaluatedResult.evaluation = evalutation;
    task.results = task.results.map((result) => {
      if (result.filename !== evaluatedResult.filename) {
        return result;
      }
      Logger.log(
        `Evaluated result "${evaluatedResult.filename}" of task "${task.id}" as "${evalutation}"`,
        'TaskService',
      );
      return evaluatedResult;
    });
    return task.toDto();
  }

  private parseInputfile = (filepath: string): number[] => {
    let values: number[];
    try {
      values = readFileSync(filepath, encoding)
        .replaceAll('\r\n', '\n')
        .split('\n')
        .map((value) => value.trim())
        .filter((value) => !!value?.length)
        .map((value) => Number.parseFloat(value));
    } catch (err) {
      Logger.error(err, 'TaskService');
      throw new InternalServerErrorException();
    }
    if (values.length !== 100) {
      throw new NotImplementedException();
    }
    return values;
  };

  private findDirectories(sessionId: UUID, taskId: UUID) {
    const sessionDirectory = join(dataDirectory, sessionId);
    if (!existsSync(sessionDirectory)) {
      throw new NotFoundException();
    }
    const privateTaskPath = join(sessionDirectory, `0_${taskId}`);
    const trainingTaskPath = join(sessionDirectory, `1_${taskId}`);
    const training = existsSync(trainingTaskPath)
      ? TaskTraining.ENABLED
      : TaskTraining.DISABLED;
    const taskDirectory =
      training === TaskTraining.ENABLED ? trainingTaskPath : privateTaskPath;
    if (taskDirectory === privateTaskPath && !existsSync(privateTaskPath)) {
      throw new NotFoundException();
    }
    return { sessionDirectory, taskDirectory, training };
  }

  private composedRegex = (...regexes: RegExp[]) =>
    new RegExp(regexes.map((regex) => regex.source).join(''));
}
