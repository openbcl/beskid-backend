import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { ModelService } from '../model/model.service';
import { QueueService } from '../queue/queue.service';
import { QueueMock } from '../../test/mocks';

describe('TaskController', () => {
  let controller: TaskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        TaskService,
        ModelService,
        QueueService,
        {
          provide: getQueueToken('job'),
          useValue: QueueMock,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
