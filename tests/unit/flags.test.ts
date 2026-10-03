import { describe, it, expect } from "vitest";
import { isFeatureEnabled, getAllFeatureFlags } from "@/lib/flags";

describe("lib/flags - Feature Flags and Role Targeting", () => {
  it("should evaluate default feature flags", () => {
    expect(isFeatureEnabled("new_attendance_ui")).toBe(true);
    expect(isFeatureEnabled("fee_payment_gateway")).toBe(true);
    expect(isFeatureEnabled("non_existent_flag")).toBe(false);
  });

  it("should respect role restrictions on feature flags", () => {
    expect(isFeatureEnabled("new_attendance_ui", { role: "FACULTY" })).toBe(true);
    expect(isFeatureEnabled("new_attendance_ui", { role: "STUDENT" })).toBe(false);
  });

  it("should return dictionary of all enabled feature flags", () => {
    const flags = getAllFeatureFlags({ role: "PRINCIPAL" });
    expect(flags).toHaveProperty("new_attendance_ui");
    expect(flags).toHaveProperty("fee_payment_gateway");
    expect(flags).toHaveProperty("strict_account_lockout");
  });
});
