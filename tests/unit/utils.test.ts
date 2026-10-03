import { describe, it, expect } from "vitest";
import { generateUSN, generateDefaultPassword, checkAttendanceLockout, formatINR } from "@/lib/utils";

describe("lib/utils - Institutional Utilities", () => {
  it("should generate standardized USN correctly", () => {
    expect(generateUSN("1RR", "25", "BC", 1)).toBe("1RR25BC001");
    expect(generateUSN("1RR", "25", "BC", 7)).toBe("1RR25BC007");
    expect(generateUSN("1RR", "25", "CS", 42)).toBe("1RR25CS042");
    expect(generateUSN("1RR", "25", "AI", 100)).toBe("1RR25AI100");
  });

  it("should generate standardized default formula password", () => {
    // Formula: First 3 letters of first name (uppercase) + DDMMYY
    const pwd1 = generateDefaultPassword("Gagan", "2007-12-14");
    expect(pwd1).toBe("GAG141207");

    const pwd2 = generateDefaultPassword("Amith", new Date("2007-07-08"));
    expect(pwd2).toBe("AMI080707");

    // Short name pads with institutional fallback
    const pwd3 = generateDefaultPassword("Al", "2008-01-05");
    expect(pwd3).toBe("ALR050108");
  });

  it("should check 24-hour attendance lockout rule accurately", () => {
    // Session created 2 hours ago (not locked)
    const recent = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentCheck = checkAttendanceLockout({ createdAt: recent });
    expect(recentCheck.isLocked).toBe(false);
    expect(recentCheck.remainingMs).toBeGreaterThan(0);

    // Session created 26 hours ago (locked)
    const old = new Date(Date.now() - 26 * 60 * 60 * 1000);
    const oldCheck = checkAttendanceLockout({ createdAt: old });
    expect(oldCheck.isLocked).toBe(true);
    expect(oldCheck.remainingMs).toBe(0);

    // Session with override active (never locked)
    const overrideCheck = checkAttendanceLockout({
      createdAt: old,
      isLockedOverride: true,
    });
    expect(overrideCheck.isLocked).toBe(false);
  });

  it("should format Indian Rupee currency correctly", () => {
    const formatted = formatINR(85000);
    expect(formatted).toContain("85,000");
  });
});
