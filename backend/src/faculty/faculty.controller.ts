import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FacultyService, SubmitMarksDto, CreateAssignmentDto } from './faculty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/faculty')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FACULTY, Role.HOD, Role.PRINCIPAL)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) { }

  @Get('my-offerings')
  async getMyOfferings(@Request() req) {
    return this.facultyService.getMyOfferings(req.user.id);
  }

  @Post('marks/submit')
  async submitMarks(@Body() body: SubmitMarksDto, @Request() req) {
    return this.facultyService.submitCieMarks(body, req.user.id);
  }

  @Post('assignments')
  async createAssignment(@Body() body: CreateAssignmentDto) {
    return this.facultyService.createAssignment(body);
  }

  @Get('assignments/:offeringId')
  async getAssignments(@Param('offeringId') offeringId: string) {
    return this.facultyService.getAssignments(offeringId);
  }
}

