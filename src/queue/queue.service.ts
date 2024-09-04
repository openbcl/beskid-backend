import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { join } from "path";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, JobType, Queue, QueueEvents } from "bullmq";
import { extension, redisConnection } from '../config';
import { Task, TaskResultEvaluation } from "../task/task";
import { Model } from "../model/model";
import { BeskidJob, BeskidJobDto } from "./beskid.job";
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
    //this.cleanup();
  }

  private async cleanup() {
    try {
      (await this.jobQueue.getJobs()).map(job => job.remove());
    } catch {}
  }

  async appendTask(task: Task, model: Model) {
    const data = new BeskidJob(task, model);
    Logger.log(`APPEND job "${data.id}"`, 'TaskService');
    const job = await this.jobQueue.add(data.id, data, {jobId: data.id});
    try {
      return await job.waitUntilFinished(this.queueEvents, 500);
    } catch {
      const taskDTO = task.toDto();
      taskDTO.results.push({
        id: job.data.id,
        model: job.data.model,
        evaluation: TaskResultEvaluation.NEUTRAL,
      })
      return taskDTO;
    }
  }

  async process(job: Job, _token?: string): Promise<any> {
    Logger.log(`PROCESS job "${job.data.id}"`, 'TaskService');
    const task = this.initTask(job);
    const date = new Date();
    const outputFileName = `output_${task.timestamp(date)}_${job.data.model.name}_${
      job.data.model.resolutions[0]
    }`;
    if (this.script.endsWith('test.py')) {
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
    execSync(`python ${this.script} ${outputFileName} ${job.data.model.name} ${task.inputFilename}`, { cwd: task.directory });    
    task.results.push({
      filename: outputFileName + extension,
      uriFile: `/v1/tasks/${task.id}/results/${outputFileName + extension}`,
      uriData: `/v1/tasks/${task.id}/results/${outputFileName}`,
      date,
      model: job.data.model,
      evaluation: TaskResultEvaluation.NEUTRAL,
    });
    Logger.log(`FINISHED job "${job.data.id}"`, 'TaskService');
    return task.toDto();
  }
  
  async findJobs(sessionId: UUID, types?: JobType[]) {
    const jobs = await this.jobQueue.getJobs(types);
    return Promise.all(
      jobs.filter(job => job.data.task.sessionId === sessionId)
      .map(async job => await this.toBeskidJobDTO(job))
    );
  }
  
  async findJob(sessionId: UUID, jobId: UUID) {
    const job = await this.jobQueue.getJob(jobId);
    if (job.data.task.sessionId === sessionId) {
      return await this.toBeskidJobDTO(job)
    }
    throw new NotFoundException();
  }

  private async toBeskidJobDTO(job: Job): Promise<BeskidJobDto> {
    return {
      id: job.data.id,
      task: this.initTask(job).toDto(),
      model: job.data.model,
      state: await job.getState(),
    }
  }

  private initTask(job: Job) {
    return new Task(
      job.data.task.sessionId,
      job.data.task.values,
      job.data.task.training,
      job.data.task.id,
      job.data.task.date,
      job.data.task.results,
      job.data.task.inputFilename
    );
  }
}