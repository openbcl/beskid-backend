import { UUID, randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { Experiment, Model, ModelPartial } from '../model/model';
import { dataDirectory, encoding } from '../config';
import { IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { Job } from '../queue/job';

export enum TaskTraining {
  DISABLED = 'DISABLED',
  ENABLED = 'ENABLED',
}

export enum TaskResultEvaluation {
  NEUTRAL = 'NEUTRAL',
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
}

export enum KeepTrainingData {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
}

export class TaskResult {
  @ApiProperty({
    description: 'Filename with .json extension',
  })
  filename: string;

  @ApiProperty({
    description: 'URI of file',
  })
  uriFile: string;

  @ApiProperty({
    description: 'URI of file content',
  })
  uriData: string;

  @ApiProperty({
    type: Date,
    description: 'Date of calculation',
  })
  date: Date;

  @ApiProperty({
    type: ModelPartial,
    description: 'Model used for the calculation',
  })
  model: ModelPartial;

  @ApiProperty({
    enum: TaskResultEvaluation,
    description: 'Evaluation of the quality of the results',
  })
  evaluation: TaskResultEvaluation;
}

export class TaskSetting extends IntersectionType(
  PickType(Experiment, [ 'id' ]),
  PickType(PartialType(Experiment), [ 'name', 'conditionMU' ]),
  PickType(Model, ['resolution']),
) {
  @ApiProperty({ description: 'Experiment condition value' })
  condition: number;
}

export class Task {
  @IsNumber({ allowNaN: false, allowInfinity: false }, { each: true })
  @ApiProperty({
    type: [Number],
    description: 'Array of input values',
  })
  values: number[];

  @ApiProperty({
    type: TaskSetting,
    description:
      'Select experiment (id), the experiments condition and the number of input values (resolution)',
  })
  setting: TaskSetting;

  @ApiProperty({
    enum: TaskTraining,
    description: 'The marker indicates whether training is enabled or not.',
  })
  training: TaskTraining;

  @ApiProperty({
    format: 'uuid',
    description: 'UUID example: "49f1852d-3f2b-4b89-b392-4b1cfa3e4f5c"',
  })
  id: UUID;

  @ApiProperty({ type: Date, description: 'Date of upload' })
  date: Date;

  @ApiProperty({
    type: [TaskResult],
    description:
      'Array with the results of calculations based on various AI models',
  })
  results: TaskResult[];

  @ApiProperty({
    type: [Job],
    description: 'Array containing current jobs',
    required: false,
  })
  jobs?: Job[];

  directory: string;
  inputFilename: string;

  constructor(
    public sessionId: string,
    values: number[],
    setting: TaskSetting,
    training = TaskTraining.DISABLED,
    id: UUID = randomUUID(),
    date = new Date(),
    results: TaskResult[] = [],
    inputFilename?: string,
  ) {
    this.values = values;
    this.setting = setting;
    this.training = training;
    this.id = id;
    this.date = date;
    this.results = results;
    this.directory = join(
      dataDirectory,
      this.sessionId,
      `${this.training === TaskTraining.ENABLED ? '1' : '0'}_${this.id}`,
    );
    this.inputFilename = inputFilename || `input_${this.timestamp(date)}_${this.setting.resolution}_${this.setting.id}_${this.setting.condition}.txt`;
  }

  timestamp = (date: Date) => {
    return date
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('T', '_')
      .replaceAll('Z', '')
      .slice(0, -4);
  };

  saveInputfile = () => {
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
    writeFileSync(
      join(this.directory, this.inputFilename),
      this.values.map((value) => value.toExponential(18)).join(EOL),
      { encoding },
    );
  };

  toDto = (): TaskDto => ({
    id: this.id,
    values: this.values,
    setting: this.setting,
    training: this.training,
    date: this.date,
    results: this.results,
    jobs: this.jobs,
  });
}

export class TaskDto extends PickType(Task, [
  'id',
  'values',
  'setting',
  'training',
  'date',
  'results',
  'jobs',
] as const) {}

export class CreateTask extends PickType(Task, [
  'values',
  'setting',
  'training',
] as const) {}

export class TaskIdParam {
  @IsUUID()
  @ApiProperty({
    format: 'uuid',
    description: 'UUID example: "49f1852d-3f2b-4b89-b392-4b1cfa3e4f5c"',
  })
  taskId: UUID;
}
