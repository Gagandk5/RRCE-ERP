import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamModerationStatus } from '@prisma/client';

export interface ReassignOfferingDto {
  courseOfferingId: string;
  newFacultyId: string;
  reason?: string;
}

export interface SoftDeleteStudentDto {
  studentId: string;
  reason: string;
}

export interface CondoneAttendanceDto {
  studentId: string;
  courseOfferingId?: string;
  reason: string;
  minimumCondonedThreshold?: number; // e.g. 75.0
}

@Injectable()
export class PrincipalService {
  constructor(private prisma: PrismaService) { }

  async reassignOffering(dto: ReassignOfferingDto, principalUserId: string) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: dto.courseOfferingId },
      include: {
        faculty: { include: { user: true } },
        course: true,
      },
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    const newFaculty = await this.prisma.faculty.findUnique({
      where: { id: dto.newFacultyId },
      include: { user: true },
    });

    if (!newFaculty) {
      throw new NotFoundException('New faculty not found');
    }

    const previousFacultyName = `${offering.faculty.user.firstName} ${offering.faculty.user.lastName}`;
    const newFacultyName = `${newFaculty.user.firstName} ${newFaculty.user.lastName}`;

    const updated = await this.prisma.courseOffering.update({
      where: { id: dto.courseOfferingId },
      data: {
        facultyId: dto.newFacultyId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: principalUserId,
        action: 'COURSE_OFFERING_REASSIGNED_BY_PRINCIPAL',
        targetId: dto.courseOfferingId,
        metaJson: {
          course: offering.course.name,
          previousFaculty: previousFacultyName,
          newFaculty: newFacultyName,
          reason: dto.reason || 'Mid-semester faculty reassignment by Principal',
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Course offering successfully reassigned from ${previousFacultyName} to ${newFacultyName}`,
      offering: updated,
    };
  }

  /**
   * Soft-Delete Invariant:
   * All student deletions MUST be soft deletes (isActive = false, deletedAt = NOW(), deletedById, deletionReason).
   * Hard cascading deletes are strictly forbidden.
   */
  async softDeleteStudent(dto: SoftDeleteStudentDto, principalUserId: string) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('A non-empty deletion reason is mandatory for auditing student deactivations.');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id: dto.studentId },
        data: {
          isActive: false,
          deletedAt: new Date(),
          deletedById: principalUserId,
          deletionReason: dto.reason,
        },
      });

      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      });

      await tx.auditLog.create({
        data: {
          userId: principalUserId,
          action: 'STUDENT_SOFT_DELETED',
          targetId: student.id,
          metaJson: {
            usn: student.usn,
            name: `${student.user.firstName} ${student.user.lastName}`,
            deletionReason: dto.reason,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        message: `Student ${student.usn} successfully soft-deleted with audit tracking`,
        student: updatedStudent,
      };
    });
  }

  async condoneAttendance(dto: CondoneAttendanceDto, principalUserId: string) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('Condonation requires an official justification reason (e.g. Medical / University Sports representation).');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.auditLog.create({
      data: {
        userId: principalUserId,
        action: 'ATTENDANCE_CONDONED',
        targetId: student.id,
        metaJson: {
          usn: student.usn,
          name: `${student.user.firstName} ${student.user.lastName}`,
          courseOfferingId: dto.courseOfferingId || 'ALL_SUBJECTS',
          reason: dto.reason,
          condonedThreshold: dto.minimumCondonedThreshold || 75.0,
          authorizedBy: 'PRINCIPAL_EXECUTIVE_ORDER',
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Attendance shortage successfully condoned for student ${student.usn}. Student is now eligible for examination hall-tickets.`,
      studentId: student.id,
      usn: student.usn,
    };
  }

  async publishExamResults(examScheduleId: string, principalUserId: string) {
    const exam = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
      include: {
        courseOffering: {
          include: { course: true },
        },
        marksEntries: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam schedule not found');
    }

    const updated = await this.prisma.examSchedule.update({
      where: { id: examScheduleId },
      data: {
        status: ExamModerationStatus.PUBLISHED_BY_PRINCIPAL,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: principalUserId,
        action: 'EXAM_RESULTS_PUBLISHED_AND_LOCKED',
        targetId: examScheduleId,
        metaJson: {
          course: exam.courseOffering.course.name,
          examType: exam.examType,
          totalEntriesLocked: exam.marksEntries.length,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Results for ${exam.courseOffering.course.name} (${exam.examType}) officially published and locked.`,
      exam: updated,
    };
  }

  async getCampusStats() {
    const [totalStudents, totalFaculties, totalDepts, invoices, attendanceRecords, offerings] = await Promise.all([
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.faculty.count({ where: { isActive: true } }),
      this.prisma.department.count(),
      this.prisma.invoice.findMany({ select: { totalAmount: true, paidAmount: true, status: true } }),
      this.prisma.attendanceRecord.findMany({ select: { status: true } }),
      this.prisma.courseOffering.findMany({
        include: {
          course: true,
          faculty: { include: { user: true } },
          academicSemester: { include: { department: true } },
          attendanceSessions: { select: { id: true } },
        },
      }),
    ]);

    // Financial calculations
    let totalFeeBilled = 0;
    let totalFeeCollected = 0;
    for (const inv of invoices) {
      totalFeeBilled += Number(inv.totalAmount);
      totalFeeCollected += Number(inv.paidAmount);
    }

    // Attendance calculations
    let attendedOrExcused = 0;
    const totalRecords = attendanceRecords.length;
    for (const rec of attendanceRecords) {
      if (rec.status === 'PRESENT' || rec.status === 'EXCUSED' || rec.status === 'LATE') {
        attendedOrExcused++;
      }
    }
    const campusAttendanceAvg = totalRecords > 0 ? Math.round((attendedOrExcused / totalRecords) * 1000) / 10 : 100.0;

    // Syllabus lag detection: offerings with fewer than 5 conducted sessions
    const syllabusLagAlerts = offerings
      .filter((o) => o.attendanceSessions.length < 5)
      .map((o) => ({
        offeringId: o.id,
        courseCode: o.course.code,
        courseName: o.course.name,
        facultyName: `${o.faculty.user.firstName} ${o.faculty.user.lastName}`,
        department: o.academicSemester.department.code,
        conductedSessions: o.attendanceSessions.length,
        status: 'LAGGING',
      }));

    return {
      totalStudents,
      totalFaculties,
      totalDepts,
      campusAttendanceAvg,
      finances: {
        totalBilled: totalFeeBilled,
        totalCollected: totalFeeCollected,
        pendingAmount: totalFeeBilled - totalFeeCollected,
        collectionPercentage: totalFeeBilled > 0 ? Math.round((totalFeeCollected / totalFeeBilled) * 100) : 0,
      },
      syllabusLagAlerts,
    };
  }

  async getAllOfferings() {
    return this.prisma.courseOffering.findMany({
      include: {
        course: true,
        faculty: { include: { user: true } },
        academicSemester: { include: { department: true } },
      },
      orderBy: {
        course: { code: 'asc' },
      },
    });
  }

  async getAllFaculties() {
    return this.prisma.faculty.findMany({
      where: { isActive: true },
      include: {
        user: true,
        homeDepartment: true,
      },
      orderBy: { employeeCode: 'asc' },
    });
  }

  async getAllAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }
}

