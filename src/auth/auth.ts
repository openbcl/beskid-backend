import { ApiProperty } from '@nestjs/swagger';

export class Auth {
  @ApiProperty({ description: 'JSON web token (JWT) ' })
  token: string;

  constructor(token: string) {
    this.token = token;
  }
}
