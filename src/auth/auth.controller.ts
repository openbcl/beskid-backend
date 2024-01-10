import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  newSession() {
    return this.authService.newSession();
  }
}
