import { logger } from "./logger";

interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window

const lockoutStore = new Map<string, AttemptRecord>();

// Cleanup stale lockout entries periodically
setInterval(() => {
  const now = Date.now();
  lockoutStore.forEach((record, key) => {
    if (record.lockedUntil && record.lockedUntil < now) {
      lockoutStore.delete(key);
    } else if (now - record.lastAttempt > WINDOW_MS && !record.lockedUntil) {
      lockoutStore.delete(key);
    }
  });
}, 60 * 1000);

export function isAccountLocked(identifier: string): {
  locked: boolean;
  remainingMs: number;
  attempts: number;
} {
  const cleanId = identifier.trim().toLowerCase();
  const record = lockoutStore.get(cleanId);
  const now = Date.now();

  if (!record) {
    return { locked: false, remainingMs: 0, attempts: 0 };
  }

  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      return {
        locked: true,
        remainingMs: record.lockedUntil - now,
        attempts: record.count,
      };
    } else {
      // Lock expired
      lockoutStore.delete(cleanId);
      return { locked: false, remainingMs: 0, attempts: 0 };
    }
  }

  return {
    locked: false,
    remainingMs: 0,
    attempts: record.count,
  };
}

export function recordFailedAttempt(
  identifier: string,
  ip: string
): {
  locked: boolean;
  remainingAttempts: number;
  lockoutSeconds?: number;
} {
  const cleanId = identifier.trim().toLowerCase();
  const now = Date.now();
  let record = lockoutStore.get(cleanId);

  if (!record || now - record.lastAttempt > WINDOW_MS) {
    record = { count: 1, lastAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
    record.lastAttempt = now;
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    lockoutStore.set(cleanId, record);
    logger.warn(
      { identifier: cleanId, ip, lockoutUntil: new Date(record.lockedUntil).toISOString() },
      "Account temporarily locked due to repeated failed login attempts"
    );
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  lockoutStore.set(cleanId, record);
  return {
    locked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.count),
  };
}

export function resetFailedAttempts(identifier: string): void {
  const cleanId = identifier.trim().toLowerCase();
  lockoutStore.delete(cleanId);
}

export function unlockAccount(identifier: string): boolean {
  const cleanId = identifier.trim().toLowerCase();
  const existed = lockoutStore.has(cleanId);
  lockoutStore.delete(cleanId);
  logger.info({ identifier: cleanId }, "Account manually unlocked");
  return existed;
}
