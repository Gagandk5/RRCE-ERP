import { Controller, Post, Put, Body, Get, Param, UseGuards, Query, Request } from '@nestjs/common';
import { TimetableService, CreateTimetableSlotDto, UpdateTimetableSlotDto } from './timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) { }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Post('slot')
  async createSlot(@Body() body: CreateTimetableSlotDto) {
    return this.timetableService.createSlot(body);
  }

  @Roles(Role.HOD, Role.PRINCIPAL)
  @Put('slot')
  async updateSlot(@Body() body: UpdateTimetableSlotDto) {
    return this.timetableService.updateSlot(body);
  }

  @Get('department/:departmentId')
  async getDepartmentTimetable(
    @Param('departmentId') departmentId: string,
    @Query('semester') semester?: string,
  ) {
    const semNum = semester ? parseInt(semester, 10) : undefined;
    return this.timetableService.getDepartmentTimetable(departmentId, semNum);
  }

  @Get('my-student-schedule')
  async getMyStudentSchedule(@Request() req) {
    const studentId = req.user.studentProfile?.id;
    if (!studentId) {
      return [];
    }
    return this.timetableService.getStudentTimetable(studentId);
  }

  @Get('my-faculty-schedule')
  async getMyFacultySchedule(@Request() req) {
    const facultyId = req.user.facultyProfile?.id;
    if (!facultyId) {
      return [];
    }
    return this.timetableService.getFacultyTimetable(facultyId);
  }
}

