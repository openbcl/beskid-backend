import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.guard';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('api', 301)
  redirectToSwaggerUI() {}
}
