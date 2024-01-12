import { UUID, randomUUID } from 'crypto';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { execSync } from 'child_process';
import { Model } from '../model/model';
import { Logger } from '@nestjs/common';
import { encoding } from '../config';

export class Task {
  directory: string;
  inputFilename: string;

  constructor(
    public sessionId: string,
    public values: number[],
    public training = false,
    public id: UUID = randomUUID(),
    public date = new Date(),
    public results: { filename: string; date: Date; model: Model }[] = [],
  ) {
    this.directory = join(
      resolve('data', this.sessionId),
      `${this.training ? '1' : '0'}_${this.id}`,
    );
    this.inputFilename = `input_${this.timestamp(date)}.txt`;
  }

  private timestamp = (date: Date) => {
    return date
      .toISOString()
      .replaceAll(':', '-')
      .replaceAll('T', '_')
      .replaceAll('Z', '')
      .slice(0, -4);
  };

  saveInputfile = () => {
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
    writeFileSync(
      join(this.directory, this.inputFilename),
      this.values.map((value) => value.toExponential(18)).join(EOL),
      { encoding },
    );
  };

  run = (model: Model) => {
    const script = join('..', '..', '..', 'python', 'dummy_code.py');
    const date = new Date();
    const outputFileName = `output_${this.timestamp(date)}_${model.name}_${model.resolutions[0]}`;
    const process = `python ${script} ${outputFileName} ${model.name} ${this.inputFilename}`;
    const out = execSync(process, { cwd: this.directory });
    Logger.log(out.toString(encoding), `TASK: ${this.id}`);
    this.results.push({
      filename: outputFileName + '.json',
      date,
      model,
    });
    return this.toPartial();
  };

  toPartial = (): Partial<Task> => ({
    id: this.id,
    values: this.values,
    training: this.training,
    date: this.date,
    results: this.results,
  });
}
