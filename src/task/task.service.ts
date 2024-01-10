import { Injectable } from '@nestjs/common';
import { Task } from './task';

@Injectable()
export class TaskService {
  addTask(sessionId: string, values: any) {
    const task = new Task(sessionId, values);
    task.saveInputfile();
  }
}
