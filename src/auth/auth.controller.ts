import { Controller, Post, Put, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';
import { UUID } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  newSession() {
    return this.authService.newSession();
  }

  @Put()
  renewSession(@Request() req: { sessionId: UUID }) {
    return this.authService.renewSession(req.sessionId);
  }
}
