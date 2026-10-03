import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, hashPassword, signToken, AUTH_COOKIE_CONFIG } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validatePassword } from "@/lib/password-policy";
import { formatAuditDetails } from "@/lib/audit-sanitizer";

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

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required." },
        { status: 400 }
      );
    }

    // Password strength check (Item 12)
    const policyResult = validatePassword(newPassword);
    if (!policyResult.valid) {
      return NextResponse.json(
        {
          error: policyResult.errors[0],
          details: policyResult.errors,
        },
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
          tokenVersion: { increment: 1 },
        },
      });

      // Invalidate all existing refresh tokens (Item 19)
      try {
        const { revokeAllUserRefreshTokens } = await import("@/lib/refresh-tokens");
        await revokeAllUserRefreshTokens(session.userId);
      } catch (revokeErr) {
        logger.warn({ revokeErr }, "Failed to revoke refresh tokens during password reset");
      }

      // Sanitized audit log recording (Item 13)
      await prisma.auditLog.create({
        data: {
          action: "PASSWORD_RESET",
          performedBy: session.username,
          details: formatAuditDetails({
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
