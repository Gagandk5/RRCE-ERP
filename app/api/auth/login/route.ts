import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_CONFIG } from "@/lib/auth";
import { Role } from "@/lib/types";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { loginSchema } from "@/lib/validations";
import {
  isAccountLocked,
  recordFailedAttempt,
  resetFailedAttempts,
} from "@/lib/account-lockout";
import { createRefreshToken } from "@/lib/refresh-tokens";
import { formatAuditDetails } from "@/lib/audit-sanitizer";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || undefined;

  // 1. Rate limiting check (5 attempts per minute per IP)
  const rl = checkRateLimit(clientIp, {
    limit: 5,
    windowMs: 60 * 1000,
    keyPrefix: "auth_login",
  });

  if (!rl.success) {
    logger.warn({ ip: clientIp }, "Rate limit exceeded on /api/auth/login");
    return rateLimitResponse(rl.limit, rl.resetMs);
  }

  try {
    const rawBody = await req.json();

    // 2. Zod validation
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 3. Account lockout check
    const lockStatus = isAccountLocked(cleanIdentifier);
    if (lockStatus.locked) {
      const waitMinutes = Math.ceil(lockStatus.remainingMs / 60000);
      logger.warn({ identifier: cleanIdentifier, ip: clientIp }, "Attempt on locked account blocked");
      return NextResponse.json(
        {
          error: `This account is temporarily locked due to 5 consecutive failed login attempts. Please wait ${waitMinutes} minute(s) before trying again or contact administration.`,
          isLocked: true,
          remainingMinutes: waitMinutes,
        },
        { status: 423 }
      );
    }

    logger.info({ identifier: cleanIdentifier, ip: clientIp }, "Login attempt initiated");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: "insensitive" } },
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          {
            studentProfile: {
              usn: { equals: cleanIdentifier, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        department: true,
        studentProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      const attempt = recordFailedAttempt(cleanIdentifier, clientIp);
      logger.warn({ identifier: cleanIdentifier, ip: clientIp }, "Login failed: user not found");
      return NextResponse.json(
        {
          error: attempt.locked
            ? "Account has been locked for 15 minutes due to repeated failed attempts."
            : `Invalid credentials. (${attempt.remainingAttempts} attempt(s) remaining before temporary lockout)`,
        },
        { status: attempt.locked ? 423 : 401 }
      );
    }

    const isPasswordValid = await comparePassword(cleanPassword, user.passwordHash);

    if (!isPasswordValid) {
      const attempt = recordFailedAttempt(cleanIdentifier, clientIp);
      logger.warn({ userId: user.id, identifier: cleanIdentifier, ip: clientIp }, "Login failed: invalid password");
      return NextResponse.json(
        {
          error: attempt.locked
            ? "Account has been locked for 15 minutes due to repeated failed attempts."
            : `Invalid credentials. (${attempt.remainingAttempts} attempt(s) remaining before temporary lockout)`,
        },
        { status: attempt.locked ? 423 : 401 }
      );
    }

    if (!user.isActive) {
      logger.warn({ userId: user.id }, "Login rejected: account deactivated");
      return NextResponse.json(
        { error: "This account has been deactivated. Contact administration." },
        { status: 403 }
      );
    }

    // 4. Reset failed attempts counter on success
    resetFailedAttempts(cleanIdentifier);

    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as Role,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId,
      departmentCode: user.department?.code || user.studentProfile?.department?.code,
      studentId: user.studentProfile?.id,
      usn: user.studentProfile?.usn,
      isPasswordResetRequired: user.isPasswordResetRequired || false,
    };

    // Issue JWT access token (7 days)
    const token = signToken(payload);
    const redirectUrl = getPortalRedirect(user.role as Role);

    // 5. Issue Refresh Token on Login
    let refreshToken: string | null = null;
    try {
      const rt = await createRefreshToken(user.id, userAgent, clientIp);
      refreshToken = rt.token;
    } catch (rtErr) {
      logger.warn({ err: rtErr }, "Refresh token creation warning on login");
    }

    // 6. Record audit log using formatAuditDetails()
    try {
      await prisma.auditLog.create({
        data: {
          action: "USER_LOGIN_SUCCESS",
          performedBy: user.username,
          details: formatAuditDetails({
            userId: user.id,
            role: user.role,
            ip: clientIp,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, "Failed to write audit log for login");
    }

    logger.info({ userId: user.id, role: user.role }, "Login successful");

    const response = NextResponse.json({
      success: true,
      user: payload,
      redirectUrl,
      dbConnected: true,
    });

    // Set access token cookie
    response.cookies.set(AUTH_COOKIE_CONFIG.name, token, AUTH_COOKIE_CONFIG.options);

    // Set refresh token cookie if issued
    if (refreshToken) {
      response.cookies.set("rrce_refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error: unknown) {
    logger.error({ error }, "Unhandled error during login");
    const message = error instanceof Error ? error.message : "Internal login error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getPortalRedirect(role: Role): string {
  switch (role) {
    case "PRINCIPAL":
      return "/principal";
    case "ADMISSIONS":
      return "/admissions";
    case "HOD":
      return "/hod";
    case "FACULTY":
      return "/faculty";
    case "STUDENT":
      return "/student";
    default:
      return "/";
  }
}
