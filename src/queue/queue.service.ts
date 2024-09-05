import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { join } from "path";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job as BullJob, JobType, Queue, QueueEvents } from "bullmq";
import { extension, redisConnection } from '../config';
import { Task, TaskResultEvaluation } from "../task/task";
import { Model } from "../model/model";
import { Job, RedisJob } from "./job";
import { execSync } from "child_process";
import { UUID } from "crypto";

@Injectable()
@Processor('job')
export class QueueService extends WorkerHost {

  private script = join(
    process.env['scriptDir'] || join('..', '..', '..', 'python'),
    process.env['scriptFile'] || 'test.py',
  );

  private queueEvents: QueueEvents = new QueueEvents('job', { connection: redisConnection()})

  constructor(@InjectQueue('job') private jobQueue: Queue) {
    super();
    //this.cleanupQueue();
  }

  private async cleanupQueue() {
    try {
      (await this.jobQueue.getJobs()).map(job => job.remove());
    } catch {}
  }

  async appendTask(task: Task, model: Model) {
    const data = new RedisJob(task, model);
    Logger.log(`APPEND job "${data.id}"`, 'TaskService');
    const job: BullJob<RedisJob> = await this.jobQueue.add(data.id, data, {jobId: data.id});
    try {
      return await job.waitUntilFinished(this.queueEvents, 500);
    } catch {
      task.jobs = (await this.findJobsOfTask(job.data.task.id));
      return task.toDto();
    }
  }

  async process(bullJob: BullJob<RedisJob>, _token?: string): Promise<any> {
    Logger.log(`PROCESS job "${bullJob.data.id}"`, 'TaskService');
    const task = new Task(
      bullJob.data.task.sessionId,
      bullJob.data.task.values,
      bullJob.data.task.training,
      bullJob.data.task.id,
      bullJob.data.task.date,
      bullJob.data.task.results,
      bullJob.data.task.inputFilename
    )
    const date = new Date();
    const outputFileName = `output_${task.timestamp(date)}_${bullJob.data.model.name}_${
      bullJob.data.model.resolutions[0]
    }`;
    if (this.script.endsWith('test.py')) {
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
    execSync(`python ${this.script} ${outputFileName} ${bullJob.data.model.name} ${task.inputFilename}`, { cwd: task.directory });    
    task.results.push({
      filename: outputFileName + extension,
      uriFile: `/v1/tasks/${task.id}/results/${outputFileName + extension}`,
      uriData: `/v1/tasks/${task.id}/results/${outputFileName}`,
      date,
      model: bullJob.data.model,
      evaluation: TaskResultEvaluation.NEUTRAL,
    });
    task.jobs = await this.findJobsOfTask(bullJob.data.task.id, bullJob.id as UUID);
    Logger.log(`FINISHED job "${bullJob.data.id}"`, 'TaskService');
    return task.toDto();
  }
  
  async findJobs(sessionId: UUID, types?: JobType[]) {
    const bullJobs = await this.jobQueue.getJobs(types);
    return Promise.all(
      bullJobs.filter(bullJob => bullJob.data.task.sessionId === sessionId)
      .map(async bullJob => await this.toDTO(bullJob))
    );
  }
  
  async findJob(sessionId: UUID, jobId: UUID) {
    const bullJob = await this.jobQueue.getJob(jobId);
    if (bullJob.data.task.sessionId === sessionId) {
      return await this.toDTO(bullJob);
    }
    throw new NotFoundException();
  }

  private async findJobsOfTask(taskId: UUID, jobIdCompleted?: UUID) {
    return await Promise.all((await this.jobQueue.getJobs())
      .filter(bullJob => bullJob.data.task.id === taskId)
      .map(async (bullJob: BullJob<RedisJob>) => ({
        jobId: bullJob.id,
        taskId: bullJob.data.task.id,
        model: bullJob.data.model,
        state: bullJob.id === jobIdCompleted ? 'completed' : await this.jobQueue.getJobState(bullJob.id)
      }) as Job
    ))
  }

  private async toDTO(bullJob: BullJob<RedisJob>) {
    return {
      jobId: bullJob.id,
      taskId: bullJob.data.task.id,
      model: bullJob.data.model,
      state: await this.jobQueue.getJobState(bullJob.id)
    } as Job
  }

}