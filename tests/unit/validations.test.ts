import { describe, it, expect } from "vitest";
import {
  loginSchema,
  changePasswordSchema,
  studentEnrollSchema,
  attendanceUnlockSchema,
} from "@/lib/validations";

describe("lib/validations - Zod API Request Schemas", () => {
  it("should validate valid login inputs", () => {
    const valid = loginSchema.safeParse({
      identifier: "1rr25bc007",
      password: "secretpassword",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject empty login inputs", () => {
    const invalid = loginSchema.safeParse({
      identifier: "",
      password: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("should reject short passwords in changePasswordSchema", () => {
    const invalid = changePasswordSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "123", // too short
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate correct student enrollment payloads", () => {
    const valid = studentEnrollSchema.safeParse({
      firstName: "Rahul",
      lastName: "Dravid",
      email: "rahul@rrce.org",
      phone: "+91 9845012345",
      dob: "2007-01-11",
      departmentId: "dept-bca",
      quota: "KCET",
      semester: 3,
    });
    expect(valid.success).toBe(true);
  });

  it("should require reason for attendance lockout override", () => {
    const valid = attendanceUnlockSchema.safeParse({
      sessionId: "session-123",
      reason: "Network downtime delayed submission",
    });
    expect(valid.success).toBe(true);

    const invalid = attendanceUnlockSchema.safeParse({
      sessionId: "session-123",
      reason: "", // too short
    });
    expect(invalid.success).toBe(false);
  });
});
