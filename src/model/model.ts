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

export class ExperimentCondition {
  @ApiProperty({ description: 'Condition key' })
  id: string;

  @ApiProperty({ description: 'Condition label (includes unit)' })
  label: string;

  @ApiProperty({ type: [Number], description: 'Available condition values' })
  values: number[];
}

export class Experiment {
  @ApiProperty({ description: 'Experiment id' })
  id: string;

  @ApiProperty({ description: 'Experiment name' })
  name: string;

  @ApiProperty({ type: Scale })
  scale: Scale;

  @ApiProperty({ type: [ExperimentCondition], description: 'Configurable experiment conditions' })
  conditions: ExperimentCondition[];
}

export class Template {
  @Exclude()
  templatePath: string;
  @ApiProperty({ description: 'Corresponding experiment ID' })
  experimentId: string;
  @ApiProperty({ description: 'Legacy single template condition', required: false })
  condition?: number;

  @ApiProperty({
    description: 'Template conditions keyed by condition id',
    type: 'object',
    additionalProperties: {
      oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' } }],
    },
    required: false,
  })
  conditions?: Record<string, number | number[]>;

  constructor(partial: Partial<Template>) {
    Object.assign(this, partial);
  }
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

  @ApiProperty({ type: [Template], description: 'Available FDS templates' })
  templates: Template[];

  @ApiProperty({ type: Boolean, description: 'Disabled models are not available for new calculations.' })
  disabled: boolean;

  constructor(partial: Partial<Model>) {
    Object.assign(this, partial);
  }
}

export class ModelPartial extends PickType(Model, ['id', 'name', 'fds', 'disabled']){}
