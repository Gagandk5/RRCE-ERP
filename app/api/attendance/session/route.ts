import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { checkAttendanceLockout } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  const searchParams = req.nextUrl.searchParams;
  const facultyId = searchParams.get("facultyId");
  const deptCode = searchParams.get("dept");
  const semester = searchParams.get("sem") ? parseInt(searchParams.get("sem")!) : undefined;

  try {
    let sessions: any[] = [];
    try {
      sessions = await prisma.attendanceSession.findMany({
        where: {
          facultyId: facultyId || (sessionUser?.role === "FACULTY" ? sessionUser.userId : undefined),
          department: deptCode ? { code: deptCode } : undefined,
          semester,
        },
        include: {
          faculty: {
            select: { firstName: true, lastName: true, email: true },
          },
          department: {
            select: { code: true, name: true },
          },
          records: {
            select: {
              id: true,
              studentId: true,
              status: true,
              remarks: true,
              student: {
                select: {
                  usn: true,
                  usnSequence: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
            orderBy: {
              student: {
                usnSequence: "asc",
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });
    } catch (dbErr) {
      console.warn("DB attendance sessions query failed, using mock data:", dbErr);
    }

    if (sessions.length === 0) {
      const mockSessions = [
        {
          id: "mock-sess-active",
          subject: "Problem Solving with C (25BC102)",
          facultyId: "mock-staff-hod_bca",
          departmentId: "mock-dept-bca",
          semester: 1,
          section: "A",
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lockedAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
          isLockedOverride: false,
          faculty: { firstName: "Praveen", lastName: "Gowda", email: "hod.bca@rrce.org" },
          department: { code: "BCA", name: "Bachelor of Computer Applications" },
          records: [],
          lockoutStatus: {
            isLocked: false,
            remainingMs: 22 * 60 * 60 * 1000,
            formattedRemaining: "22h left to edit",
          },
        },
        {
          id: "mock-sess-locked",
          subject: "Discrete Mathematics (25BC101)",
          facultyId: "mock-staff-faculty_math",
          departmentId: "mock-dept-bca",
          semester: 1,
          section: "A",
          date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          lockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isLockedOverride: false,
          faculty: { firstName: "Sunitha", lastName: "Sharma", email: "faculty.math@rrce.org" },
          department: { code: "BCA", name: "Bachelor of Computer Applications" },
          records: [],
          lockoutStatus: {
            isLocked: true,
            remainingMs: 0,
            formattedRemaining: "Locked (24-hour limit exceeded)",
          },
        },
      ];
      return NextResponse.json({ sessions: mockSessions, isMock: true });
    }

    const formatted = sessions.map((sess) => ({
      ...sess,
      lockoutStatus: checkAttendanceLockout({
        createdAt: sess.createdAt,
        isLockedOverride: sess.isLockedOverride,
      }),
    }));

    return NextResponse.json({ sessions: formatted, isMock: false });
  } catch (error: unknown) {
    console.error("Attendance sessions GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to load sessions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser || !["FACULTY", "HOD", "PRINCIPAL"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Unauthorized: Faculty or Admin only." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { subject, departmentId, semester, section, date } = body;

    if (!subject || !departmentId) {
      return NextResponse.json(
        { error: "Subject and department are required." },
        { status: 400 }
      );
    }

    const sessionDate = date ? new Date(date) : new Date();
    const lockedAt = new Date(sessionDate.getTime() + 24 * 60 * 60 * 1000);

    const newSession = await prisma.attendanceSession.create({
      data: {
        subject,
        facultyId: sessionUser.userId,
        departmentId,
        semester: semester || 1,
        section: section || "A",
        date: sessionDate,
        createdAt: sessionDate,
        lockedAt,
        isLockedOverride: false,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json({
      success: true,
      session: newSession,
      lockoutStatus: checkAttendanceLockout({
        createdAt: newSession.createdAt,
        isLockedOverride: false,
      }),
    });
  } catch (error: unknown) {
    console.error("Create session error:", error);
    const message = error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser || !["FACULTY", "HOD", "PRINCIPAL"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { sessionId, records } = body;

    if (!sessionId || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "sessionId and records array are required." },
        { status: 400 }
      );
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Attendance session not found." }, { status: 404 });
    }

    const lockout = checkAttendanceLockout({
      createdAt: session.createdAt,
      isLockedOverride: session.isLockedOverride,
    });

    if (lockout.isLocked) {
      return NextResponse.json(
        {
          error:
            "Attendance session is locked. 24 hours have elapsed since creation. Requires HOD or Principal override to edit.",
          isLocked: true,
          lockedAt: session.lockedAt,
        },
        { status: 403 }
      );
    }

    await prisma.$transaction(
      records.map((r) =>
        prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: r.studentId,
            },
          },
          update: {
            status: r.status,
            remarks: r.remarks,
          },
          create: {
            sessionId,
            studentId: r.studentId,
            status: r.status,
            remarks: r.remarks,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully recorded attendance for ${records.length} students.`,
      updatedCount: records.length,
    });
  } catch (error: unknown) {
    console.error("Attendance submission error:", error);
    const message = error instanceof Error ? error.message : "Failed to record attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
