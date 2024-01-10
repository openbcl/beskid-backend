import { UUID, randomUUID } from 'crypto';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { EOL } from 'os';

export class Task {
  directory: string;
  inputFilename: string;

  constructor(
    public sessionId: string,
    public values: number[],
    public training = false,
    public id: UUID = randomUUID(),
    public date = new Date(),
  ) {
    this.directory = join(
      resolve('data', this.sessionId),
      `${this.training ? '1' : '0'}_${this.id}`,
    );
    this.inputFilename = `input_${this.timestamp(date)}.txt`;
  }

  saveInputfile = () => {
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
    writeFileSync(
      join(this.directory, this.inputFilename),
      this.values.join(EOL),
      {
        encoding: 'utf8',
      },
    );
  };

  outputFileName = () => {
    return `output_${this.timestamp(new Date())}.txt`;
  };

  private timestamp = (date: Date) => {
    return date
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('T', '_')
      .replaceAll('Z', '')
      .slice(0, -4);
  };
}
