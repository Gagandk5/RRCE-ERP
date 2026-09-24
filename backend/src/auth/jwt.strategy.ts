import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  role: string;
  username: string;
  isPasswordResetRequired: boolean;
  departmentId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'rrce-erp-institutional-jwt-secret-2026',
    });
  }

  async validate(payload: JwtPayload) {
    // Optionally verify user is still active in database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        studentProfile: true,
        facultyProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId,
      isPasswordResetRequired: user.isPasswordResetRequired,
      studentProfile: user.studentProfile,
      facultyProfile: user.facultyProfile,
    };
  }
}

