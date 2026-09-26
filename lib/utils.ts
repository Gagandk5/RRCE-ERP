import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Default Password Formula:
 * [NAME_FIRST_3_UPPERCASE][DD][MM][YY]
 * Example: Amith T born July 8, 2007 -> "AMI080707"
 */
export function generateDefaultPassword(name: string, dob: Date | string): string {
  const cleanName = name.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase();
  const namePart = (cleanName + "RRCE").slice(0, 3);

  let day = "01";
  let month = "01";
  let year = "07";

  if (typeof dob === "string" && dob.includes("-")) {
    const parts = dob.split("-");
    if (parts.length === 3) {
      year = parts[0].slice(-2);
      month = parts[1].padStart(2, "0");
      day = parts[2].padStart(2, "0");
    }
  } else if (typeof dob === "string" && dob.includes("/")) {
    const parts = dob.split("/");
    if (parts.length === 3) {
      day = parts[0].padStart(2, "0");
      month = parts[1].padStart(2, "0");
      year = parts[2].slice(-2);
    }
  } else {
    const dateObj = typeof dob === "string" ? new Date(dob) : dob;
    day = String(dateObj.getUTCDate()).padStart(2, "0");
    month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    year = String(dateObj.getUTCFullYear()).slice(-2);
  }

  return `${namePart}${day}${month}${year}`;
}

/**
 * Generates official VTU / RRCE USN
 * Format: 1RR25BC001
 * [CollegeCode][Year][BranchCode][Sequence]
 */
export function generateUSN(
  collegeCode = "1RR",
  year = "25",
  branchCode = "BC",
  sequence: number
): string {
  const seqPadded = String(sequence).padStart(3, "0");
  return `${collegeCode.toUpperCase()}${year}${branchCode.toUpperCase()}${seqPadded}`;
}

/**
 * Checks if an attendance session is locked by the 24-hour lockout rule.
 */
export function checkAttendanceLockout(session: {
  createdAt: Date | string;
  isLockedOverride?: boolean;
}): {
  isLocked: boolean;
  remainingMs: number;
  formattedRemaining: string;
} {
  if (session.isLockedOverride) {
    return {
      isLocked: false,
      remainingMs: Infinity,
      formattedRemaining: "Unlocked (Override Active)",
    };
  }

  const createdTime = new Date(session.createdAt).getTime();
  const lockTime = createdTime + 24 * 60 * 60 * 1000;
  const now = Date.now();
  const remainingMs = lockTime - now;

  if (remainingMs <= 0) {
    return {
      isLocked: true,
      remainingMs: 0,
      formattedRemaining: "Locked (24-hour limit exceeded)",
    };
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    isLocked: false,
    remainingMs,
    formattedRemaining: `${hours}h ${minutes}m left to edit`,
  };
}

/**
 * Format Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
