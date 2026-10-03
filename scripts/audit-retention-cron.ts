import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

const PERMANENT_ACTIONS = [
  "BRANCH_REALLOCATION",
  "ATTENDANCE_LOCKOUT_OVERRIDE",
  "ACCOUNT_MANUALLY_UNLOCKED",
  "STUDENT_ENROLLMENT",
];

const RETENTION_YEARS = 7;

export async function runAuditRetentionPolicy(): Promise<{ deletedCount: number }> {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - RETENTION_YEARS);

  logger.info({ cutoffDate: cutoffDate.toISOString() }, "Executing AuditLog retention policy cleanup");

  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        action: {
          notIn: PERMANENT_ACTIONS,
        },
      },
    });

    logger.info({ prunedRecords: result.count }, "AuditLog retention cleanup completed");
    return { deletedCount: result.count };
  } catch (error) {
    logger.error({ error }, "Error during audit retention cleanup");
    throw error;
  }
}

// Allow direct execution via tsx scripts/audit-retention-cron.ts
if (require.main === module) {
  runAuditRetentionPolicy()
    .then((res) => {
      console.log(`[RETENTION CRON] Pruned ${res.deletedCount} expired audit logs.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[RETENTION CRON ERROR]:", err);
      process.exit(1);
    });
}
