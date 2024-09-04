import { randomUUID, UUID } from "crypto";
import { Model } from "../model/model";
import { Task, TaskDto } from "../task/task";
import { IsUUID } from "class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { JobType } from "bullmq";

export class BeskidJob {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID of job in queue',
  })
  id: UUID = randomUUID();

  @ApiProperty({ type: Task })
  task: Task;

  @ApiProperty({ type: Model })
  model: Model;

  @ApiProperty({
    type: String,
    required: false
  })
  state?: JobType | "unknown"

  constructor (task: Task, model: Model) {
    this.task = task;
    delete model.experiments;
    delete model.fds;
    this.model = model;
  }
}

export class BeskidJobDto extends PickType(BeskidJob, ['id', 'model', 'state'] as const) {
  task: TaskDto;
}

export class JobIdParam {
  @IsUUID()
  @ApiProperty({
    format: 'uuid',
    description: 'UUID example: "49f1852d-3f2b-4b89-b392-4b1cfa3e4f5c"',
  })
  jobId: UUID;
}