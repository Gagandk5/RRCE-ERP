import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

export interface RecordAttendanceDto {
  courseOfferingId: string;
  sessionDate: string; // YYYY-MM-DD
  periodNumber: number;
  records: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}

export interface UpdateAttendanceDto {
  records: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) { }

  /**
   * Institutional Roster Requirement:
   * Class rosters MUST default to ORDER BY usnSequence ASC (natural numerical order: 1, 2, 3...)
   * NEVER alphabetical name order.
   */
  async getOfferingRoster(courseOfferingId: string) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: {
        academicSemester: true,
        course: true,
      },
    });

    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    const enrollments = await this.prisma.semesterEnrollment.findMany({
      where: {
        academicSemesterId: offering.academicSemesterId,
        section: offering.section,
        student: { isActive: true },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        student: {
          usnSequence: 'asc', // Strict Institutional Invariant
        },
      },
    });

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      studentId: e.student.id,
      usn: e.student.usn,
      usnSequence: e.student.usnSequence,
      name: `${e.student.user.firstName} ${e.student.user.lastName}`,
      section: e.section,
      quota: e.student.quota,
    }));
  }

  async recordAttendance(dto: RecordAttendanceDto, facultyUserId: string) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: dto.courseOfferingId },
    });
    if (!offering) {
      throw new NotFoundException('Course offering not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.create({
        data: {
          courseOfferingId: dto.courseOfferingId,
          sessionDate: new Date(dto.sessionDate),
          periodNumber: dto.periodNumber,
          markedById: facultyUserId,
          isLocked: false,
        },
      });

      const recordsData = dto.records.map((r) => ({
        sessionId: session.id,
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks,
      }));

      await tx.attendanceRecord.createMany({
        data: recordsData,
      });

      return {
        success: true,
        sessionId: session.id,
        sessionDate: session.sessionDate,
        recordsCount: recordsData.length,
      };
    });
  }

  async updateAttendance(sessionId: string, dto: UpdateAttendanceDto, facultyUserId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    // 24-Hour Edit Lockout Check
    const sessionCreatedAt = new Date(session.createdAt).getTime();
    const now = Date.now();
    const hoursElapsed = (now - sessionCreatedAt) / (1000 * 60 * 60);

    if (session.isLocked || hoursElapsed > 24) {
      if (!session.isLocked) {
        await this.prisma.attendanceSession.update({
          where: { id: sessionId },
          data: { isLocked: true },
        });
      }
      throw new ForbiddenException({
        statusCode: 403,
        error: 'SESSION_LOCKED',
        message: 'Attendance record is permanently locked. Modifications are strictly forbidden after 24 hours.',
        hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      });
    }

    // Update records
    await this.prisma.$transaction(async (tx) => {
      for (const rec of dto.records) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: rec.studentId,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks,
          },
          create: {
            sessionId,
            studentId: rec.studentId,
            status: rec.status,
            remarks: rec.remarks,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: facultyUserId,
          action: 'ATTENDANCE_MODIFIED',
          targetId: sessionId,
          metaJson: { updatedCount: dto.records.length, hoursElapsed },
        },
      });
    });

    return {
      success: true,
      message: 'Attendance successfully updated within the 24-hour edit window',
    };
  }

  /**
   * Institutional Attendance Calculation Formula:
   * Attendance % = (Attended Sessions + Excused Sessions) / Total Conducted Sessions * 100
   * Guard: If Total Conducted = 0, return 100.00%
   */
  async calculateStudentAttendance(studentId: string, courseOfferingId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const whereOffering = courseOfferingId ? { courseOfferingId } : {};

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        session: whereOffering,
      },
      include: {
        session: {
          include: {
            courseOffering: {
              include: { course: true },
            },
          },
        },
      },
    });

    const totalConducted = records.length;
    if (totalConducted === 0) {
      return {
        studentId,
        usn: student.usn,
        name: `${student.user.firstName} ${student.user.lastName}`,
        totalConducted: 0,
        attended: 0,
        excused: 0,
        absent: 0,
        percentage: 100.0,
        isEligible: true,
        guardApplied: true,
      };
    }

    let attended = 0;
    let excused = 0;
    let absent = 0;

    for (const r of records) {
      if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE) {
        attended++;
      } else if (r.status === AttendanceStatus.EXCUSED) {
        excused++;
      } else if (r.status === AttendanceStatus.ABSENT) {
        absent++;
      }
    }

    // Formula: (Attended + Excused) / Total * 100
    const rawPercentage = ((attended + excused) / totalConducted) * 100;
    const percentage = Math.round(rawPercentage * 100) / 100;

    // Check if condoned by Principal in audit log
    const condonedLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'ATTENDANCE_CONDONED',
        targetId: studentId,
      },
      orderBy: { timestamp: 'desc' },
    });

    const isCondoned = !!condonedLog;
    const isEligible = percentage >= 75.0 || isCondoned;

    return {
      studentId,
      usn: student.usn,
      name: `${student.user.firstName} ${student.user.lastName}`,
      totalConducted,
      attended,
      excused,
      absent,
      percentage,
      isEligible,
      isCondoned,
      condonationReason: condonedLog?.metaJson ? (condonedLog.metaJson as any).reason : null,
    };
  }

  async getRecentSessions(courseOfferingId: string) {
    return this.prisma.attendanceSession.findMany({
      where: { courseOfferingId },
      include: {
        records: {
          include: {
            student: {
              include: { user: true },
            },
          },
          orderBy: {
            student: { usnSequence: 'asc' },
          },
        },
      },
      orderBy: { sessionDate: 'desc' },
      take: 15,
    });
  }
}

