import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
  StreamableFile,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { CreateTask, Task, TaskSetting, TaskResult, TaskResultEvaluation } from './task';
import { join } from 'path';
import { existsSync, readFileSync, readdirSync, rmSync, lstatSync, createReadStream, mkdirSync, copyFileSync, renameSync } from 'fs';
import { UUID } from 'crypto';
import { ModelService } from '../model/model.service';
import { dataDirectory, encoding, extension, trainingDirectory } from '../config';
import { QueueService } from '../queue/queue.service';
import * as rawExperiments from '../config/experiments.json';

@Injectable()
export class TaskService {
  constructor(
    @Inject(forwardRef(() => ModelService))
    private readonly modelService: ModelService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService
  ) {}

  addTask(sessionId: UUID, createTask: CreateTask) {
    const setting: TaskSetting = {
      ...createTask.setting,
      name: rawExperiments[createTask.setting.id].name,
      conditionMU: rawExperiments[createTask.setting.id].conditionMU,
    };
    const task = new Task(sessionId, createTask.values, setting);
    task.saveInputfile();
    Logger.log(`Created new task "${task.id}" for session "${sessionId}"`, 'TaskService');
    return task;
  }

  async deleteTask(sessionId: UUID, taskId: UUID) {
    const jobs = await this.queueService.findJobs(sessionId);
    if (jobs.find((job) => job.state === 'active')) {
      throw new InternalServerErrorException('There are active jobs. Please wait until these jobs are completed.');
    } else if (!!jobs.length) {
      await Promise.all(jobs.map(async (job) => await this.queueService.deleteJob(job.jobId)));
    }
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    try {
      rmSync(taskDirectory, { recursive: true, force: true });
      Logger.log(`Deleted task "${taskId}" of session "${sessionId}"`, 'TaskService');
    } catch (err) {
      Logger.error(err, 'TaskService');
      throw new InternalServerErrorException();
    }
  }

