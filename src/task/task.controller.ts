import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { UUID } from 'crypto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  addTask(@Request() req: { sessionId: UUID }, @Body() values: number[]) {
    return this.tasksService.addTask(req.sessionId, values);
  }

  @Get()
  findTasks(@Request() req: { sessionId: UUID }) {
    return this.tasksService.findTasks(req.sessionId);
  }

  @Get(':taskId')
  findTask(@Request() req: { sessionId: UUID }, @Param('taskId') taskId: UUID) {
    return this.tasksService.findTask(req.sessionId, taskId, true, true);
  }

  @Put(':taskId')
  editTask(
    @Request() req: { sessionId: UUID },
    @Param('taskId') taskId: UUID,
    @Body() data: { training: boolean },
  ) {
    return this.tasksService.editTask(req.sessionId, taskId, data.training);
  }

  @Delete(':taskId')
  deleteTask(
    @Request() req: { sessionId: UUID },
    @Param('taskId') taskId: UUID,
  ) {
    return this.tasksService.deleteTask(req.sessionId, taskId);
  }

  @Post('/:taskId/model/:modelId/resolution/:resolution')
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

  @Get('/:taskId/results/:file')
  findTaskResult(
    @Request() req: { sessionId: UUID },
    @Param('taskId') taskId: UUID,
    @Param('file') file: string,
  ) {
    return this.tasksService.findTaskResult(req.sessionId, taskId, file);
  }

  @Put('/:taskId/results/:file')
  evaluateTaskResult(
    @Request() req: { sessionId: UUID },
    @Param('taskId') taskId: UUID,
    @Param('file') file: string,
    @Body() data: { evaluation: number },
  ) {
    return this.tasksService.evaluateTaskResult(
      req.sessionId,
      taskId,
      file,
      data.evaluation,
    );
  }
}
