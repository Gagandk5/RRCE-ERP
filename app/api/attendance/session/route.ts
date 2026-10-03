import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, resolveSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ALLOWED_ROLES = ["FACULTY", "HOD", "PRINCIPAL"];

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Faculty access required." }, { status: 403 });
  }

  try {
    const user = await resolveSessionUser(session);
    if (!user) {
      return NextResponse.json({ error: "Your session is no longer valid. Please sign in again." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const where: {
      facultyId?: string;
      departmentId?: string;
      semester?: number;
    } = {};
    if (session.role === "FACULTY") {
      where.facultyId = user.id;
    } else if (session.role === "HOD") {
      if (!user.departmentId) {
        return NextResponse.json({ error: "Department assignment is required." }, { status: 403 });
      }
      where.departmentId = user.departmentId;
    } else {
      const requestedFacultyId = searchParams.get("facultyId");
      if (requestedFacultyId) where.facultyId = requestedFacultyId;
      const deptCode = searchParams.get("dept");
      if (deptCode) {
        const department = await prisma.department.findUnique({
          where: { code: deptCode },
          select: { id: true },
        });
        if (!department) return NextResponse.json({ sessions: [], isMock: false });
        where.departmentId = department.id;
      }
    }

    const semesterValue = searchParams.get("sem");
    if (semesterValue) {
      const semester = Number.parseInt(semesterValue, 10);
      if (!Number.isInteger(semester) || semester < 1) {
        return NextResponse.json({ error: "Choose a valid semester." }, { status: 400 });
      }
      where.semester = semester;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      select: {
        id: true,
        subject: true,
        facultyId: true,
        semester: true,
        section: true,
        date: true,
        faculty: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { code: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ sessions, isMock: false });
  } catch (error) {
    console.error("Attendance sessions GET error:", error);
    return NextResponse.json({ error: "Could not load attendance sessions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Faculty access required." }, { status: 403 });
  }
  return NextResponse.json(
    { error: "Create attendance from the Classroom Roll-Call Ledger using its date and subject controls." },
    { status: 410 }
  );
}

export async function PUT(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Faculty access required." }, { status: 403 });
  }
  return NextResponse.json(
    { error: "Update attendance from the Classroom Roll-Call Ledger using its date and subject controls." },
    { status: 410 }
  );
}
