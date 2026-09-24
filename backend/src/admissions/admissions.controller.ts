import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { AdmissionsService, EnrollStudentDto, ReallocateBranchDto } from './admissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Roles(Role.ADMISSION_OFFICE, Role.PRINCIPAL)
  @Post('enroll')
  async enroll(@Request() req, @Body() body: EnrollStudentDto) {
    return this.admissionsService.enrollStudent(body, req.user?.id);
  }

  @Roles(Role.ADMISSION_OFFICE, Role.PRINCIPAL)
  @Post('reallocate-branch')
  async reallocate(@Request() req, @Body() body: ReallocateBranchDto) {
    return this.admissionsService.reallocateBranch(body, req.user?.id);
  }

  @Roles(Role.ADMISSION_OFFICE, Role.PRINCIPAL)
  @Get('students')
  async listStudents() {
    return this.admissionsService.getAllStudents();
  }

  @Roles(Role.ADMISSION_OFFICE, Role.PRINCIPAL)
  @Get('departments')
  async listDepartments() {
    return this.admissionsService.getDepartments();
  }

  @Roles(Role.ADMISSION_OFFICE, Role.PRINCIPAL)
  @Get('preview-usn/:year/:branchCode')
  async previewUsn(@Param('year') year: string, @Param('branchCode') branchCode: string) {
    return this.admissionsService.getNextUsn(parseInt(year, 10), branchCode);
  }
}

