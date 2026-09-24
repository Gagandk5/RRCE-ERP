import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
        isActive: true,
      },
      include: {
        department: true,
        studentProfile: true,
        facultyProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(identifier: string, pass: string) {
    const user = await this.validateUser(identifier, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }

    const payload = {
      sub: user.id,
      role: user.role,
      username: user.username,
      isPasswordResetRequired: user.isPasswordResetRequired,
      departmentId: user.departmentId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isPasswordResetRequired: user.isPasswordResetRequired,
        departmentId: user.departmentId,
        studentProfile: user.studentProfile,
        facultyProfile: user.facultyProfile,
      },
    };
  }

  async changePassword(userId: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPass, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        isPasswordResetRequired: false,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_RESET_COMPLETED',
        targetId: userId,
        metaJson: { timestamp: new Date().toISOString() },
      },
    });

    const payload = {
      sub: updatedUser.id,
      role: updatedUser.role,
      username: updatedUser.username,
      isPasswordResetRequired: false,
      departmentId: updatedUser.departmentId,
    };

    return {
      success: true,
      message: 'Password successfully updated. Mandatory reset condition cleared.',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        isPasswordResetRequired: false,
      },
    };
  }

  async switchDemoRole(role: Role) {
    let email = 'principal@rrce.org';
    if (role === Role.ADMISSION_OFFICE) {
      email = 'admissions@rrce.org';
    } else if (role === Role.HOD) {
      email = 'hod.bca@rrce.org';
    } else if (role === Role.FACULTY) {
      email = 'faculty.math@rrce.org';
    } else if (role === Role.STUDENT) {
      email = '1RR25BC007@rrce.org';
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        studentProfile: true,
        facultyProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Demo user for role ${role} not found in database`);
    }

    const payload = {
      sub: user.id,
      role: user.role,
      username: user.username,
      isPasswordResetRequired: user.isPasswordResetRequired,
      departmentId: user.departmentId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isPasswordResetRequired: user.isPasswordResetRequired,
        departmentId: user.departmentId,
        studentProfile: user.studentProfile,
        facultyProfile: user.facultyProfile,
      },
    };
  }
}

