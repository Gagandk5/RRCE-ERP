import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, comparePassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to change your password." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Current password, new password, and confirmation are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters in length." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    // Lookup user in PostgreSQL
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
    } catch (err) {
      console.warn("Database lookup error in change-password:", err);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User account could not be found for this session." },
        { status: 404 }
      );
    }

    const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "The current password you entered is incorrect." },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        isPasswordResetRequired: false,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: "PASSWORD_CHANGED",
          performedBy: session.email || session.username || "FACULTY",
          details: JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      console.warn("AuditLog recording warning:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: unknown) {
    console.error("Change password route error:", error);
    const msg = error instanceof Error ? error.message : "Internal error changing password.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
