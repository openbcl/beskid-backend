import { UUID, randomUUID } from 'crypto';

export class Task {
  id: UUID = randomUUID();

  constructor(
    public sessionId: string,
    public input: number[],
    public training = false,
  ) {}
}
