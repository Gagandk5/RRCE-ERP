import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, comparePassword, hashPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rl = checkRateLimit(clientIp, {
    limit: 5,
    windowMs: 60 * 1000,
    keyPrefix: "auth_change_pwd",
  });

  if (!rl.success) {
    logger.warn({ ip: clientIp }, "Rate limit exceeded on /api/auth/change-password");
    return rateLimitResponse(rl.limit, rl.resetMs);
  }

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
      logger.warn({ err }, "Database lookup error in change-password");
    }

    if (!user) {
      return NextResponse.json(
        { error: "User account could not be found for this session." },
        { status: 404 }
      );
    }

    const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      logger.warn({ userId: user.id }, "Failed password change: current password incorrect");
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
          performedBy: session.email || session.username || "USER",
          details: JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, "AuditLog recording warning");
    }

    logger.info({ userId: user.id }, "Password changed successfully");

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: unknown) {
    logger.error({ error }, "Change password route error");
    const msg = error instanceof Error ? error.message : "Internal error changing password.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
