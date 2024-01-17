import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { UUID } from 'crypto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateTaskDto,
  TaskIdParam,
  TaskResultEvaluation,
  TaskTraining,
} from './task';

@ApiTags('Manage Tasks')
@ApiBearerAuth()
@Controller({
  path: 'tasks',
  version: '1',
})
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @Post()
  addTask(@Request() req: { sessionId: UUID }, @Body() task: CreateTaskDto) {
    return this.tasksService.addTask(req.sessionId, task.values);
  }

  @Get()
  findTasks(@Request() req: { sessionId: UUID }) {
    return this.tasksService.findTasks(req.sessionId);
  }

  @Get(':taskId')
  findTask(@Request() req: { sessionId: UUID }, @Param() params: TaskIdParam) {
    return this.tasksService.findTask(req.sessionId, params.taskId, true, true);
  }

  @Put(':taskId')
  @ApiQuery({ name: 'training', enum: TaskTraining })
  editTask(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Query('training') training: TaskTraining,
  ) {
    return this.tasksService.editTask(req.sessionId, params.taskId, training);
  }

  @Delete(':taskId')
  deleteTask(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
  ) {
    return this.tasksService.deleteTask(req.sessionId, params.taskId);
  }

  @Post('/:taskId/model/:modelId/resolution/:resolution')
  runTask(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Param('modelId') modelId: number,
    @Param('resolution') resolution: number,
  ) {
    return this.tasksService.runTask(
      req.sessionId,
      params.taskId,
      modelId,
      resolution,
    );
  }

  @Get('/:taskId/results/:fileId')
  findTaskResult(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Param('fileId') fileId: string,
  ) {
    return this.tasksService.findTaskResult(
      req.sessionId,
      params.taskId,
      fileId,
    );
  }

  @Put('/:taskId/results/:fileId')
  @ApiQuery({ name: 'evaluation', enum: TaskResultEvaluation })
  evaluateTaskResult(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Param('fileId') fileId: string,
    @Query('evaluation') evaluation: TaskResultEvaluation,
  ) {
    return this.tasksService.evaluateTaskResult(
      req.sessionId,
      params.taskId,
      fileId,
      evaluation,
    );
  }
}
