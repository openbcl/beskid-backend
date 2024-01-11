import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  forwardRef,
} from '@nestjs/common';
import { Task } from './task';
import { join, resolve } from 'path';
import { existsSync, readFileSync, readdirSync, rmSync, lstatSync } from 'fs';
import { UUID } from 'crypto';
import { ModelService } from '../model/model.service';

@Injectable()
export class TaskService {
  constructor(
    @Inject(forwardRef(() => ModelService))
    private readonly modelService: ModelService,
  ) {}

  addTask(sessionId: UUID, values: any) {
    const task = new Task(sessionId, values);
    task.saveInputfile();
    return task.toPartial();
  }

  deleteTask(sessionId: UUID, taskId: UUID): Partial<Task> {
    const sessionDirectory = resolve('data', sessionId);
    const privateTaskPath = join(sessionDirectory, `0_${taskId}`);
    const trainingTaskPath = join(sessionDirectory, `1_${taskId}`);
    const taskDirectory = existsSync(privateTaskPath)
      ? privateTaskPath
      : trainingTaskPath;
    if (taskDirectory === trainingTaskPath && !existsSync(taskDirectory)) {
      throw new NotFoundException();
    }
    try {
      rmSync(taskDirectory, { recursive: true, force: true });
      if (
        !readdirSync(sessionDirectory).filter((name) =>
          lstatSync(join(sessionDirectory, name)).isDirectory(),
        ).length
      ) {
        rmSync(sessionDirectory, { recursive: true, force: true });
      }
      return { id: taskId };
    } catch {
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
    const sessionDirectory = resolve('data', sessionId);
    if (existsSync(sessionDirectory)) {
      const taskDirectory = readdirSync(sessionDirectory)
        .filter((name) => lstatSync(join(sessionDirectory, name)).isDirectory())
        .find((name) => name.includes(taskId));
      if (!taskDirectory) {
        throw new NotFoundException();
      }
      const directory = join(sessionDirectory, taskDirectory);
      const training = !!Number.parseInt(taskDirectory[0]);
      const inputFilename = readdirSync(directory).find((name) =>
        name.match(/input_.+?.txt/),
      );
      const di = inputFilename.match(timestampRegEx);
      if (!inputFilename || !di) {
        throw new InternalServerErrorException();
      }
      const date = new Date(
        Date.parse(
          `${di[1]}-${di[2]}-${di[3]}T${di[4]}:${di[5]}:${di[6]}.000Z`,
        ),
      );
      const results = readdirSync(directory)
        .filter((name) => name.match(/output_.+?.json/))
        .map((filename) => {
          const rm = filename.match(
            this.composedRegex(/output_/, timestampRegEx, /_(.+?)_(\d+).json/),
          );
          if (!rm) {
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
          };
        });
      const task = new Task(
        sessionId,
        parseValues
          ? this.parseInputfile(join(directory, inputFilename))
          : undefined,
        training,
        taskId,
        date,
        results,
      );
      return toPartial ? task.toPartial() : task;
    } else {
      throw new NotFoundException();
    }
  }

  findTasks(sessionId: UUID) {
    const sessionDirectory = resolve('data', sessionId);
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
      return this.findTask(sessionId, taskId, false).run(model);
    } else {
      throw new BadRequestException();
    }
  }

  private parseInputfile = (filepath: string): number[] => {
    let values: number[];
    try {
      values = readFileSync(filepath, 'utf8')
        .replaceAll('\r\n', '\n')
        .split('\n')
        .map((value) => value.trim())
        .filter((value) => !!value?.length)
        .map((value) => Number.parseFloat(value));
    } catch {
      throw new InternalServerErrorException();
    }
    if (values.length !== 100) {
      throw new NotImplementedException();
    }
    return values;
  };

  private composedRegex = (...regexes: RegExp[]) =>
    new RegExp(regexes.map((regex) => regex.source).join(''));
}
