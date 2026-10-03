import { describe, it, expect } from "vitest";
import {
  countsAsPresent,
  isValidAttendanceStatus,
  computeAttendancePercentage,
  summarizeSessionAttendance,
} from "@/lib/attendance";

describe("lib/attendance - Institutional Attendance Logic", () => {
  it("should validate allowed attendance statuses", () => {
    expect(isValidAttendanceStatus("PRESENT")).toBe(true);
    expect(isValidAttendanceStatus("ABSENT")).toBe(true);
    expect(isValidAttendanceStatus("LATE")).toBe(true);
    expect(isValidAttendanceStatus("UNKNOWN")).toBe(false);
  });

  it("should correctly evaluate countsAsPresent based on institutional rules", () => {
    expect(countsAsPresent("PRESENT")).toBe(true);
    expect(countsAsPresent("LATE")).toBe(true); // LATE counts as present under rule
    expect(countsAsPresent("ABSENT")).toBe(false);
    expect(countsAsPresent(null)).toBe(false);
  });

  it("should compute attendance percentages accurately", () => {
    expect(computeAttendancePercentage(15, 20)).toBe(75.0);
    expect(computeAttendancePercentage(0, 10)).toBe(0);
    expect(computeAttendancePercentage(5, 0)).toBe(0);
  });

  it("should summarize session attendance records properly", () => {
    const records = [
      { status: "PRESENT" },
      { status: "PRESENT" },
      { status: "ABSENT" },
      { status: "LATE" },
    ];

    const summary = summarizeSessionAttendance(records);
    expect(summary.held).toBe(4);
    expect(summary.attended).toBe(3); // 2 PRESENT + 1 LATE
    expect(summary.absent).toBe(1);
    expect(summary.late).toBe(1);
  });
});
