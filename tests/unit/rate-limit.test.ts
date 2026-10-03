import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("lib/rate-limit - Sliding Window In-Memory Limiter", () => {
  it("should allow requests under the limit", () => {
    const id = "test-client-1";
    const res1 = checkRateLimit(id, { limit: 3, windowMs: 5000, keyPrefix: "test" });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(id, { limit: 3, windowMs: 5000, keyPrefix: "test" });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(id, { limit: 3, windowMs: 5000, keyPrefix: "test" });
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should block requests exceeding the limit", () => {
    const id = "test-client-2";
    checkRateLimit(id, { limit: 2, windowMs: 5000, keyPrefix: "test" });
    checkRateLimit(id, { limit: 2, windowMs: 5000, keyPrefix: "test" });

    const blocked = checkRateLimit(id, { limit: 2, windowMs: 5000, keyPrefix: "test" });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });
});
