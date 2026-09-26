import prisma from "./prisma";
import { ClashResult } from "./types";

export interface SlotValidationInput {
  slotId?: string;
  dayOfWeek: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  facultyId: string;
  roomNumber: string;
  departmentId: string;
  semester: number;
  section: string;
}

export function timeOverlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

export async function validateTimetableClash(
  input: SlotValidationInput
): Promise<ClashResult> {
  const {
    slotId,
    dayOfWeek,
    startTime,
    endTime,
    facultyId,
    roomNumber,
    departmentId,
    semester,
    section,
  } = input;

  const existingSlots = await prisma.timetableSlot.findMany({
    where: {
      dayOfWeek,
      id: slotId ? { not: slotId } : undefined,
    },
    include: {
      faculty: {
        select: { firstName: true, lastName: true, email: true },
      },
      department: {
        select: { code: true, name: true },
      },
    },
  });

  const clashes: ClashResult["clashes"] = [];

  for (const slot of existingSlots) {
    const overlaps = timeOverlaps(startTime, endTime, slot.startTime, slot.endTime);
    if (!overlaps) continue;

    if (slot.facultyId === facultyId) {
      clashes.push({
        type: "FACULTY_CLASH",
        message: `Faculty Clash: Prof. ${slot.faculty.firstName} ${slot.faculty.lastName} is already assigned to "${slot.subject}" in Room ${slot.roomNumber} from ${slot.startTime} to ${slot.endTime} on ${dayOfWeek}.`,
        conflictingSlot: {
          id: slot.id,
          subject: slot.subject,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          facultyName: `${slot.faculty.firstName} ${slot.faculty.lastName}`,
          roomNumber: slot.roomNumber,
          batch: `${slot.department.code} Sem ${slot.semester} (${slot.section})`,
        },
      });
    }

    if (slot.roomNumber.trim().toUpperCase() === roomNumber.trim().toUpperCase()) {
      clashes.push({
        type: "ROOM_CLASH",
        message: `Room Clash: Room ${slot.roomNumber} is already booked for "${slot.subject}" (${slot.department.code} Sem ${slot.semester}) from ${slot.startTime} to ${slot.endTime} on ${dayOfWeek}.`,
        conflictingSlot: {
          id: slot.id,
          subject: slot.subject,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          facultyName: `${slot.faculty.firstName} ${slot.faculty.lastName}`,
          roomNumber: slot.roomNumber,
          batch: `${slot.department.code} Sem ${slot.semester} (${slot.section})`,
        },
      });
    }

    if (
      slot.departmentId === departmentId &&
      slot.semester === semester &&
      slot.section.trim().toUpperCase() === section.trim().toUpperCase()
    ) {
      clashes.push({
        type: "BATCH_CLASH",
        message: `Batch Clash: Batch [${slot.department.code} Semester ${semester} Section ${section}] already has class "${slot.subject}" with Prof. ${slot.faculty.firstName} from ${slot.startTime} to ${slot.endTime} on ${dayOfWeek}.`,
        conflictingSlot: {
          id: slot.id,
          subject: slot.subject,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          facultyName: `${slot.faculty.firstName} ${slot.faculty.lastName}`,
          roomNumber: slot.roomNumber,
          batch: `${slot.department.code} Sem ${slot.semester} (${slot.section})`,
        },
      });
    }
  }

  return {
    hasClash: clashes.length > 0,
    clashes,
  };
}
