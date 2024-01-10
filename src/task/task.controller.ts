import { Body, Controller, Post } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  add(@Body() values: number[]) {
    this.tasksService.add(values);
  }

  @Post('upload')
  upload() {
    this.tasksService.upload('upload');
  }
}
