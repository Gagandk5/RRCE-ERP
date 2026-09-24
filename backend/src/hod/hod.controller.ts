import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { HodService, ApproveFacultyLeaveDto } from './hod.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/hod')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HodController {
  constructor(private readonly hodService: HodService) { }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Get('leaves/pending')
  async getPendingLeaves(@Request() req) {
    return this.hodService.getPendingLeaves(req.user.id, req.user.departmentId);
  }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Post('leaves/:id/approve-faculty')
  async approveFacultyLeave(
    @Param('id') leaveId: string,
    @Body() body: ApproveFacultyLeaveDto,
    @Request() req,
  ) {
    return this.hodService.approveFacultyLeave(leaveId, body, req.user.id);
  }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Post('leaves/:id/approve-student')
  async approveStudentLeave(@Param('id') leaveId: string, @Request() req) {
    return this.hodService.approveStudentLeave(leaveId, req.user.id);
  }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Post('leaves/:id/reject')
  async rejectLeave(
    @Param('id') leaveId: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    return this.hodService.rejectLeave(leaveId, req.user.id, body.reason);
  }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Get('exams')
  async getDepartmentExams(@Request() req) {
    return this.hodService.getDepartmentExams(req.user.id, req.user.departmentId);
  }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Post('exams/:id/verify')
  async verifyExam(@Param('id') examScheduleId: string, @Request() req) {
    return this.hodService.verifyExamMarks(examScheduleId, req.user.id);
  }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Get('available-faculties')
  async getAvailableFaculties(@Request() req) {
    return this.hodService.getDepartmentFaculties(req.user.id);
  }
}

