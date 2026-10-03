import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, resolveSessionUser } from "@/lib/auth";
import { findTimetableClashes, validateTimetableClash } from "@/lib/clash-engine";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const deptCode = searchParams.get("dept");
  let facultyId = searchParams.get("facultyId");
  const day = searchParams.get("day");
  const semester = searchParams.get("sem") ? parseInt(searchParams.get("sem")!) : undefined;
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!["FACULTY", "HOD", "PRINCIPAL"].includes(session.role)) {
    return NextResponse.json({ error: "Faculty access required." }, { status: 403 });
  }

  let authenticatedFacultyId: string | null = null;
  let facultyDepartmentIds: string[] = [];
  if (session.role === "FACULTY") {
    const faculty = await resolveSessionUser(session);
    if (!faculty) {
      return NextResponse.json({ error: "Your session is no longer valid. Please sign in again." }, { status: 401 });
    }
    authenticatedFacultyId = faculty.id;
    facultyDepartmentIds = faculty.departmentId ? [faculty.departmentId] : [];
    facultyId = null;
  }

  try {
    const allAssignments = session.role === "FACULTY"
      ? await prisma.facultyCourseAssignment.findMany({
          where: { departmentId: { in: facultyDepartmentIds }, isActive: true },
          include: {
            subject: { select: { id: true, code: true, name: true } },
            faculty: { select: { id: true, firstName: true, lastName: true } },
          },
        })
      : [];
    const facultyAssignments = allAssignments.filter(
      (assignment) => assignment.facultyId === authenticatedFacultyId
    );

    const slots = await prisma.timetableSlot.findMany({
      where: {
        department: deptCode ? { code: deptCode } : undefined,
        departmentId: session.role === "FACULTY" ? { in: facultyDepartmentIds } : undefined,
        facultyId: facultyId || undefined,
        dayOfWeek: day || undefined,
        semester,
        academicYear: "2026-2027",
      },
      include: {
        faculty: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        department: {
          select: { id: true, code: true, name: true, usnCode: true },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    if (session.role === "FACULTY") {
      const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matchingAssignments = (slot: (typeof slots)[number]) =>
        facultyAssignments.filter((assignment) => {
          if (assignment.departmentId !== slot.departmentId || assignment.semester !== slot.semester) {
            return false;
          }
          const scheduledSubject = normalize(slot.subject);
          const matchesSubject =
            scheduledSubject.includes(normalize(assignment.subject.code)) ||
            scheduledSubject.includes(normalize(assignment.subject.name));
          const matchesSection =
            assignment.section === slot.section ||
            (assignment.section === "A" &&
              slot.section.startsWith("B") &&
              assignment.subject.code.startsWith("B25BCAL"));
          return matchesSubject && matchesSection;
        });
      const assignedSlots = slots.filter((slot) => matchingAssignments(slot).length > 0);

      const slotsWithCounts = await Promise.all(assignedSlots.map(async (slot) => {
        const slotAssignments = matchingAssignments(slot);
        const subjectIds = Array.from(new Set(slotAssignments.map(({ subjectId }) => subjectId)));
        const teachingFaculty = allAssignments
          .filter((assignment) => subjectIds.includes(assignment.subjectId))
          .map(({ faculty: assignedFaculty }) => ({
            id: assignedFaculty.id,
            name: `${assignedFaculty.firstName} ${assignedFaculty.lastName}`.trim(),
          }));
        const studentCount = slot.section === "A"
          ? await prisma.student.count({
              where: {
                departmentId: slot.departmentId,
                currentSemester: slot.semester,
                section: slot.section,
              },
            })
          : null;
        return { ...slot, studentCount, teachingFaculty };
      }));
      const conflictSlots = slots.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        facultyId: slot.facultyId,
        roomNumber: slot.roomNumber,
        departmentId: slot.departmentId,
        semester: slot.semester,
        section: slot.section,
      }));
      return NextResponse.json({
        slots: slotsWithCounts,
        conflicts: findTimetableClashes(conflictSlots),
        isMock: false,
      });
    }

    return NextResponse.json({
      slots,
      conflicts: findTimetableClashes(slots.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        facultyId: slot.facultyId,
        roomNumber: slot.roomNumber,
        departmentId: slot.departmentId,
        semester: slot.semester,
        section: slot.section,
      }))),
      isMock: false,
    });
  } catch (error: unknown) {
    console.error("Timetable GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to load timetable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser || !["HOD", "FACULTY", "PRINCIPAL"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      dayOfWeek,
      startTime,
      endTime,
      subject,
      departmentId,
      semester,
      section,
      facultyId,
      roomNumber,
      academicYear,
    } = body;

    if (!dayOfWeek || !startTime || !endTime || !subject || !departmentId || !facultyId || !roomNumber) {
      return NextResponse.json(
        { error: "dayOfWeek, startTime, endTime, subject, departmentId, facultyId, and roomNumber are required." },
        { status: 400 }
      );
    }

    let assignedFacultyId = facultyId;
    if (sessionUser.role === "FACULTY") {
      const faculty = await resolveSessionUser(sessionUser);
      if (!faculty) {
        return NextResponse.json({ error: "Your session is no longer valid. Please sign in again." }, { status: 401 });
      }
      const assignments = await prisma.facultyCourseAssignment.findMany({
        where: {
          facultyId: faculty.id,
          departmentId,
          semester: semester || 1,
          section: section || "A",
          isActive: true,
        },
        select: { subject: { select: { code: true, name: true } } },
      });
      const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedSubject = normalize(subject);
      const isAssignedSubject = assignments.some(
        (assignment) =>
          normalizedSubject.includes(normalize(assignment.subject.code)) ||
          normalizedSubject.includes(normalize(assignment.subject.name))
      );
      if (!isAssignedSubject) {
        return NextResponse.json({ error: "You can only schedule subjects assigned to you." }, { status: 403 });
      }
      assignedFacultyId = faculty.id;
    }

    const clashCheck = await validateTimetableClash({
      dayOfWeek,
      startTime,
      endTime,
      facultyId: assignedFacultyId,
      roomNumber,
      departmentId,
      semester: semester || 1,
      section: section || "A",
    });

    if (clashCheck.hasClash) {
      return NextResponse.json(
        {
          error: "Scheduling Conflict Detected by 3-Layer Clash Engine.",
          clashes: clashCheck.clashes,
        },
        { status: 409 }
      );
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        subject,
        departmentId,
        semester: semester || 1,
        section: section || "A",
        facultyId: assignedFacultyId,
        roomNumber,
        academicYear: academicYear || "2026-2027",
      },
      include: {
        faculty: { select: { firstName: true, lastName: true } },
        department: { select: { code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Class schedule slot created successfully with zero clashes.",
      slot,
    });
  } catch (error: unknown) {
    console.error("Timetable POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to create timetable slot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
