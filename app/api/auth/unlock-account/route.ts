import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { unlockAccount } from "@/lib/account-lockout";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);

  // Require administrative privilege (PRINCIPAL or ADMISSIONS)
  if (!session || !["PRINCIPAL", "ADMISSIONS"].includes(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only administrators can manually unlock user accounts." },
      { status: 403 }
    );
  }

  try {
    const { identifier } = await req.json();

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { error: "Identifier (username/email/USN) is required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const wasLocked = unlockAccount(cleanIdentifier);

    try {
      await prisma.auditLog.create({
        data: {
          action: "ACCOUNT_MANUALLY_UNLOCKED",
          performedBy: session.username,
          details: JSON.stringify({
            unlockedIdentifier: cleanIdentifier,
            unlockedBy: session.userId,
            unlockedByRole: session.role,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, "Failed to write audit log for account unlock");
    }

    return NextResponse.json({
      success: true,
      wasLocked,
      message: `Account for "${identifier}" has been unlocked successfully.`,
    });
  } catch (err: unknown) {
    logger.error({ err }, "Error unlocking account");
    const msg = err instanceof Error ? err.message : "Internal error unlocking account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
