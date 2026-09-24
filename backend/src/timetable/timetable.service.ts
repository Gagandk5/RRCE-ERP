import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTimetableSlotDto {
  courseOfferingId: string;
  dayOfWeek: number; // 1 = Monday ... 6 = Saturday
  startTimeMinutes: number; // e.g. 540 = 09:00
  endTimeMinutes: number; // e.g. 600 = 10:00
  roomNumber: string;
}

export interface UpdateTimetableSlotDto extends Partial<CreateTimetableSlotDto> {
  id: string;
}

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) { }

  async validateAndDetectClashes(
    courseOfferingId: string,
    dayOfWeek: number,
    startTimeMinutes: number,
    endTimeMinutes: number,
    roomNumber: string,
    excludeSlotId?: string,
  ) {
    if (startTimeMinutes >= endTimeMinutes) {
      throw new BadRequestException('Start time must be strictly before end time');
    }

    const targetOffering = await this.prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: {
        faculty: { include: { user: true } },
        course: true,
        academicSemester: { include: { department: true } },
      },
    });

    if (!targetOffering) {
      throw new NotFoundException(`CourseOffering ${courseOfferingId} not found`);
    }

    // Query all existing slots on the same day that overlap in time:
    // (newStart < existingEnd) AND (newEnd > existingStart)
    const overlappingSlots = await this.prisma.timetableSlot.findMany({
      where: {
        dayOfWeek,
        AND: [
          { startTimeMinutes: { lt: endTimeMinutes } },
          { endTimeMinutes: { gt: startTimeMinutes } },
        ],
        ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
      },
      include: {
        courseOffering: {
          include: {
            faculty: { include: { user: true } },
            course: true,
            academicSemester: { include: { department: true } },
          },
        },
      },
    });

    for (const slot of overlappingSlots) {
      const existingOffering = slot.courseOffering;

      // Layer 1: Faculty Clash (Same teacher cannot be booked simultaneously anywhere across college)
      if (existingOffering.facultyId === targetOffering.facultyId) {
        const facultyName = `${targetOffering.faculty.user.firstName} ${targetOffering.faculty.user.lastName}`;
        throw new ConflictException({
          layer: 1,
          type: 'FACULTY_CLASH',
          message: `Layer 1 Collision (Faculty Clash): ${facultyName} is already assigned to teach ${existingOffering.course.name} in Room ${slot.roomNumber} from ${this.formatMinutes(slot.startTimeMinutes)} to ${this.formatMinutes(slot.endTimeMinutes)}.`,
          conflictingSlot: {
            id: slot.id,
            course: existingOffering.course.name,
            faculty: facultyName,
            room: slot.roomNumber,
            dayOfWeek: slot.dayOfWeek,
            time: `${this.formatMinutes(slot.startTimeMinutes)} - ${this.formatMinutes(slot.endTimeMinutes)}`,
          },
        });
      }

      // Layer 2: Room Clash (Same physical room cannot host two classes simultaneously)
      if (slot.roomNumber.trim().toUpperCase() === roomNumber.trim().toUpperCase()) {
        throw new ConflictException({
          layer: 2,
          type: 'ROOM_CLASH',
          message: `Layer 2 Collision (Room Clash): Physical room ${roomNumber} is already reserved for ${existingOffering.course.name} (${existingOffering.academicSemester.department.code} Sec ${existingOffering.section}) from ${this.formatMinutes(slot.startTimeMinutes)} to ${this.formatMinutes(slot.endTimeMinutes)}.`,
          conflictingSlot: {
            id: slot.id,
            room: slot.roomNumber,
            course: existingOffering.course.name,
            section: existingOffering.section,
            department: existingOffering.academicSemester.department.code,
            time: `${this.formatMinutes(slot.startTimeMinutes)} - ${this.formatMinutes(slot.endTimeMinutes)}`,
          },
        });
      }

      // Layer 3: Section Clash (Same student section cannot have overlapping lectures)
      if (
        existingOffering.academicSemesterId === targetOffering.academicSemesterId &&
        existingOffering.section === targetOffering.section
      ) {
        throw new ConflictException({
          layer: 3,
          type: 'SECTION_CLASH',
          message: `Layer 3 Collision (Section Clash): Department ${targetOffering.academicSemester.department.code} Semester ${targetOffering.academicSemester.semesterNumber} Section ${targetOffering.section} already has a scheduled lecture (${existingOffering.course.name}) from ${this.formatMinutes(slot.startTimeMinutes)} to ${this.formatMinutes(slot.endTimeMinutes)}.`,
          conflictingSlot: {
            id: slot.id,
            course: existingOffering.course.name,
            section: targetOffering.section,
            department: targetOffering.academicSemester.department.code,
            time: `${this.formatMinutes(slot.startTimeMinutes)} - ${this.formatMinutes(slot.endTimeMinutes)}`,
          },
        });
      }
    }

    return targetOffering;
  }

  async createSlot(dto: CreateTimetableSlotDto) {
    await this.validateAndDetectClashes(
      dto.courseOfferingId,
      dto.dayOfWeek,
      dto.startTimeMinutes,
      dto.endTimeMinutes,
      dto.roomNumber,
    );

    return this.prisma.timetableSlot.create({
      data: {
        courseOfferingId: dto.courseOfferingId,
        dayOfWeek: dto.dayOfWeek,
        startTimeMinutes: dto.startTimeMinutes,
        endTimeMinutes: dto.endTimeMinutes,
        roomNumber: dto.roomNumber,
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            faculty: { include: { user: true } },
            academicSemester: { include: { department: true } },
          },
        },
      },
    });
  }

  async updateSlot(dto: UpdateTimetableSlotDto) {
    const existing = await this.prisma.timetableSlot.findUnique({
      where: { id: dto.id },
    });
    if (!existing) {
      throw new NotFoundException(`Slot ${dto.id} not found`);
    }

    const courseOfferingId = dto.courseOfferingId || existing.courseOfferingId;
    const dayOfWeek = dto.dayOfWeek !== undefined ? dto.dayOfWeek : existing.dayOfWeek;
    const startTimeMinutes = dto.startTimeMinutes !== undefined ? dto.startTimeMinutes : existing.startTimeMinutes;
    const endTimeMinutes = dto.endTimeMinutes !== undefined ? dto.endTimeMinutes : existing.endTimeMinutes;
    const roomNumber = dto.roomNumber || existing.roomNumber;

    await this.validateAndDetectClashes(
      courseOfferingId,
      dayOfWeek,
      startTimeMinutes,
      endTimeMinutes,
      roomNumber,
      dto.id,
    );

    return this.prisma.timetableSlot.update({
      where: { id: dto.id },
      data: {
        courseOfferingId,
        dayOfWeek,
        startTimeMinutes,
        endTimeMinutes,
        roomNumber,
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            faculty: { include: { user: true } },
            academicSemester: { include: { department: true } },
          },
        },
      },
    });
  }

  async getDepartmentTimetable(departmentId: string, semesterNumber?: number) {
    return this.prisma.timetableSlot.findMany({
      where: {
        courseOffering: {
          academicSemester: {
            departmentId,
            ...(semesterNumber ? { semesterNumber } : {}),
          },
        },
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            faculty: { include: { user: true } },
            academicSemester: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTimeMinutes: 'asc' },
      ],
    });
  }

  async getFacultyTimetable(facultyId: string) {
    return this.prisma.timetableSlot.findMany({
      where: {
        courseOffering: {
          facultyId,
        },
      },
      include: {
        courseOffering: {
          include: {
            course: true,
            academicSemester: { include: { department: true } },
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTimeMinutes: 'asc' },
      ],
    });
  }

  async getStudentTimetable(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: true,
      },
    });
    if (!student || student.enrollments.length === 0) {
      return [];
    }

    const currentEnrollment = student.enrollments[0];
    return this.prisma.timetableSlot.findMany({
      where: {
        courseOffering: {
          academicSemesterId: currentEnrollment.academicSemesterId,
          section: currentEnrollment.section,
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
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTimeMinutes: 'asc' },
      ],
    });
  }

  private formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}

