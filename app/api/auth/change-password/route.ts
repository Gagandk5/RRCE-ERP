import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, comparePassword, hashPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { validatePassword } from "@/lib/password-policy";
import { formatAuditDetails } from "@/lib/audit-sanitizer";
import { changePasswordSchema } from "@/lib/validations";
import { revokeAllUserRefreshTokens } from "@/lib/refresh-tokens";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. Rate limiting check (5 attempts per minute)
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

    const rawBody = await req.json();

    // 2. Zod validation
    const parsed = changePasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    const confirmPassword = rawBody.confirmPassword;

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    // 3. Password policy validation (complexity & dictionary checks)
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

    // Lookup user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

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

    // 4. Update password and increment tokenVersion for session invalidation
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        isPasswordResetRequired: false,
        tokenVersion: { increment: 1 },
      },
    });

    // 5. Invalidate all refresh tokens for this user
    try {
      await revokeAllUserRefreshTokens(user.id);
    } catch (revokeErr) {
      logger.warn({ revokeErr }, "Failed to revoke refresh tokens during password change");
    }

    // 6. Record sanitized audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: "PASSWORD_CHANGED",
          performedBy: session.email || session.username || "USER",
          details: formatAuditDetails({
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
      message: "Password updated successfully. Other active sessions have been invalidated.",
    });
  } catch (error: unknown) {
    logger.error({ error }, "Change password route error");
    const msg = error instanceof Error ? error.message : "Internal error changing password.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
