import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser || !["HOD", "PRINCIPAL"].includes(sessionUser.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only HOD or Principal can override the 24-hour attendance lockout." },
      { status: 403 }
    );
  }

  try {
    const { sessionId, reason } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { department: true, faculty: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Attendance session not found." }, { status: 404 });
    }

    if (sessionUser.role === "HOD" && sessionUser.departmentId && session.departmentId !== sessionUser.departmentId) {
      return NextResponse.json(
        { error: "Forbidden: HOD can only override attendance for their own department." },
        { status: 403 }
      );
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        isLockedOverride: true,
        unlockedBy: sessionUser.username,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "ATTENDANCE_LOCKOUT_OVERRIDE",
        performedBy: sessionUser.username,
        details: JSON.stringify({
          sessionId,
          subject: session.subject,
          department: session.department.code,
          faculty: `${session.faculty.firstName} ${session.faculty.lastName}`,
          role: sessionUser.role,
          reason: reason || "Administrative attendance lockout override granted.",
          unlockedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Session unlocked successfully by ${sessionUser.role} (${sessionUser.username}). Edits are now permitted.`,
      session: updated,
    });
  } catch (error: unknown) {
    console.error("Unlock error:", error);
    const message = error instanceof Error ? error.message : "Failed to override attendance lockout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
