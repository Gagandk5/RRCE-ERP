import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_CONFIG } from "@/lib/auth";
import { Role } from "@/lib/types";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // Rate limiting: 5 attempts per minute per IP
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
      logger.warn({ identifier: cleanIdentifier, ip: clientIp }, "Login failed: user not found");
      return NextResponse.json(
        { error: `Invalid credentials for "${identifier}". Please verify your account details.` },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(cleanPassword, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn({ userId: user.id, identifier: cleanIdentifier, ip: clientIp }, "Login failed: invalid password");
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      logger.warn({ userId: user.id }, "Login rejected: account deactivated");
      return NextResponse.json(
        { error: "This account has been deactivated. Contact administration." },
        { status: 403 }
      );
    }

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

    const token = signToken(payload);
    const redirectUrl = getPortalRedirect(user.role as Role);

    logger.info({ userId: user.id, role: user.role }, "Login successful");

    const response = NextResponse.json({
      success: true,
      user: payload,
      redirectUrl,
      dbConnected: true,
    });

    response.cookies.set(AUTH_COOKIE_CONFIG.name, token, AUTH_COOKIE_CONFIG.options);
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
