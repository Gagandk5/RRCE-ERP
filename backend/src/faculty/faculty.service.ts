import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamModerationStatus } from '@prisma/client';

export interface SubmitMarksDto {
  examScheduleId: string;
  entries: {
    studentId: string;
    marksObtained: number;
    isAbsent?: boolean;
  }[];
}

export interface CreateAssignmentDto {
  courseOfferingId: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxMarks: number;
}

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) { }

  async getMyOfferings(facultyUserId: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { userId: facultyUserId },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty profile not found');
    }

    return this.prisma.courseOffering.findMany({
      where: { facultyId: faculty.id },
      include: {
        course: true,
        academicSemester: {
          include: { department: true },
        },
        timetableSlots: true,
        attendanceSessions: {
          orderBy: { sessionDate: 'desc' },
          take: 5,
        },
      },
    });
  }

  async submitCieMarks(dto: SubmitMarksDto, facultyUserId: string) {
    const exam = await this.prisma.examSchedule.findUnique({
      where: { id: dto.examScheduleId },
      include: {
        courseOffering: { include: { course: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam schedule not found');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const entry of dto.entries) {
        await tx.marksEntry.upsert({
          where: {
            examScheduleId_studentId: {
              examScheduleId: dto.examScheduleId,
              studentId: entry.studentId,
            },
          },
          update: {
            marksObtained: entry.marksObtained,
            isAbsent: entry.isAbsent || false,
          },
          create: {
            examScheduleId: dto.examScheduleId,
            studentId: entry.studentId,
            marksObtained: entry.marksObtained,
            isAbsent: entry.isAbsent || false,
          },
        });
      }

      const updatedExam = await tx.examSchedule.update({
        where: { id: dto.examScheduleId },
        data: {
          status: ExamModerationStatus.SUBMITTED_TO_HOD,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: facultyUserId,
          action: 'CIE_MARKS_SUBMITTED_TO_HOD',
          targetId: dto.examScheduleId,
          metaJson: {
            entriesCount: dto.entries.length,
            course: exam.courseOffering.course.name,
            examType: exam.examType,
          },
        },
      });

      return updatedExam;
    });
  }

  async createAssignment(dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: {
        courseOfferingId: dto.courseOfferingId,
        title: dto.title,
        instructions: dto.instructions,
        dueDate: new Date(dto.dueDate),
        maxMarks: dto.maxMarks,
      },
    });
  }

  async getAssignments(courseOfferingId: string) {
    return this.prisma.assignment.findMany({
      where: { courseOfferingId },
      include: {
        submissions: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }
}

