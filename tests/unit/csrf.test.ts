import { describe, it, expect } from "vitest";
import {
  generateCsrfToken,
  safeEqual,
  isSafeMethod,
  isCsrfExempt,
} from "@/lib/csrf";

describe("lib/csrf - CSRF Protection Utilities", () => {
  it("should generate cryptographically secure 64-char hex tokens", () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
    expect(/^[0-9a-f]{64}$/.test(token1)).toBe(true);
  });

  it("should perform timing-safe string equality checks", () => {
    const strA = "secret_csrf_token_1234567890abcdef";
    const strB = "secret_csrf_token_1234567890abcdef";
    const strC = "secret_csrf_token_1234567890abcdeg";

    expect(safeEqual(strA, strB)).toBe(true);
    expect(safeEqual(strA, strC)).toBe(false);
    expect(safeEqual(strA, "short")).toBe(false);
  });

  it("should identify HTTP safe methods", () => {
    expect(isSafeMethod("GET")).toBe(true);
    expect(isSafeMethod("get")).toBe(true);
    expect(isSafeMethod("HEAD")).toBe(true);
    expect(isSafeMethod("OPTIONS")).toBe(true);
    expect(isSafeMethod("POST")).toBe(false);
    expect(isSafeMethod("PUT")).toBe(false);
    expect(isSafeMethod("DELETE")).toBe(false);
    expect(isSafeMethod("PATCH")).toBe(false);
  });

  it("should properly identify CSRF exempt endpoints", () => {
    expect(isCsrfExempt("/api/auth/login")).toBe(true);
    expect(isCsrfExempt("/api/auth/forgot-password")).toBe(true);
    expect(isCsrfExempt("/api/auth/reset-password")).toBe(true);
    expect(isCsrfExempt("/api/health")).toBe(true);
    expect(isCsrfExempt("/api/students/update")).toBe(false);
    expect(isCsrfExempt("/api/attendance/session")).toBe(false);
  });
});
