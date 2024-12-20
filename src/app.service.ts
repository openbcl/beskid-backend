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
          .map((sessionId) => ({ sessionId, path: join(dataDirectory, sessionId) }))
          .filter((value) => lstatSync(value.path).isDirectory())
          .map((value) => {
            const checkDelete = () => {
              const expDate = readFileSync(join(value.path, expirationFile), encoding);
              return Number.parseInt(expDate) - +new Date() <= 0;
            };
            return {
              ...value,
              delete: !readdirSync(value.path).find((name) => name === expirationFile) ? true : checkDelete(),
            };
          })
          .filter((value) => value.delete)
          .map((value) => {
            rmSync(value.path, { recursive: true, force: true });
            Logger.log(`Deleted Session ${value.sessionId}`, 'AppService');
            return value;
          })?.length || 0;
      Logger.log(`Deleted ${count} Session${count !== 1 ? 's' : ''}`, 'AppService');
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 900000));
    this.clearSessions();
  }

  async info() {
    const head = readFileSync('.git/HEAD').toString();
    const rev = head.substring(5).replace(/\n/g, '');
    const commit =
      head.indexOf(':') > -1
        ? readFileSync('.git/' + rev)
            .toString()
            .substring(0, 7)
        : null;
    const branch = commit ? rev.split('/').pop() : null;
    return {
      commit,
      branch
    };
  }
}
