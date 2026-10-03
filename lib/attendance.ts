import type { AttendanceStatus } from "@/lib/types";

export const ATTENDANCE_RULES = {
  lateCountsAsPresent: true,
};

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
