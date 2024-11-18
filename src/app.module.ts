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
import { ConnectionOptions } from 'bullmq';

const prefix = () => process.env['redisConfigKey'] || 'beskid';

const connection = (): ConnectionOptions => {
  const password = process.env['redisPW'];
  const { ca, cert, key } = {
    ca: process.env['redisCA'],
    cert: process.env['redisClientCert'],
    key: process.env['redisClientKey'],
  };
  return {
    host: process.env['redisHost'],
    port: parseInt(process.env['redisPort']) || undefined,
    ...(!!ca?.length ? { tls: { ca, ...(!!cert?.length && !!key?.length ? { cert, key } : {}) } } : {}),
    ...(!cert?.length || (!key?.length && !!password?.length) ? { password } : {}),
  };
};

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
    BullModule.forRoot({
      connection: connection(),
      prefix: prefix(),
      defaultJobOptions: {
        removeOnComplete: { age: 3600 },
        removeOnFail: true,
        attempts: 2,
      },
    }),
    BullModule.registerQueue({
      prefix: prefix(),
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