  findTask(sessionId: UUID, taskId: UUID, parseValues = false) {
    const timestampRegEx = /(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/;
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    const inputFilename = readdirSync(taskDirectory).find((name) => name.match(/input_.+?.txt/));
    const di = inputFilename.match(this.composedRegex(/input_/, timestampRegEx, /_(.+?)_(.+?)_(.+?).txt/));
    if (!inputFilename || !di) {
      Logger.error(`Inputfile of task "${taskId}" not found`, 'TaskService');
      throw new InternalServerErrorException();
    }
    const date = new Date(Date.parse(`${di[1]}-${di[2]}-${di[3]}T${di[4]}:${di[5]}:${di[6]}.000Z`));
    const setting: TaskSetting = {
      id: di[8],
      name: rawExperiments[di[8]].name,
      resolution: Number.parseInt(di[7]),
      condition: Number.parseFloat(di[9]),
      conditionMU: rawExperiments[di[8]].conditionMU,
    };
    const results = readdirSync(taskDirectory)
      .filter((name) => name.match(/result_.+?.json/))
      .map((filename) => {
        const rm = filename.match(this.composedRegex(/result_/, timestampRegEx, /_model_(.+?).json/));
        if (!rm) {
          Logger.error(`A result file of task "${taskId}" has been renamed`, 'TaskService');
          throw new InternalServerErrorException();
        }
        const model = this.modelService.findModelPartial(parseInt(rm[7]));
        return {
          filename,
          uriFile: `/v1/tasks/${taskId}/results/${filename}`,
          uriData: `/v1/tasks/${taskId}/results/${filename.slice(0, -extension.length)}`,
          date: new Date(Date.parse(`${rm[1]}-${rm[2]}-${rm[3]}T${rm[4]}:${rm[5]}:${rm[6]}.000Z`)),
          model,
          evaluation: existsSync(join(trainingDirectory, taskId, TaskResultEvaluation.POSITIVE, filename))
            ? TaskResultEvaluation.POSITIVE
            : existsSync(join(trainingDirectory, taskId, TaskResultEvaluation.NEGATIVE, filename))
              ? TaskResultEvaluation.NEGATIVE
              : TaskResultEvaluation.NEUTRAL,
        } as TaskResult;
      });
    // eslint-disable-next-line prettier/prettier
    const task = new Task(
      sessionId,
      parseValues ? this.parseInputfile(join(taskDirectory, inputFilename)) : undefined,
      setting,
      taskId,
      date,
      results
    );
    return task;
  }

  findTasks(sessionId: UUID) {
    const sessionDirectory = join(dataDirectory, sessionId);
    return existsSync(sessionDirectory)
      ? readdirSync(sessionDirectory)
          .filter((name: UUID) => lstatSync(join(sessionDirectory, name)).isDirectory())
          .map((name: UUID) => this.findTask(sessionId, name))
      : [];
  }

  runTask(sessionId: UUID, taskId: UUID, modelId: number) {
    const model = this.modelService.findModel(modelId);
    const task = this.findTask(sessionId, taskId) as Task;
    if (
      !model.experiments.find(
        (experiment) => experiment.id === task.setting.id && experiment.conditions.find((condition) => condition === task.setting.condition)
      )
    ) {
      throw new UnprocessableEntityException();
    }
    return this.queueService.appendTask(task, this.modelService.toPartial(model));
  }

  findTaskResult(sessionId: UUID, taskId: UUID, fileId: string): StreamableFile | any {
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    // if filename contains extension: provide download
    if (fileId.slice(-extension.length).toLocaleLowerCase() === extension) {
      const filepath = join(taskDirectory, fileId);
      if (!existsSync(filepath)) {
        throw new NotFoundException();
      }
      return new StreamableFile(createReadStream(filepath), { disposition: `attachment; filename="${fileId}"` });
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

  findTaskResultTemplateData(sessionId: UUID, taskId: UUID, fileId: string, experimentId: string, condition: number): string {
    const { taskDirectory } = this.findDirectories(sessionId, taskId);
    if (fileId.endsWith(extension)) {
      fileId = fileId.slice(0, -extension.length);
    }
    const filepath = join(taskDirectory, fileId + extension);
    if (!existsSync(filepath)) {
      throw new NotFoundException();
    }
    try {
      const model = this.modelService.findModel(parseInt(fileId.split('_').at(-1)));
      if (!model.templates.length) {
        throw new UnprocessableEntityException();
      }
      const template = model.templates?.find((template) => template.experimentId === experimentId && template.condition === condition);
      if (!template) {
        throw new NotFoundException();
      }
      let plaintext = readFileSync(template.templatePath, encoding);
      JSON.parse(readFileSync(filepath, encoding)).forEach(
        (param: { id: string; name: string; value: number }) => (plaintext = plaintext.replaceAll(`{${param.id}}`, param.value.toString()))
      );
      return plaintext;
    } catch (err) {
      Logger.error(err, 'TaskService');
      throw new InternalServerErrorException();
    }
  }

  findTaskResultTemplateFile(sessionId: UUID, taskId: UUID, fileId: string, experimentId: string, condition: number): StreamableFile {
    const template = this.findTaskResultTemplateData(sessionId, taskId, fileId, experimentId, condition);
    return new StreamableFile(Buffer.from(template), {
      disposition: `attachment; filename="${fileId.endsWith(extension) ? fileId.slice(0, -extension.length) : fileId}_${experimentId}_${condition}.fds"`,
    });
  }

  async deleteTaskResult(sessionId: UUID, taskId: UUID, fileId: string, keepTrainingDataData: boolean): Promise<Task> {
    const task = this.findTask(sessionId, taskId) as Task;
    const filename = fileId.endsWith(extension) ? fileId : fileId + extension;
    const filepath = join(task.directory, filename);
    const result = task.results.find((result) => result.filename === filename);
    if (!result || !existsSync(filepath)) {
      throw new NotFoundException();
    }
    rmSync(filepath, { force: true });
    if (!keepTrainingDataData && result.evaluation !== TaskResultEvaluation.NEUTRAL) {
      const trainingTaskDirectory = join(trainingDirectory, task.id);
      this.cleanupEvaluation(trainingTaskDirectory, result.evaluation, result);
    }
    await this.queueService.deleteJobByFilename(sessionId, filename);
    task.results = task.results.filter((r) => r.filename !== result.filename);
    return task;
  }

  cleanupEvaluation = (trainingTaskDirectory: string, evaluation: TaskResultEvaluation, evaluatedResult: TaskResult) => {
    const evaluationDirectory = join(trainingTaskDirectory, evaluation);
    const evaluationPath = join(evaluationDirectory, evaluatedResult.filename);
    if (existsSync(evaluationPath)) {
      rmSync(evaluationPath, { force: true });
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

  evaluateTaskResult(sessionId: UUID, taskId: UUID, fileId: string, evalutation: TaskResultEvaluation) {
    const task = this.findTask(sessionId, taskId) as Task;
    const evaluatedResult = task.results.find(
      (result) => result.filename === (fileId.slice(-extension.length).toLocaleLowerCase() === extension ? fileId : fileId + extension)
    );
    if (!evaluatedResult) {
      throw new NotFoundException();
    }
    const trainingTaskDirectory = join(trainingDirectory, task.id);
    try {
      if (evalutation === TaskResultEvaluation.NEUTRAL) {
        this.cleanupEvaluation(trainingTaskDirectory, TaskResultEvaluation.POSITIVE, evaluatedResult) ||
          this.cleanupEvaluation(trainingTaskDirectory, TaskResultEvaluation.NEGATIVE, evaluatedResult);
      } else {
        if (!existsSync(trainingTaskDirectory)) {
          mkdirSync(trainingTaskDirectory, { recursive: true });
          copyFileSync(join(task.directory, task.inputFilename), join(trainingTaskDirectory, task.inputFilename));
        }
        const preEvaluationDirectory = join(
          trainingTaskDirectory,
          evalutation !== TaskResultEvaluation.POSITIVE ? TaskResultEvaluation.POSITIVE : TaskResultEvaluation.NEGATIVE
        );
        const wrongEvaluatedPath = join(preEvaluationDirectory, evaluatedResult.filename);
        const evaluationDirectory = join(trainingTaskDirectory, evalutation);
        if (!existsSync(evaluationDirectory)) {
          mkdirSync(evaluationDirectory, { recursive: true });
        }
        if (existsSync(wrongEvaluatedPath)) {
          renameSync(wrongEvaluatedPath, join(evaluationDirectory, evaluatedResult.filename));
          if (!readdirSync(preEvaluationDirectory).length) {
            rmSync(preEvaluationDirectory, { recursive: true, force: true });
          }
        } else {
          copyFileSync(join(task.directory, evaluatedResult.filename), join(evaluationDirectory, evaluatedResult.filename));
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
      Logger.log(`Evaluated result "${evaluatedResult.filename}" of task "${task.id}" as "${evalutation}"`, 'TaskService');
      return evaluatedResult;
    });
    return task;
  }

  private parseInputfile = (filepath: string): number[] => {
    let values: number[];
    try {
      values = readFileSync(filepath, encoding)
        .split(/\r?\n/)
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
    const taskDirectory = join(sessionDirectory, taskId);
    if (!existsSync(taskDirectory)) {
      throw new NotFoundException();
    }
    return { sessionDirectory, taskDirectory };
  }

  private composedRegex = (...regexes: RegExp[]) => new RegExp(regexes.map((regex) => regex.source).join(''));
}
