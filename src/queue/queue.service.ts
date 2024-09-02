import { Injectable, Logger } from "@nestjs/common";
import { join } from "path";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue, QueueEvents } from "bullmq";
import { extension, redisConnection } from '../config';
import { Task, TaskResultEvaluation } from "../task/task";
import { Model } from "../model/model";
import { BeskidJob } from "./beskid.job";
import { execSync } from "child_process";

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
  }

  async appendTask(task: Task, model: Model) {
    const data = new BeskidJob(task, model);
    Logger.log(`APPEND job "${data.id}" ...`, 'TaskService');
    const job = await this.jobQueue.add(data.id, data);
    return await job.waitUntilFinished(this.queueEvents, 10000);
  }

  async process(job: Job, _token?: string): Promise<any> {
    Logger.log(`PROCESS job "${job.data.id}" ...`, 'TaskService');
    const task = new Task(
      job.data.task.sessionId,
      job.data.task.values,
      job.data.task.training,
      job.data.task.id,
      job.data.task.date,
      job.data.task.results,
      job.data.task.inputFilename
    );
    const date = new Date();
    const outputFileName = `output_${task.timestamp(date)}_${job.data.model.name}_${
      job.data.model.resolutions[0]
    }`;
    if (this.script.endsWith('test.py')) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
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
    Logger.log(`FINISHED job "${job.data.id}" ...`, 'TaskService');
    return task.toDto();
  }
}