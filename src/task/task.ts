import { UUID, randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { Model } from '../model/model';
import { dataDirectory, encoding } from '../config';
import { ArrayMaxSize, ArrayMinSize, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Filename with .json extension' })
  filename: string;

  @ApiProperty({ description: 'URI of file' })
  uriFile: string;

  @ApiProperty({ description: 'URI of file content' })
  uriData: string;

  @ApiProperty({ type: Date, description: 'Date of calculation' })
  date: Date;

  @ApiProperty({ type: Model, description: 'Model used for the calculation' })
  model: Model;

  @ApiProperty({
    enum: TaskResultEvaluation,
    description: 'Evaluation of the quality of the results',
  })
  evaluation: TaskResultEvaluation;
}

export class Task {
  @IsNumber({ allowNaN: false, allowInfinity: false }, { each: true })
  @ArrayMinSize(100)
  @ArrayMaxSize(100)
  @ApiProperty({
    type: [Number],
    description: 'Array of (100) input values',
    minLength: 100,
    maxLength: 100,
  })
  values: number[];

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

  directory: string;
  inputFilename: string;

  constructor(
    public sessionId: string,
    values: number[],
    training = TaskTraining.DISABLED,
    id: UUID = randomUUID(),
    date = new Date(),
    results: TaskResult[] = [],
    inputFilename?: string
  ) {
    this.values = values;
    this.training = training;
    this.id = id;
    this.date = date;
    this.results = results;
    this.directory = join(
      dataDirectory,
      this.sessionId,
      `${this.training === TaskTraining.ENABLED ? '1' : '0'}_${this.id}`,
    );
    this.inputFilename = inputFilename || `input_${this.timestamp(date)}.txt`;
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
    training: this.training,
    date: this.date,
    results: this.results,
  });
}

export class TaskDto extends PickType(Task, [
  'id',
  'values',
  'training',
  'date',
  'results',
] as const) {}

export class CreateTaskDto extends PickType(Task, [
  'values',
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
