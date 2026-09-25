import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Role } from '@prisma/client';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() body: { identifier: string; password: string; requestedRole?: Role }) {
    return this.authService.login(body.identifier, body.password, body.requestedRole);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() body: { newPassword: string }) {
    return this.authService.changePassword(req.user.id, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('demo-switch')
  async demoSwitch(@Body() body: { role: Role }) {
    return this.authService.switchDemoRole(body.role);
  }
}

