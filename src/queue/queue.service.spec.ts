import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { QueueMock } from '../../test/mocks';
import { getQueueToken } from '@nestjs/bullmq';

describe('TaskService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('job'),
          useValue: QueueMock
        }
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
