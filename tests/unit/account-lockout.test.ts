import { describe, it, expect, beforeEach } from "vitest";
import {
  isAccountLocked,
  recordFailedAttempt,
  resetFailedAttempts,
  unlockAccount,
} from "@/lib/account-lockout";

describe("lib/account-lockout - Brute-force Mitigation", () => {
  const testId = "test.lockout.student";

  beforeEach(() => {
    resetFailedAttempts(testId);
  });

  it("should track failed login attempts sequentially", () => {
    const attempt1 = recordFailedAttempt(testId, "127.0.0.1");
    expect(attempt1.locked).toBe(false);
    expect(attempt1.remainingAttempts).toBe(4);

    const attempt2 = recordFailedAttempt(testId, "127.0.0.1");
    expect(attempt2.locked).toBe(false);
    expect(attempt2.remainingAttempts).toBe(3);
  });

  it("should lock account after 5 consecutive failures", () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt(testId, "127.0.0.1");
    }

    const fifthAttempt = recordFailedAttempt(testId, "127.0.0.1");
    expect(fifthAttempt.locked).toBe(true);
    expect(fifthAttempt.remainingAttempts).toBe(0);

    const check = isAccountLocked(testId);
    expect(check.locked).toBe(true);
    expect(check.remainingMs).toBeGreaterThan(0);
  });

  it("should reset attempt counter after successful reset", () => {
    recordFailedAttempt(testId, "127.0.0.1");
    recordFailedAttempt(testId, "127.0.0.1");
    resetFailedAttempts(testId);

    const check = isAccountLocked(testId);
    expect(check.locked).toBe(false);
    expect(check.attempts).toBe(0);
  });

  it("should allow manual unlock by administrators", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(testId, "127.0.0.1");
    }
    expect(isAccountLocked(testId).locked).toBe(true);

    const unlocked = unlockAccount(testId);
    expect(unlocked).toBe(true);
    expect(isAccountLocked(testId).locked).toBe(false);
  });
});
