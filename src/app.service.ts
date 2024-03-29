import { Injectable, Logger } from '@nestjs/common';
import { lstatSync, readFileSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { dataDirectory, encoding, expirationFile } from './config';

@Injectable()
export class AppService {
  constructor() {
    this.clearSessions();
  }

  async clearSessions() {
    Logger.log('Searching for expired sessions...', 'AppService');
    try {
      const count =
        readdirSync(dataDirectory)
          .map((sessionID) => ({
            sessionID,
            path: join(dataDirectory, sessionID),
          }))
          .filter((value) => lstatSync(value.path).isDirectory())
          .map((value) => {
            const checkDelete = () => {
              const expDate = readFileSync(
                join(value.path, expirationFile),
                encoding,
              );
              return Number.parseInt(expDate) - +new Date() <= 0;
            };
            return {
              ...value,
              delete: !readdirSync(value.path).find(
                (name) => name === expirationFile,
              )
                ? true
                : checkDelete(),
            };
          })
          .filter((value) => value.delete)
          .map((value) => {
            rmSync(value.path, { recursive: true, force: true });
            Logger.log(`Deleted Session ${value.sessionID}`, 'AppService');
            return value;
          })?.length || 0;
      Logger.log(
        `Deleted ${count} Session${count !== 1 ? 's' : ''}`,
        'AppService',
      );
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 900000));
    this.clearSessions();
  }
}
