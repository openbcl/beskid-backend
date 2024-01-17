import { ApiProperty } from '@nestjs/swagger';

export class Model {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [Number] })
  resolutions: number[];
}
