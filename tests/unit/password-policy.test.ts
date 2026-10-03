import { describe, it, expect } from "vitest";
import { validatePassword } from "@/lib/password-policy";

describe("lib/password-policy - Institutional Password Complexity Checks", () => {
  it("should accept strong passwords meeting all requirements", () => {
    const result = validatePassword("Rrce@2025Secure!");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("should reject passwords that are too short", () => {
    const result = validatePassword("Aa1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password must be at least 8 characters long");
  });

  it("should reject common dictionary passwords", () => {
    const result = validatePassword("password123");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password is too common or easily guessable");
  });

  it("should require uppercase, lowercase, numbers, and special characters", () => {
    const noUpper = validatePassword("alllower123!");
    expect(noUpper.valid).toBe(false);
    expect(noUpper.errors).toContain("Password must contain at least one uppercase letter (A-Z)");

    const noLower = validatePassword("ALLUPPER123!");
    expect(noLower.valid).toBe(false);
    expect(noLower.errors).toContain("Password must contain at least one lowercase letter (a-z)");

    const noDigit = validatePassword("NoDigitsHere!@#");
    expect(noDigit.valid).toBe(false);
    expect(noDigit.errors).toContain("Password must contain at least one numeric digit (0-9)");

    const noSymbol = validatePassword("NoSymbols1234");
    expect(noSymbol.valid).toBe(false);
    expect(noSymbol.errors).toContain("Password must contain at least one special symbol (!@#$%^&*...)");
  });
});
