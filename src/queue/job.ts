import { randomUUID, UUID } from "crypto";
import { ModelPartial } from "../model/model";
import { Task } from "../task/task";
import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { JobType } from "bullmq";

export class RedisJob {
  id: UUID = randomUUID();
  task: Task;
  model: ModelPartial;

  constructor (task: Task, model: ModelPartial) {
    this.task = task;
    this.model = { ...model };
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

  @ApiProperty({
    type: ModelPartial,
    description: 'Model used for the calculation'
  })
  model: ModelPartial;

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