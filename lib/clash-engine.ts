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

export interface TimetableClashSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  facultyId: string;
  roomNumber: string;
  departmentId: string;
  semester: number;
  section: string;
}

export interface TimetableClash {
  type: "FACULTY_CLASH" | "ROOM_CLASH" | "BATCH_CLASH";
  dayOfWeek: string;
  message: string;
}

export function timeOverlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

export function findTimetableClashes(slots: TimetableClashSlot[]): TimetableClash[] {
  const clashes: TimetableClash[] = [];
  for (let leftIndex = 0; leftIndex < slots.length; leftIndex += 1) {
    const left = slots[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < slots.length; rightIndex += 1) {
      const right = slots[rightIndex];
      if (left.dayOfWeek !== right.dayOfWeek ||
        !timeOverlaps(left.startTime, left.endTime, right.startTime, right.endTime)) {
        continue;
      }

      const day = left.dayOfWeek;
      if (left.facultyId === right.facultyId) {
        clashes.push({
          type: "FACULTY_CLASH",
          dayOfWeek: day,
          message: `${day}: ${left.subject} and ${right.subject} overlap for the same faculty.`,
        });
      }
      if (left.roomNumber.trim().toUpperCase() === right.roomNumber.trim().toUpperCase()) {
        clashes.push({
          type: "ROOM_CLASH",
          dayOfWeek: day,
          message: `${day}: Room ${left.roomNumber} is assigned to both ${left.subject} and ${right.subject}.`,
        });
      }
      if (
        left.departmentId === right.departmentId &&
        left.semester === right.semester &&
        left.section.trim().toUpperCase() === right.section.trim().toUpperCase()
      ) {
        clashes.push({
          type: "BATCH_CLASH",
          dayOfWeek: day,
          message: `${day}: ${left.subject} and ${right.subject} overlap for ${left.section}.`,
        });
      }
    }
  }
  return clashes;
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
