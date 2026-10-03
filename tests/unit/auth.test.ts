import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, signToken, verifyToken } from "@/lib/auth";

describe("lib/auth - Security and JWT Token Handling", () => {
  it("should securely hash and verify passwords using bcrypt", async () => {
    const raw = "rrce2025";
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(hashed.startsWith("$2")).toBe(true);

    const match = await comparePassword(raw, hashed);
    expect(match).toBe(true);

    const wrongMatch = await comparePassword("wrong_password", hashed);
    expect(wrongMatch).toBe(false);
  });

  it("should sign and verify JWT tokens containing payload", () => {
    const payload = {
      userId: "test-user-123",
      email: "test@rrce.org",
      username: "test.faculty",
      role: "FACULTY" as const,
      firstName: "Test",
      lastName: "Professor",
      departmentId: "dept-bca",
      departmentCode: "BCA",
      isPasswordResetRequired: false,
    };

    const token = signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe("FACULTY");
  });

  it("should reject tampered or invalid JWT tokens", () => {
    const invalid = verifyToken("invalid.token.structure");
    expect(invalid).toBeNull();
  });
});
