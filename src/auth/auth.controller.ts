import { Controller, Post, Put, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';
import { UUID } from 'crypto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  newSession() {
    return this.authService.newSession();
  }

  @ApiBearerAuth()
  @Put()
  renewSession(@Request() req: { sessionId: UUID }) {
    return this.authService.renewSession(req.sessionId);
  }
}
