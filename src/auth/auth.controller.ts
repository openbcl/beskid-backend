import { Controller, Post, Put, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';
import { UUID } from 'crypto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from './auth';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiResponse({
    type: Auth,
    description: `Obtain JSON web token (JWT) required to login. As soon as the token loses its validity, all associated user data is deleted. However, evaluated data that you may have previously released for AI training will not be deleted.`,
    status: 201,
  })
  @Post()
  newSession() {
    return this.authService.newSession();
  }

  @ApiBearerAuth()
  @ApiResponse({
    type: Auth,
    description: `Obtain a refreshed JSON web token (JWT) for your session. This request should be executed regularly so that the session does not expire and user data is not deleted.`,
    status: 200,
  })
  @Put()
  renewSession(@Request() req: { sessionId: UUID }) {
    return this.authService.renewSession(req.sessionId);
  }
}
