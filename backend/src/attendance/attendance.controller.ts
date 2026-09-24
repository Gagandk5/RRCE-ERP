import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AttendanceService, RecordAttendanceDto, UpdateAttendanceDto } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PasswordResetGuard } from '../auth/guards/password-reset.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard, PasswordResetGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  @Roles(Role.FACULTY, Role.HOD, Role.PRINCIPAL)
  @Get('faculty/offerings/:id/roster')
  async getRoster(@Param('id') offeringId: string) {
    return this.attendanceService.getOfferingRoster(offeringId);
  }

  @Roles(Role.FACULTY, Role.HOD, Role.PRINCIPAL)
  @Post('faculty/attendance')
  async recordAttendance(@Request() req, @Body() body: RecordAttendanceDto) {
    return this.attendanceService.recordAttendance(body, req.user.id);
  }

  @Roles(Role.FACULTY, Role.HOD, Role.PRINCIPAL)
  @Put('faculty/attendance/:id')
  async updateAttendance(
    @Param('id') sessionId: string,
    @Body() body: UpdateAttendanceDto,
    @Request() req,
  ) {
    return this.attendanceService.updateAttendance(sessionId, body, req.user.id);
  }

  @Roles(Role.FACULTY, Role.HOD, Role.PRINCIPAL)
  @Get('faculty/offerings/:id/sessions')
  async getOfferingSessions(@Param('id') offeringId: string) {
    return this.attendanceService.getRecentSessions(offeringId);
  }

  @Roles(Role.STUDENT, Role.PARENT, Role.FACULTY, Role.HOD, Role.PRINCIPAL)
  @Get('attendance/student/:studentId')
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('courseOfferingId') courseOfferingId?: string,
  ) {
    return this.attendanceService.calculateStudentAttendance(studentId, courseOfferingId);
  }

  @Roles(Role.STUDENT)
  @Get('student/my-attendance')
  async getMyAttendance(@Request() req) {
    const studentId = req.user.studentProfile?.id;
    return this.attendanceService.calculateStudentAttendance(studentId);
  }
}

