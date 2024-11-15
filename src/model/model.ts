import { ApiProperty, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class FDS {
  @ApiProperty({ description: 'FDS Version' })
  version: string;
  @ApiProperty({ description: 'FDS Revision' })
  revision: string;
}

export class Scale {
  @ApiProperty({ description: 'Scale name' })
  name: string;
  @ApiProperty({ description: 'Scale description' })
  desc: string;
}

export class Experiment {
  @ApiProperty({ description: 'Experiment id' })
  id: string;

  @ApiProperty({ description: 'Experiment name' })
  name: string;

  @ApiProperty({ type: Scale })
  scale: Scale;

  @ApiProperty({ description: 'Condition measurement unit' })
  conditionMU: string;

  @ApiProperty({ type: [Number], description: 'Conditions' })
  conditions: number[];
}

export class Model {
  @ApiProperty({ type: Number, description: 'Decimal identifier', minimum: 1 })
  id: number;

  @ApiProperty({ description: 'AI model name (identifier)' })
  name: string;

  @ApiProperty({ description: 'AI model description' })
  description: string;

  @ApiProperty({ type: Number, description: 'Available resolution' })
  resolution: number;

  @ApiProperty({ type: [Experiment] })
  experiments: Experiment[];

  @ApiProperty({ type: FDS })
  fds: FDS;

  @ApiProperty({ type: Boolean, description: 'Indicates whether FDS template is available' })
  hasTemplate: boolean;

  @Exclude()
  templatePath?: string;

  @ApiProperty({ type: Boolean, description: 'Disabled models are not available for new calculations.' })
  disabled: boolean;

  constructor(partial: Partial<Model>) {
    Object.assign(this, partial);
  }
}

export class ModelPartial extends PickType(Model, ['id', 'name', 'fds', 'hasTemplate', 'disabled']){}
