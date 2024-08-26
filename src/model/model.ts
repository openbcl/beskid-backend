import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ type: Scale})
  scale: Scale;
}

export class Model {
  @ApiProperty({ type: Number, description: 'Decimal identifier', minimum: 1 })
  id: number;

  @ApiProperty({ description: 'AI model name (identifier)' })
  name: string;

  @ApiProperty({
    type: [Number],
    description: 'Available resolutions',
    default: [100],
  })
  resolutions: number[];

  @ApiProperty({ type: [Experiment] })
  experiments: Experiment[];

  @ApiProperty({ type: [FDS] })
  fds: FDS[];
}
