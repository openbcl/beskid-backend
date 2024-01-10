import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModelController } from './model/model.controller';
import { ModelService } from './model/model.service';

@Module({
  imports: [],
  controllers: [AppController, ModelController],
  providers: [AppService, ModelService],
})
export class AppModule {}
