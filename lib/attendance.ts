import type { AttendanceStatus } from "@/lib/types";

export const ATTENDANCE_RULES = {
  lateCountsAsPresent: true,
};

export const ATTENDANCE_TIME_ZONE = "Asia/Kolkata";
export const LOW_ATTENDANCE_THRESHOLD = 85;

export function getAttendanceDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ATTENDANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isFutureAttendanceDate(date: string, now: Date = new Date()): boolean {
  return date > getAttendanceDateString(now);
}

export function isValidAttendanceStatus(value: string): value is AttendanceStatus {
  return value === "PRESENT" || value === "ABSENT" || value === "LATE";
}

export function countsAsPresent(status: string | null | undefined): boolean {
  if (!status) return false;
  if (status === "PRESENT") return true;
  return status === "LATE" && ATTENDANCE_RULES.lateCountsAsPresent;
}

export function computeAttendancePercentage(attended: number, held: number): number {
  if (!held) return 0;
  return Number(((attended / held) * 100).toFixed(1));
}

export function isBelowAttendanceThreshold(
  attended: number,
  held: number,
  threshold = LOW_ATTENDANCE_THRESHOLD
): boolean {
  return held > 0 && (attended / held) * 100 < threshold;
}

export function summarizeSessionAttendance(records: Array<{ status: string }>) {
  return records.reduce(
    (totals, record) => {
      totals.held += 1;
      if (countsAsPresent(record.status)) totals.attended += 1;
      if (record.status === "ABSENT") totals.absent += 1;
      if (record.status === "LATE") totals.late += 1;
      return totals;
    },
    { held: 0, attended: 0, absent: 0, late: 0 }
  );
}
