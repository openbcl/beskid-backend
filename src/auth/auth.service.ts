import { Injectable, Logger } from '@nestjs/common';
import { UUID, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dataDirectory, encoding, expirationFile } from '../config';
import { Auth } from './auth';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  newSession() {
    const { token, sessionId } = this.provideSession();
    Logger.log(`Init new session "${sessionId}"`, 'AuthService');
    return new Auth(token);
  }

  renewSession(sessionId: UUID) {
    const { token } = this.provideSession(sessionId);
    Logger.log(`Renew session "${sessionId}"`, 'AuthService');
    return new Auth(token);
  }

  private provideSession(sessionId: UUID = randomUUID()) {
    const token = this.jwtService.sign({ sessionId });
    const decoded = this.jwtService.decode(token);
    const sessionDirectory = join(dataDirectory, sessionId);
    if (!existsSync(sessionDirectory)) {
      mkdirSync(sessionDirectory, { recursive: true });
    }
    writeFileSync(
      join(sessionDirectory, expirationFile),
      `${decoded.exp * 1000}`,
      encoding,
    );
    return { token, sessionId };
  }
}
