import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModelController } from './model/model.controller';
import { ModelService } from './model/model.service';
import { TaskController } from './task/task.controller';
import { TaskService } from './task/task.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { randomBytes } from 'crypto';
import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';
import { redisConnection } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env['tokenSecret'] || randomBytes(256).toString('base64'),
      signOptions: { expiresIn: process.env['tokenExpirationTime'] || '7d' },
    }),
    BullModule.forRoot(process.env['redisConfigKey'] || 'beskid', {
      connection: redisConnection(),
      defaultJobOptions: {
        removeOnComplete: {
          age: 30
        },
        removeOnFail: true,
        attempts: 2,
      },
    }),
    BullModule.registerQueue({
      configKey: process.env['redisConfigKey'] || 'beskid',
      name: 'job',
    }),
  ],
  controllers: [AppController, ModelController, TaskController, AuthController, QueueController],
  providers: [
    AppService,
    ModelService,
    TaskService,
    AuthService,
    QueueService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
