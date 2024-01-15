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
import { EvaluateOptions, Task } from './task';
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

  addTask(sessionId: UUID, values: any) {
    const task = new Task(sessionId, values);
    task.saveInputfile();
    Logger.log(
      `Created new task "${task.id}" for session "${sessionId}"`,
      'TaskService',
    );
    return task.toPartial();
  }

  editTask(sessionId: UUID, taskId: UUID, training: boolean) {
    const task = this.findTask(sessionId, taskId, false);
    if (![true, false].includes(training)) {
      throw new BadRequestException();
    }
    renameSync(
      task.directory,
      join(dataDirectory, sessionId, `${training ? '1' : '0'}_${taskId}`),
    );
    task.training = training;
    Logger.log(
      `${training ? 'Enabled' : 'Disabled'} training for task "${
        task.id
      }" of session "${sessionId}"`,
      'TaskService',
    );
    return task.toPartial();
  }

  deleteTask(sessionId: UUID, taskId: UUID): Partial<Task> {
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    try {
      rmSync(taskDirectory, { recursive: true, force: true });
      Logger.log(
        `Deleted task "${taskId}" of session "${sessionId}"`,
        'TaskService',
      );
      return { id: taskId };
    } catch (err) {
      Logger.error(err, 'TaskService');
      throw new InternalServerErrorException();
    }
  }

  findTask(
    sessionId: UUID,
    taskId: UUID,
    toPartial = true,
    parseValues = false,
  ) {
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
              EvaluateOptions[EvaluateOptions.RIGHT],
              filename,
            ),
          )
            ? EvaluateOptions.RIGHT
            : existsSync(
                  join(
                    trainingDirectory,
                    taskId,
                    EvaluateOptions[EvaluateOptions.WRONG],
                    filename,
                  ),
                )
              ? EvaluateOptions.WRONG
              : EvaluateOptions.UNVALUED,
        };
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
    return toPartial ? task.toPartial() : task;
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

  runTask(sessionId: UUID, taskId: UUID, modelId: any, resolution: any) {
    const model = this.modelService.findModel(modelId);
    const modelResoution = model.resolutions.find((res) => res == resolution);
    if (modelResoution > 0) {
      model.resolutions = [modelResoution];
      Logger.log(`Running task "${taskId}" ...`, 'TaskService');
      return this.findTask(sessionId, taskId, false).run(model);
    } else {
      throw new BadRequestException();
    }
  }

  findTaskResult(
    sessionId: UUID,
    taskId: UUID,
    filename: string,
  ): StreamableFile | any {
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    // if filename contains extension: provide download
    if (filename.slice(-extension.length).toLocaleLowerCase() === extension) {
      const filepath = join(taskDirectory, filename);
      if (!existsSync(filepath)) {
        throw new NotFoundException();
      }
      return new StreamableFile(createReadStream(filepath));
    }
    // if filename does not contain extension: return filecontent
    const filepath = join(taskDirectory, filename + extension);
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
    filename: string,
    evalutation: number,
  ) {
    if (
      !Object.values(EvaluateOptions)
        .filter((v) => !isNaN(Number(v)))
        .includes(evalutation)
    ) {
      throw new BadRequestException();
    }
    const task = this.findTask(sessionId, taskId, false);
    if (!task.training) {
      throw new ForbiddenException();
    }
    const evaluatedResult = task.results.find(
      (unvaluedResult) =>
        unvaluedResult.filename ===
        (filename.slice(-extension.length).toLocaleLowerCase() === extension
          ? filename
          : filename + extension),
    );
    if (!evaluatedResult) {
      throw new NotFoundException();
    }
    const trainingTaskDirectory = join(trainingDirectory, task.id);
    try {
      if (evalutation === EvaluateOptions.UNVALUED) {
        const cleanup = (evaluation: EvaluateOptions) => {
          const evaluationPath = join(
            trainingTaskDirectory,
            EvaluateOptions[evaluation],
            evaluatedResult.filename,
          );
          if (existsSync(evaluationPath)) {
            rmSync(evaluationPath, { force: true });
            const evaluationDirectory = join(
              trainingTaskDirectory,
              EvaluateOptions[evaluation],
            );
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
        cleanup(EvaluateOptions.RIGHT) || cleanup(EvaluateOptions.WRONG);
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
          EvaluateOptions[
            evalutation !== EvaluateOptions.RIGHT
              ? EvaluateOptions.RIGHT
              : EvaluateOptions.WRONG
          ],
        );
        const wrongEvaluatedPath = join(
          preEvaluationDirectory,
          evaluatedResult.filename,
        );
        const evaluationDirectory = join(
          trainingTaskDirectory,
          EvaluateOptions[evalutation],
        );
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
    task.results = task.results.map((unvaluedResult) => {
      if (unvaluedResult.filename !== evaluatedResult.filename) {
        return unvaluedResult;
      }
      Logger.log(
        `Evaluated result "${evaluatedResult.filename}" of task "${task.id}" as "${EvaluateOptions[evalutation]}"`,
        'TaskService',
      );
      return evaluatedResult;
    });
    return task.toPartial();
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
    const training = existsSync(trainingTaskPath);
    const taskDirectory = training ? trainingTaskPath : privateTaskPath;
    if (taskDirectory === privateTaskPath && !existsSync(privateTaskPath)) {
      throw new NotFoundException();
    }
    return { sessionDirectory, taskDirectory, training };
  }

  private composedRegex = (...regexes: RegExp[]) =>
    new RegExp(regexes.map((regex) => regex.source).join(''));
}
