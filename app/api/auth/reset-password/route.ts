import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, hashPassword, signToken, AUTH_COOKIE_CONFIG } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rl = checkRateLimit(clientIp, {
    limit: 5,
    windowMs: 60 * 1000,
    keyPrefix: "auth_reset_pwd",
  });

  if (!rl.success) {
    logger.warn({ ip: clientIp }, "Rate limit exceeded on /api/auth/reset-password");
    return rateLimitResponse(rl.limit, rl.resetMs);
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  try {
    const { newPassword, confirmPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation password do not match." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    try {
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          passwordHash: newHash,
          isPasswordResetRequired: false,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "PASSWORD_RESET",
          performedBy: session.username,
          details: JSON.stringify({
            userId: session.userId,
            action: "Forced first-login password reset completed",
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "DB password reset update warning");
    }

    const updatedPayload = {
      ...session,
      isPasswordResetRequired: false,
    };

    const token = signToken(updatedPayload);
    const response = NextResponse.json({
      success: true,
      message: "Password updated successfully! Welcome to RRCE ERP.",
      user: updatedPayload,
    });

    response.cookies.set(AUTH_COOKIE_CONFIG.name, token, AUTH_COOKIE_CONFIG.options);
    return response;
  } catch (error: unknown) {
    logger.error({ error }, "Password reset error");
    const message = error instanceof Error ? error.message : "Password reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
