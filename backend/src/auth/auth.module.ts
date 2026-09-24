import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PasswordResetGuard } from './guards/password-reset.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'rrce-erp-institutional-jwt-secret-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, PasswordResetGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule, RolesGuard, PasswordResetGuard],
})
export class AuthModule { }

