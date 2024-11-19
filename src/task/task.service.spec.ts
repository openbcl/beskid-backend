import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { TaskService } from './task.service';
import { QueueService } from '../queue/queue.service';
import { ModelService } from '../model/model.service';
import { QueueMock } from '../../test/mocks';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        ModelService,
        QueueService,
        {
          provide: getQueueToken('job'),
          useValue: QueueMock
        }
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
