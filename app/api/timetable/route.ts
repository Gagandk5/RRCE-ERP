import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { validateTimetableClash } from "@/lib/clash-engine";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const deptCode = searchParams.get("dept");
  const facultyId = searchParams.get("facultyId");
  const day = searchParams.get("day");
  const semester = searchParams.get("sem") ? parseInt(searchParams.get("sem")!) : undefined;

  try {
    let slots: any[] = [];
    try {
      slots = await prisma.timetableSlot.findMany({
        where: {
          department: deptCode ? { code: deptCode } : undefined,
          facultyId: facultyId || undefined,
          dayOfWeek: day || undefined,
          semester,
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
    } catch (dbErr) {
      console.warn("DB timetable query failed, providing mock schedule:", dbErr);
    }

    if (slots.length === 0) {
      const mockSlots = [
        {
          id: "mock-slot-1",
          dayOfWeek: "MON",
          startTime: "09:00",
          endTime: "10:00",
          subject: "Discrete Mathematics (25BC101)",
          departmentId: "mock-dept-bca",
          semester: 1,
          section: "A",
          facultyId: "mock-staff-faculty_math",
          roomNumber: "LH-201",
          faculty: { id: "mock-staff-faculty_math", firstName: "Sunitha", lastName: "Sharma", email: "faculty.math@rrce.org" },
          department: { id: "mock-dept-bca", code: "BCA", name: "Bachelor of Computer Applications", usnCode: "BC" },
        },
        {
          id: "mock-slot-2",
          dayOfWeek: "MON",
          startTime: "10:00",
          endTime: "11:00",
          subject: "Problem Solving with C (25BC102)",
          departmentId: "mock-dept-bca",
          semester: 1,
          section: "A",
          facultyId: "mock-staff-hod_bca",
          roomNumber: "LH-201",
          faculty: { id: "mock-staff-hod_bca", firstName: "Praveen", lastName: "Gowda", email: "hod.bca@rrce.org" },
          department: { id: "mock-dept-bca", code: "BCA", name: "Bachelor of Computer Applications", usnCode: "BC" },
        },
      ];
      return NextResponse.json({ slots: mockSlots, isMock: true });
    }

    return NextResponse.json({ slots, isMock: false });
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

    const clashCheck = await validateTimetableClash({
      dayOfWeek,
      startTime,
      endTime,
      facultyId,
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
        facultyId,
        roomNumber,
        academicYear: academicYear || "2025-2026",
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
