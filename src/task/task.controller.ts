import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { UUID } from 'crypto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  addTask(@Request() req: { sessionId: UUID }, @Body() values: number[]) {
    return this.tasksService.addTask(req.sessionId, values);
  }

  @Get(':taskId')
  findTask(@Request() req: { sessionId: UUID }, @Param('taskId') taskId: UUID) {
    return this.tasksService.findTask(req.sessionId, taskId, true, true);
  }

  @Post('/:taskId/model/:modelId/:resolution')
  runTask(
    @Request() req: { sessionId: UUID },
    @Param('taskId') taskId: UUID,
    @Param('modelId') modelId: number,
    @Param('resolution') resolution: number,
  ) {
    return this.tasksService.runTask(
      req.sessionId,
      taskId,
      modelId,
      resolution,
    );
  }
}
