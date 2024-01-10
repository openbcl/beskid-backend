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

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env['tokenSecret'],
      signOptions: { expiresIn: process.env['tokenExpirationTime'] },
    }),
  ],
  controllers: [AppController, ModelController, TaskController, AuthController],
  providers: [
    AppService,
    ModelService,
    TaskService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
