import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { join } from "path";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job as BullJob, JobType, Queue, QueueEvents } from "bullmq";
import { extension, redisConnection, redisPrefix } from '../config';
import { Task, TaskResult, TaskResultEvaluation } from "../task/task";
import { ModelPartial } from "../model/model";
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

  private queueEvents: QueueEvents = new QueueEvents('job', {
    connection: redisConnection(),
    prefix: redisPrefix()
  })

  constructor(@InjectQueue('job') private jobQueue: Queue) {
    super();
    //this.jobQueue.clean(0, 0);
  }

  async appendTask(task: Task, model: ModelPartial) {
    const data = new RedisJob(task, model);
    Logger.log(`APPEND job "${data.id}"`, 'TaskService');
    const bullJob: BullJob<RedisJob> = await this.jobQueue.add(data.id, data, {jobId: data.id});
    task.jobs = (await this.findJobsOfTask(bullJob.data.task.id)).map(job => {
      if (job.jobId === bullJob.data.id && job.state === 'completed') {
        job.state = 'active';
      }
      return job
    });
    return task.toDto();
  }

  async process(bullJob: BullJob<RedisJob>, _token?: string) {
    Logger.log(`PROCESS job "${bullJob.data.id}"`, 'TaskService');
    const task = new Task(
      bullJob.data.task.sessionId,
      bullJob.data.task.values,
      bullJob.data.task.setting,
      bullJob.data.task.training,
      bullJob.data.task.id,
      bullJob.data.task.date,
      bullJob.data.task.results,
      bullJob.data.task.inputFilename
    )
    const date = new Date();
    const outputFileName = `output_${task.timestamp(date)}_${bullJob.data.model.name}`;
    if (this.script.endsWith('test.py')) {
      await new Promise((resolve) => setTimeout(resolve, Math.floor(10000 * Math.random())));
    }
    execSync(`python ${this.script} ${outputFileName} ${bullJob.data.model.name} ${task.inputFilename}`, { cwd: task.directory });    
    const result = {
      filename: outputFileName + extension,
      uriFile: `/v1/tasks/${task.id}/results/${outputFileName + extension}`,
      uriData: `/v1/tasks/${task.id}/results/${outputFileName}`,
      date,
      model: bullJob.data.model,
      evaluation: TaskResultEvaluation.NEUTRAL,
    };
    task.results.push(result);
    bullJob.updateData({
      ...bullJob.data,
      task: {
        ...bullJob.data.task,
        results: [ result ]
      }
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

  async deleteJobByFilename(sessionId: UUID, filename: string) {
    const bullJob = (await this.jobQueue.getJobs())
    .filter(bullJob => bullJob.data.task.sessionId === sessionId)
    .find(bullJob => bullJob.data.task.results
      .find((result: TaskResult) => result.filename === filename)
    );
    if (!!bullJob) {
      await this.jobQueue.remove(bullJob.id);
    }
  }

  async deleteJob(jobId: UUID) {
    return await this.jobQueue.remove(jobId);
  }

  private async findJobsOfTask(taskId: UUID, jobIdCompleted?: UUID) {
    return await Promise.all((await this.jobQueue.getJobs())
      .filter(bullJob => bullJob.data.task.id === taskId)
      .map(async (bullJob: BullJob<RedisJob>) => ({
        jobId: bullJob.id,
        taskId: bullJob.data.task.id,
        model: bullJob.data.model,
        state: bullJob.id === jobIdCompleted ? 'completed' : await this.jobQueue.getJobState(bullJob.id)
      }) as Job)
    )
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