import { Injectable } from '@nestjs/common';
import { Task } from './task';

@Injectable()
export class TaskService {
  add(sessionId: string, values: any) {
    console.log(new Task(sessionId, values));
  }
}
