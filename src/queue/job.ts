import { randomUUID, UUID } from "crypto";
import { Model } from "../model/model";
import { Task } from "../task/task";
import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { JobType } from "bullmq";

export class RedisJob {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID of job in queue',
  })
  id: UUID = randomUUID();

  @ApiProperty({ type: Task })
  task: Task;

  @ApiProperty({ type: Model })
  model: Model;

  constructor (task: Task, model: Model) {
    this.task = task;
    this.model = { ...model };
    delete this.model.experiments;
    delete this.model.fds;
  }
}

export class Job {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID of job in queue',
  })
  jobId: UUID;

  @ApiProperty({
    format: 'uuid',
    description: 'UUID of corresponding task',
  })
  taskId: UUID;

  @ApiProperty({ type: Model })
  model: Model;

  @ApiProperty({ type: String })
  state: JobType | 'unknown'
}

export class JobIdParam {
  @IsUUID()
  @ApiProperty({
    format: 'uuid',
    description: 'UUID example: "49f1852d-3f2b-4b89-b392-4b1cfa3e4f5c"',
  })
  jobId: UUID;
}