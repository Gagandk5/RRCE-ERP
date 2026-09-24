import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus, Role, AttendanceStatus, ExamModerationStatus } from '@prisma/client';

export interface ApproveFacultyLeaveDto {
  substitutions: {
    timetableSlotId: string;
    substituteFacultyId: string;
    date: string; // YYYY-MM-DD
  }[];
}

@Injectable()
export class HodService {
  constructor(private prisma: PrismaService) { }

  async getPendingLeaves(hodUserId: string, hodDeptId?: string) {
    let deptId = hodDeptId;
    if (!deptId) {
      const user = await this.prisma.user.findUnique({ where: { id: hodUserId } });
      deptId = user?.departmentId || undefined;
    }

    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        ...(deptId ? { departmentId: deptId } : {}),
        status: LeaveStatus.PENDING,
      },
      include: {
        applicant: {
          include: {
            facultyProfile: {
              include: {
                assignedCourses: {
                  include: {
                    timetableSlots: true,
                    course: true,
                  },
                },
              },
            },
            studentProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leaves;
  }

  async approveFacultyLeave(
    leaveId: string,
    dto: ApproveFacultyLeaveDto,
    hodUserId: string,
  ) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        applicant: {
          include: {
            facultyProfile: {
              include: {
                assignedCourses: {
                  include: { timetableSlots: true },
                },
              },
            },
          },
        },
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (!leave.applicant.facultyProfile) {
      throw new BadRequestException('Applicant is not a faculty member. Use student approval endpoint.');
    }

    if (!dto.substitutions || dto.substitutions.length === 0) {
      throw new BadRequestException(
        'Mandatory Substitution Rule: Approving faculty leave requires mapping affected timetable slots to substitute faculty members.',
      );
    }

    // Verify all substitute faculties exist
    for (const sub of dto.substitutions) {
      const faculty = await this.prisma.faculty.findUnique({
        where: { id: sub.substituteFacultyId },
      });
      if (!faculty) {
        throw new NotFoundException(`Substitute faculty ${sub.substituteFacultyId} not found`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Create substitutions
      for (const sub of dto.substitutions) {
        await tx.facultySubstitution.create({
          data: {
            leaveRequestId: leave.id,
            timetableSlotId: sub.timetableSlotId,
            substituteFacultyId: sub.substituteFacultyId,
            date: new Date(sub.date),
          },
        });
      }

      const updated = await tx.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: LeaveStatus.APPROVED,
          reviewedById: hodUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: hodUserId,
          action: 'FACULTY_LEAVE_APPROVED_WITH_SUBSTITUTIONS',
          targetId: leave.id,
          metaJson: {
            substitutionsCount: dto.substitutions.length,
            applicant: leave.applicant.email,
          },
        },
      });

      return updated;
    });
  }

  async approveStudentLeave(leaveId: string, hodUserId: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        applicant: {
          include: { studentProfile: true },
        },
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    const studentProfile = leave.applicant.studentProfile;
    if (!studentProfile) {
      throw new BadRequestException('Applicant is not a student');
    }

    return this.prisma.$transaction(async (tx) => {
      // Automatically mark scheduled sessions in that date window as EXCUSED
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      // Find attendance records for this student in this date range
      const recordsToExcuse = await tx.attendanceRecord.findMany({
        where: {
          studentId: studentProfile.id,
          session: {
            sessionDate: {
              gte: start,
              lte: end,
            },
          },
        },
      });

      for (const rec of recordsToExcuse) {
        await tx.attendanceRecord.update({
          where: { id: rec.id },
          data: {
            status: AttendanceStatus.EXCUSED,
            remarks: `Excused due to approved leave: ${leave.reason}`,
          },
        });
      }

      const updated = await tx.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: LeaveStatus.APPROVED,
          reviewedById: hodUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: hodUserId,
          action: 'STUDENT_LEAVE_APPROVED_EXCUSED_SESSIONS',
          targetId: leave.id,
          metaJson: {
            excusedRecordsCount: recordsToExcuse.length,
            studentUsn: studentProfile.usn,
          },
        },
      });

      return {
        updated,
        excusedSessionsCount: recordsToExcuse.length,
      };
    });
  }

  async rejectLeave(leaveId: string, hodUserId: string, reason: string) {
    return this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.REJECTED,
        reviewedById: hodUserId,
        rejectionReason: reason || 'Leave request declined by HOD',
      },
    });
  }

  async getDepartmentExams(hodUserId: string, hodDeptId?: string) {
    let deptId = hodDeptId;
    if (!deptId) {
      const user = await this.prisma.user.findUnique({ where: { id: hodUserId } });
      deptId = user?.departmentId || undefined;
    }

    return this.prisma.examSchedule.findMany({
      where: {
        courseOffering: {
          academicSemester: {
            ...(deptId ? { departmentId: deptId } : {}),
          },
        },
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            faculty: { include: { user: true } },
          },
        },
        marksEntries: {
          include: {
            student: { include: { user: true } },
          },
          orderBy: {
            student: { usnSequence: 'asc' }, // Institutional invariant
          },
        },
      },
      orderBy: { examDate: 'desc' },
    });
  }

  async verifyExamMarks(examScheduleId: string, hodUserId: string) {
    const exam = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
      include: {
        courseOffering: {
          include: { course: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam schedule not found');
    }

    if (exam.status !== ExamModerationStatus.SUBMITTED_TO_HOD) {
      throw new BadRequestException(
        `Cannot verify exam with status ${exam.status}. Must be SUBMITTED_TO_HOD.`,
      );
    }

    const updated = await this.prisma.examSchedule.update({
      where: { id: examScheduleId },
      data: {
        status: ExamModerationStatus.VERIFIED_BY_HOD,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: hodUserId,
        action: 'EXAM_MARKS_VERIFIED_BY_HOD',
        targetId: examScheduleId,
        metaJson: {
          course: exam.courseOffering.course.name,
          examType: exam.examType,
        },
      },
    });

    return updated;
  }

  async getDepartmentFaculties(hodUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: hodUserId } });
    return this.prisma.faculty.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: true,
        homeDepartment: true,
      },
    });
  }
}

