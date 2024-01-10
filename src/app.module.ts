import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModelController } from './model/model.controller';
import { ModelService } from './model/model.service';
import { TaskController } from './task/task.controller';
import { TaskService } from './task/task.service';

@Module({
  imports: [],
  controllers: [AppController, ModelController, TaskController],
  providers: [AppService, ModelService, TaskService],
})
export class AppModule {}
