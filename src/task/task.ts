import { UUID, randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { Experiment, Model, ModelPartial } from '../model/model';
import { dataDirectory, encoding } from '../config';
import { IsEnum, IsNumber, IsUUID, registerDecorator } from 'class-validator';
import { ApiProperty, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { Job } from '../queue/job';
import { Exclude } from 'class-transformer';

const IsTaskSetting = () => {
  return (object: any, propertyName: string) =>
    registerDecorator({
      name: 'IsSetting',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: any) {
          return (
            'id' in value &&
            typeof value.id === 'string' &&
            'resolution' in value &&
            typeof value.resolution === 'number' &&
            'condition' in value &&
            typeof value.condition === 'number'
          );
        },
      },
    });
};

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

  @ApiProperty({ type: ModelPartial, description: 'Model used for the calculation' })
  model: ModelPartial;

  @ApiProperty({ enum: TaskResultEvaluation, description: 'Evaluation of the quality of the results' })
  evaluation: TaskResultEvaluation;
}

export class TaskSetting extends IntersectionType(
  PickType(Experiment, ['id']),
  PickType(PartialType(Experiment), ['name', 'conditionMU']),
  PickType(Model, ['resolution'])
) {
  @ApiProperty({ description: 'Experiment condition value' })
  condition: number;
}

export class Task {
  @IsNumber({ allowNaN: false, allowInfinity: false }, { each: true })
  @ApiProperty({ type: [Number], description: 'Array of input values' })
  values: number[];

  @IsTaskSetting()
  @ApiProperty({
    type: TaskSetting,
    description: 'Select experiment (id), the experiments condition and the number of input values (resolution)',
  })
  setting: TaskSetting;

  @IsEnum(TaskTraining)
  @ApiProperty({ enum: TaskTraining, description: 'The marker indicates whether training is enabled or not.' })
  training: TaskTraining;

  @ApiProperty({ format: 'uuid', description: 'UUID example: "49f1852d-3f2b-4b89-b392-4b1cfa3e4f5c"' })
  id: UUID;

  @ApiProperty({ type: Date, description: 'Date of upload' })
  date: Date;

  @ApiProperty({ type: [TaskResult], description: 'Array with the results of calculations based on various AI models' })
  results: TaskResult[];

  @ApiProperty({ type: [Job], description: 'Array containing current jobs', required: false })
  jobs?: Job[];

  @Exclude()
  sessionId: UUID;

  @Exclude()
  directory: string;

  @Exclude()
  inputFilename: string;

  constructor(
    sessionId: UUID,
    values: number[],
    setting: TaskSetting,
    training = TaskTraining.DISABLED,
    id: UUID = randomUUID(),
    date = new Date(),
    results: TaskResult[] = [],
    inputFilename?: string
  ) {
    this.sessionId = sessionId;
    this.values = values;
    this.setting = setting;
    this.training = training;
    this.id = id;
    this.date = date;
    this.results = results;
    this.directory = join(dataDirectory, sessionId, `${this.training === TaskTraining.ENABLED ? '1' : '0'}_${this.id}`);
    this.inputFilename = inputFilename || `input_${this.timestamp(date)}_${this.setting.resolution}_${this.setting.id}_${this.setting.condition}.txt`;
  }

  @Exclude()
  timestamp = (date: Date) => date.toISOString().replaceAll(':', '-').replaceAll('T', '_').replaceAll('Z', '').slice(0, -4);

  @Exclude()
  saveInputfile = () => {
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
    writeFileSync(join(this.directory, this.inputFilename), this.values.map((value) => value.toExponential(18)).join(EOL), { encoding });
  };
}

export class CreateTask extends PickType(Task, ['values', 'setting', 'training'] as const) {}

export class TaskIdParam {
  @IsUUID()
  @ApiProperty({ format: 'uuid',  description: 'UUID example: "49f1852d-3f2b-4b89-b392-4b1cfa3e4f5c"' })
  taskId: UUID;
}
