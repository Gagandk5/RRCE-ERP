import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { InvoiceStatus, ExamModerationStatus } from '@prisma/client';

export interface PayInvoiceDto {
  invoiceId: string;
  amount: number;
  mode: 'UPI' | 'CARD' | 'NET_BANKING';
}

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
  ) { }

  async getDashboard(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        user: { include: { department: true } },
        enrollments: {
          include: {
            academicSemester: {
              include: {
                department: true,
                offerings: {
                  include: {
                    course: true,
                    faculty: { include: { user: true } },
                    timetableSlots: true,
                  },
                },
              },
            },
          },
        },
        invoices: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    // Overall attendance calculation
    const attendanceStats = await this.attendanceService.calculateStudentAttendance(student.id);

    // Subject-wise attendance calculation
    const currentEnrollment = student.enrollments[0];
    const subjectAttendance: any[] = [];

    if (currentEnrollment) {
      for (const offering of currentEnrollment.academicSemester.offerings) {
        const stats = await this.attendanceService.calculateStudentAttendance(student.id, offering.id);
        subjectAttendance.push({
          offeringId: offering.id,
          courseCode: offering.course.code,
          courseName: offering.course.name,
          facultyName: `${offering.faculty.user.firstName} ${offering.faculty.user.lastName}`,
          attendance: stats,
        });
      }
    }

    // Today's classes
    const todayDayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const adjustedDay = todayDayOfWeek === 0 ? 1 : todayDayOfWeek; // Fallback to Monday if viewed on Sunday

    const todaySlots = await this.prisma.timetableSlot.findMany({
      where: {
        dayOfWeek: adjustedDay,
        courseOffering: {
          academicSemesterId: currentEnrollment?.academicSemesterId,
          section: currentEnrollment?.section,
        },
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            faculty: { include: { user: true } },
          },
        },
      },
      orderBy: { startTimeMinutes: 'asc' },
    });

    // Invoices summary
    let totalPendingFee = 0;
    for (const inv of student.invoices) {
      if (inv.status !== InvoiceStatus.PAID) {
        totalPendingFee += Number(inv.totalAmount) - Number(inv.paidAmount);
      }
    }

    return {
      student: {
        id: student.id,
        usn: student.usn,
        name: `${student.user.firstName} ${student.user.lastName}`,
        department: student.user.department?.name || 'Department of Computer Applications',
        departmentCode: student.usnBranch,
        currentSemester: student.currentSemester,
        section: currentEnrollment?.section || 'A',
        quota: student.quota,
      },
      overallAttendance: attendanceStats,
      subjectAttendance,
      todaySchedule: todaySlots.map((s) => ({
        id: s.id,
        courseCode: s.courseOffering.course.code,
        courseName: s.courseOffering.course.name,
        facultyName: `${s.courseOffering.faculty.user.firstName} ${s.courseOffering.faculty.user.lastName}`,
        roomNumber: s.roomNumber,
        time: `${this.formatMinutes(s.startTimeMinutes)} - ${this.formatMinutes(s.endTimeMinutes)}`,
      })),
      totalPendingFee,
    };
  }

  async getInvoices(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.invoice.findMany({
      where: { studentId: student.id },
      include: {
        academicSemester: {
          include: { department: true },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async payInvoice(studentUserId: string, dto: PayInvoiceDto) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice || invoice.studentId !== student.id) {
      throw new NotFoundException('Invoice not found or does not belong to you');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    const pending = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (dto.amount <= 0 || dto.amount > pending) {
      throw new BadRequestException(`Payment amount must be between 1 and ${pending}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const gatewayRef = `RRCE-PG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const transaction = await tx.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          gatewayRef,
          amount: dto.amount,
          mode: dto.mode,
          status: 'SUCCESS',
        },
      });

      const newPaid = Number(invoice.paidAmount) + dto.amount;
      const isFullyPaid = newPaid >= Number(invoice.totalAmount);

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid,
          status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: studentUserId,
          action: 'FEE_PAYMENT_PROCESSED',
          targetId: invoice.id,
          metaJson: {
            amount: dto.amount,
            gatewayRef,
            mode: dto.mode,
          },
        },
      });

      return {
        success: true,
        message: 'Payment received successfully',
        transaction,
        invoice: updatedInvoice,
      };
    });
  }

  async getPublishedMarks(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.marksEntry.findMany({
      where: {
        studentId: student.id,
        examSchedule: {
          status: ExamModerationStatus.PUBLISHED_BY_PRINCIPAL,
        },
      },
      include: {
        examSchedule: {
          include: {
            courseOffering: {
              include: { course: true },
            },
          },
        },
      },
    });
  }

  async getStudyMaterials(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        enrollments: true,
      },
    });
    if (!student || student.enrollments.length === 0) {
      return [];
    }

    const currentEnrollment = student.enrollments[0];
    return this.prisma.studyMaterial.findMany({
      where: {
        courseOffering: {
          academicSemesterId: currentEnrollment.academicSemesterId,
          section: currentEnrollment.section,
        },
      },
      include: {
        courseOffering: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}

