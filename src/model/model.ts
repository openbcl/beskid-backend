import { ApiProperty, PickType } from '@nestjs/swagger';

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

  @ApiProperty({
    type: Number,
    description: 'Available resolution',
  })
  resolution: number;

  @ApiProperty({
    type: [Experiment],
    required: false,
  })
  experiments: Experiment[];

  @ApiProperty({
    type: FDS,
    required: false,
  })
  fds: FDS;
}

export class ModelPartial extends PickType(Model, ['id', 'name', 'fds']){}
