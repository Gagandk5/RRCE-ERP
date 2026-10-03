import prisma from "./prisma";
import { BCA_2026_2027_TIMETABLE, BCA_COURSES, BCA_FACULTY_ASSIGNMENTS } from "../prisma/seed-data";

export async function seedBcaTimetable(
  departmentId: string,
  facultyIdsByEmail: Map<string, string>
) {
  const subjectsByCode = new Map<string, { id: string; name: string }>();

  for (const course of BCA_COURSES) {
    const subject = await prisma.subject.upsert({
      where: {
        code_departmentId_semester_section: {
          code: course.code,
          departmentId,
          semester: 3,
          section: "A",
        },
      },
      update: { name: course.name, isActive: true },
      create: {
        code: course.code,
        name: course.name,
        departmentId,
        semester: 3,
        section: "A",
        isActive: true,
      },
      select: { id: true, name: true },
    });
    subjectsByCode.set(course.code, subject);
  }

  for (const assignment of BCA_FACULTY_ASSIGNMENTS) {
    const facultyId = facultyIdsByEmail.get(assignment.email);
    const subject = subjectsByCode.get(assignment.courseCode);
    if (!facultyId || !subject) {
      throw new Error(`Missing faculty or subject for ${assignment.email} → ${assignment.courseCode}.`);
    }

    await prisma.facultyCourseAssignment.upsert({
      where: { facultyId_subjectId: { facultyId, subjectId: subject.id } },
      update: { isActive: true, departmentId, semester: 3, section: "A" },
      create: {
        facultyId,
        subjectId: subject.id,
        departmentId,
        semester: 3,
        section: "A",
        isActive: true,
      },
    });
  }

  for (const timetableEntry of BCA_2026_2027_TIMETABLE) {
    const leadAssignment = BCA_FACULTY_ASSIGNMENTS.find(
      (assignment) => assignment.courseCode === timetableEntry.courseCode
    );
    const facultyId = leadAssignment && facultyIdsByEmail.get(leadAssignment.email);
    const subject = subjectsByCode.get(timetableEntry.courseCode);
    if (!facultyId || !subject) {
      throw new Error(`Missing lead faculty or subject for ${timetableEntry.courseCode}.`);
    }

    const data = {
      dayOfWeek: timetableEntry.dayOfWeek,
      startTime: timetableEntry.startTime,
      endTime: timetableEntry.endTime,
      subject: `${subject.name} (${timetableEntry.courseCode})`,
      departmentId,
      semester: 3,
      section: timetableEntry.section,
      facultyId,
      roomNumber: "604",
      academicYear: "2026-2027",
    };
    const existingSlot = await prisma.timetableSlot.findFirst({
      where: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        departmentId,
        semester: data.semester,
        section: data.section,
        academicYear: data.academicYear,
        subject: { contains: timetableEntry.courseCode },
      },
      select: { id: true },
    });

    if (existingSlot) {
      await prisma.timetableSlot.update({ where: { id: existingSlot.id }, data });
    } else {
      await prisma.timetableSlot.create({ data });
    }
  }

  return {
    subjectsCount: BCA_COURSES.length,
    courseAssignmentsCount: BCA_FACULTY_ASSIGNMENTS.length,
    timetableSlotsCount: BCA_2026_2027_TIMETABLE.length,
  };
}
