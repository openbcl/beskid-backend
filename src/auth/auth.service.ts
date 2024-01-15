import { Injectable } from '@nestjs/common';
import { UUID, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dataDirectory, encoding, expirationFile } from '../config';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  newSession() {
    return this.provideSession(randomUUID());
  }

  renewSession(sessionId: UUID) {
    return this.provideSession(sessionId);
  }

  private provideSession(sessionId: UUID) {
    const session = this.jwtService.sign({ sessionId });
    const decoded = this.jwtService.decode(session);
    const sessionDirectory = join(dataDirectory, sessionId);
    if (!existsSync(sessionDirectory)) {
      mkdirSync(sessionDirectory, { recursive: true });
    }
    writeFileSync(
      join(sessionDirectory, expirationFile),
      `${decoded.exp * 1000}`,
      encoding,
    );
    return session;
  }
}
