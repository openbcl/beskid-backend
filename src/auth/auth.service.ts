import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  newSession() {
    return this.jwtService.sign({ sessionId: randomUUID() });
  }
}
