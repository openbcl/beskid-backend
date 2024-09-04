import { Controller, Get, Param, Query, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { QueueService } from "./queue.service";
import { BeskidJob, JobIdParam } from "./beskid.job";
import { UUID } from "crypto";
import { JobType } from "bullmq";

@ApiTags('Job Queue')
@ApiBearerAuth()
@Controller({
  path: 'queue',
  version: '1',
})
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @ApiResponse({
    type: [BeskidJob],
    status: 200,
    description: 'Request all jobs in queue.',
  })
  @ApiQuery({
    name: "types",
    type: [String],
    description: "Filter jobs by type (job states)",
    required: false
  })
  findJobs(
    @Request() req: { sessionId: UUID },
    @Query('types') types?: [JobType]
  ) {
    return this.queueService.findJobs(req.sessionId, types);
  }

  @Get(':jobId')
  @ApiResponse({
    type: BeskidJob,
    status: 200,
    description: 'Request a specific job of queue.',
  })
  findJob(@Request() req: { sessionId: UUID }, @Param() params: JobIdParam) {
    return this.queueService.findJob(req.sessionId, params.jobId);
  }
}