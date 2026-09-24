import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrincipalService, ReassignOfferingDto, SoftDeleteStudentDto, CondoneAttendanceDto } from './principal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/principal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PRINCIPAL)
export class PrincipalController {
  constructor(private readonly principalService: PrincipalService) { }

  @Get('stats')
  async getCampusStats() {
    return this.principalService.getCampusStats();
  }

  @Get('offerings')
  async getAllOfferings() {
    return this.principalService.getAllOfferings();
  }

  @Get('faculties')
  async getAllFaculties() {
    return this.principalService.getAllFaculties();
  }

  @Get('audit-logs')
  async getAuditLogs() {
    return this.principalService.getAllAuditLogs();
  }

  @Post('reassign-offering')
  async reassignOffering(@Body() body: ReassignOfferingDto, @Request() req) {
    return this.principalService.reassignOffering(body, req.user.id);
  }

  @Delete('students/:id')
  async softDeleteStudent(
    @Param('id') studentId: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    return this.principalService.softDeleteStudent(
      { studentId, reason: body.reason },
      req.user.id,
    );
  }

  @Post('condone-attendance')
  async condoneAttendance(@Body() body: CondoneAttendanceDto, @Request() req) {
    return this.principalService.condoneAttendance(body, req.user.id);
  }

  @Post('exams/:id/publish')
  async publishExam(@Param('id') examScheduleId: string, @Request() req) {
    return this.principalService.publishExamResults(examScheduleId, req.user.id);
  }
}

