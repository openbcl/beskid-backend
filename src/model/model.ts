import { ApiProperty } from '@nestjs/swagger';

export class Model {
  @ApiProperty({ type: Number, description: 'Decimal identifier', minimum: 1 })
  id: number;

  @ApiProperty({ description: 'Name of the AI model (identifier)' })
  name: string;

  @ApiProperty({
    type: [Number],
    description: 'Available resolutions',
    default: [100],
  })
  resolutions: number[];
}
