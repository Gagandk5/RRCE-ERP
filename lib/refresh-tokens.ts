import crypto from "crypto";
import prisma from "./prisma";
import { signToken } from "./auth";
import { JWTPayload, Role } from "./types";
import { logger } from "./logger";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createRefreshToken(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });

  return { token: rawToken, expiresAt };
}

export async function rotateRefreshToken(
  rawToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ accessToken: string; newRefreshToken: string } | null> {
  const tokenHash = hashToken(rawToken);

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          department: true,
          studentProfile: {
            include: {
              department: true,
            },
          },
        },
      },
    },
  });

  if (!existing) {
    logger.warn({ ip: ipAddress }, "Invalid refresh token presented");
    return null;
  }

  // Reuse detection: If token was already revoked, someone may have compromised it!
  if (existing.revokedAt) {
    logger.error(
      { userId: existing.userId, ip: ipAddress },
      "SECURITY ALERT: Revoked refresh token reuse detected! Invalidating all user sessions."
    );
    await revokeAllUserRefreshTokens(existing.userId);
    return null;
  }

  // Expiry check
  if (existing.expiresAt < new Date()) {
    logger.info({ userId: existing.userId }, "Expired refresh token used");
    return null;
  }

  // Account active check
  if (!existing.user.isActive) {
    return null;
  }

  // Revoke the old token (Rotate)
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  // Issue new access token
  const payload: JWTPayload = {
    userId: existing.user.id,
    email: existing.user.email,
    username: existing.user.username,
    role: existing.user.role as Role,
    firstName: existing.user.firstName,
    lastName: existing.user.lastName,
    departmentId: existing.user.departmentId,
    departmentCode: existing.user.department?.code || existing.user.studentProfile?.department?.code,
    studentId: existing.user.studentProfile?.id,
    usn: existing.user.studentProfile?.usn,
    isPasswordResetRequired: existing.user.isPasswordResetRequired || false,
  };

  const accessToken = signToken(payload);

  // Issue new refresh token
  const { token: newRefreshToken } = await createRefreshToken(existing.userId, userAgent, ipAddress);

  return { accessToken, newRefreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  try {
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
