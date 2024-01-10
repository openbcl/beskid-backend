import { Body, Controller, Post, Request } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  add(@Request() req: { sessionId: string }, @Body() values: number[]) {
    this.tasksService.addTask(req.sessionId, values);
  }
}
