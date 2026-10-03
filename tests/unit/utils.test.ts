import { describe, it, expect } from "vitest";
import { generateUSN, generateDefaultPassword, formatINR } from "@/lib/utils";
import { getAttendanceDateString, isFutureAttendanceDate } from "@/lib/attendance";

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

  it("should compare attendance dates in the institutional timezone and reject only future dates", () => {
    const beforeKolkataMidnight = new Date("2026-10-03T18:29:00.000Z");
    const afterKolkataMidnight = new Date("2026-10-03T18:31:00.000Z");

    expect(getAttendanceDateString(beforeKolkataMidnight)).toBe("2026-10-03");
    expect(getAttendanceDateString(afterKolkataMidnight)).toBe("2026-10-04");
    expect(isFutureAttendanceDate("2026-10-04", beforeKolkataMidnight)).toBe(true);
    expect(isFutureAttendanceDate("2026-10-03", beforeKolkataMidnight)).toBe(false);
    expect(isFutureAttendanceDate("2026-09-01", beforeKolkataMidnight)).toBe(false);
  });

  it("should format Indian Rupee currency correctly", () => {
    const formatted = formatINR(85000);
    expect(formatted).toContain("85,000");
  });
});
