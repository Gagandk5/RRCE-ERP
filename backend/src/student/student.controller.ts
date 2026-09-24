import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { StudentService, PayInvoiceDto } from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PasswordResetGuard } from '../auth/guards/password-reset.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/student')
@UseGuards(JwtAuthGuard, RolesGuard, PasswordResetGuard)
@Roles(Role.STUDENT)
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.studentService.getDashboard(req.user.id);
  }

  @Get('invoices')
  async getInvoices(@Request() req) {
    return this.studentService.getInvoices(req.user.id);
  }

  @Post('pay-invoice')
  async payInvoice(@Body() body: PayInvoiceDto, @Request() req) {
    return this.studentService.payInvoice(req.user.id, body);
  }

  @Get('marks')
  async getMarks(@Request() req) {
    return this.studentService.getPublishedMarks(req.user.id);
  }

  @Get('materials')
  async getStudyMaterials(@Request() req) {
    return this.studentService.getStudyMaterials(req.user.id);
  }
}

