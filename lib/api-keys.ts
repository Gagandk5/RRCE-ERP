import crypto from "crypto";
import prisma from "./prisma";
import { logger } from "./logger";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export const API_SCOPES = [
  "students:read",
  "students:write",
  "attendance:read",
  "attendance:write",
  "timetable:read",
  "invoices:read",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/**
 * Generate a new API key with rrce_ prefix (e.g. rrce_live_...)
 */
export async function generateApiKey(
  name: string,
  permissions: string[],
  createdBy: string,
  expiresInDays?: number
): Promise<{ apiKey: string; id: string }> {
  const randomEntropy = crypto.randomBytes(24).toString("hex");
  const apiKey = `rrce_live_${randomEntropy}`;
  const keyHash = hashKey(apiKey);

  let expiresAt: Date | null = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  const record = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      permissions,
      createdBy,
      expiresAt,
    },
  });

  logger.info({ keyId: record.id, name, createdBy }, "New API key generated");

  return { apiKey, id: record.id };
}

/**
 * Verify an API key against optional permission requirement
 */
export async function verifyApiKey(
  rawKey: string,
  requiredPermission?: string
): Promise<{ valid: boolean; keyRecord?: { id: string; name: string; permissions: string[] }; reason?: string }> {
  if (!rawKey || !rawKey.startsWith("rrce_")) {
    return { valid: false, reason: "Invalid API key format" };
  }

  const keyHash = hashKey(rawKey);

  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!record) {
    return { valid: false, reason: "API key not recognized" };
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return { valid: false, reason: "API key has expired" };
  }

  if (requiredPermission && !record.permissions.includes(requiredPermission) && !record.permissions.includes("*")) {
    return { valid: false, reason: `Missing required permission: ${requiredPermission}` };
  }

  // Update lastUsedAt asynchronously
  void prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  }).catch((err) => logger.warn({ err }, "Failed to update API key lastUsedAt"));

  return {
    valid: true,
    keyRecord: {
      id: record.id,
      name: record.name,
      permissions: record.permissions,
    },
  };
}

/**
 * Revoke an API key by its ID
 */
export async function revokeApiKey(id: string): Promise<boolean> {
  try {
    await prisma.apiKey.delete({
      where: { id },
    });
    logger.info({ keyId: id }, "API key revoked");
    return true;
  } catch {
    return false;
  }
}
