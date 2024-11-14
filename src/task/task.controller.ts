import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { UUID } from 'crypto';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateTask,
  KeepTrainingData,
  Task,
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
  @ApiResponse({
    type: Task,
    status: 201,
    description: 'Upload input values for new task.',
  })
  addTask(
    @Request() req: { sessionId: UUID },
    @Body() createTask: CreateTask,
  ) {
    return this.tasksService.addTask(req.sessionId, createTask);
  }

  @Get()
  @ApiResponse({
    type: [Task],
    status: 200,
    description: 'Request all available tasks (input values excluded).',
  })
  findTasks(@Request() req: { sessionId: UUID }) {
    return this.tasksService.findTasks(req.sessionId);
  }

  @Get(':taskId')
  @ApiResponse({
    type: Task,
    status: 200,
    description: 'Request a selected task (input values included).',
  })
  findTask(@Request() req: { sessionId: UUID }, @Param() params: TaskIdParam) {
    return this.tasksService.findTask(req.sessionId, params.taskId, true, true);
  }

  @Put(':taskId')
  @ApiResponse({
    type: Task,
    status: 200,
    description:
      'Enable or disbale training for a selected task. If the training was previously enabled, any analysed training data will be deleted.',
  })
  @ApiQuery({ name: 'training', enum: TaskTraining })
  editTask(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Query('training') training: TaskTraining,
  ) {
    return this.tasksService.editTask(req.sessionId, params.taskId, training);
  }

  @Delete(':taskId')
  @ApiResponse({
    status: 200,
    description:
      'Delete a selected task and all usage data. If the training was previously enabled, the analysed training data is retained.',
  })
  deleteTask(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
  ) {
    return this.tasksService.deleteTask(req.sessionId, params.taskId);
  }

  @Post('/:taskId/model/:modelId')
  @ApiResponse({
    type: Task,
    status: 201,
    description:
      'Start a selected task by selecting an AI model and resolution.',
  })
  runTask(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Param('modelId') modelId: number,
  ) {
    return this.tasksService.runTask(
      req.sessionId,
      params.taskId,
      modelId,
    );
  }

  @Get('/:taskId/results/:fileId')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  @ApiResponse({
    status: 200,
    description:
      'Retrieve results of a task. If you specify the filename including its extension as fileId, the results file is provided as a download. If you only specify the filename without its extension, the content of the file is returned in JSON format.',
  })
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

  @Get('/:taskId/results/:fileId/template-data')
  @ApiResponse({
    type: String,
    status: 200,
    description:
      'Converts results of a task into FDS plaintext template.',
  })
  findTaskResultTemplateData(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Param('fileId') fileId: string,
  ) {
    return this.tasksService.findTaskResultTemplateData(
      req.sessionId,
      params.taskId,
      fileId,
    );
  }

  @Get('/:taskId/results/:fileId/template-file')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  @ApiResponse({
    status: 200,
    description:
      'Converts results of a task into FDS template file.',
  })
  findTaskResultTemplateFile(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Param('fileId') fileId: string,
  ) {
    return this.tasksService.findTaskResultTemplateFile(
      req.sessionId,
      params.taskId,
      fileId,
    );
  }

  @Put('/:taskId/results/:fileId')
  @ApiQuery({ name: 'evaluation', enum: TaskResultEvaluation })
  @ApiResponse({
    type: Task,
    status: 200,
    description:
      'Evaluate a result of a task where training is enabled. Both the file name with and without file extension can be specified as fileID. If you select "POSITIVE", you are telling the AI system that everything was done correctly. If you select "NEGATIVE", you are telling the AI system that something went wrong. If you select "NEUTRAL", the result will no longer be passed on to the AI system.',
  })
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

  @Delete('/:taskId/results/:fileId')
  @ApiQuery({ name: 'keepTrainingData', enum: KeepTrainingData })
  @ApiResponse({
    status: 200,
    description:
      'Deletes result of a task. Both the file name with and without file extension can be specified as fileID. With the "keepTrainingData" setting, you can decide whether the corresponding evaluated training data should also be deleted.',
  })
  deleteTaskResult(
    @Request() req: { sessionId: UUID },
    @Param() params: TaskIdParam,
    @Param('fileId') fileId: string,
    @Query('keepTrainingData') keepTrainingData: KeepTrainingData,
  ) {
    return this.tasksService.deleteTaskResult(
      req.sessionId,
      params.taskId,
      fileId,
      keepTrainingData === KeepTrainingData.TRUE,
    );
  }
}
