import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class PasswordResetGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.isPasswordResetRequired) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: 'PASSWORD_CHANGE_REQUIRED',
          details: 'Mandatory password reset required before accessing operational routes. Please update password via POST /api/auth/change-password.',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}

