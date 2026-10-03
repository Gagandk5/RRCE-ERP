import { describe, it, expect } from "vitest";
import {
  signTokenEdge,
  verifyTokenEdge,
  isRouteAllowed,
  ROLE_PORTAL_MAP,
} from "@/lib/auth-edge";
import { JWTPayload } from "@/lib/types";

describe("lib/auth-edge - Edge Runtime Auth & Role Protection", () => {
  const samplePayload: JWTPayload = {
    userId: "edge-user-456",
    email: "student@rrce.org",
    username: "1rr25bc001",
    role: "STUDENT",
    firstName: "Gagan",
    lastName: "D K",
    departmentId: "dept-bca",
    departmentCode: "BCA",
    isPasswordResetRequired: false,
    usn: "1RR25BC001",
  };

  it("should sign and verify JWT tokens in edge environment with jose", async () => {
    const token = await signTokenEdge(samplePayload, "1h");
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifyTokenEdge(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(samplePayload.userId);
    expect(verified?.role).toBe("STUDENT");
    expect(verified?.usn).toBe("1RR25BC001");
  });

  it("should return null for invalid edge JWT tokens", async () => {
    const verified = await verifyTokenEdge("garbage.token.data");
    expect(verified).toBeNull();
  });

  it("should correctly check route role authorization", () => {
    // Student portal
    expect(isRouteAllowed("/student", "STUDENT")).toBe(true);
    expect(isRouteAllowed("/student/profile", "STUDENT")).toBe(true);
    expect(isRouteAllowed("/student", "PRINCIPAL")).toBe(true);
    expect(isRouteAllowed("/student", "FACULTY")).toBe(false);

    // Faculty portal
    expect(isRouteAllowed("/faculty", "FACULTY")).toBe(true);
    expect(isRouteAllowed("/faculty/attendance", "HOD")).toBe(true);
    expect(isRouteAllowed("/faculty", "STUDENT")).toBe(false);

    // HOD portal
    expect(isRouteAllowed("/hod", "HOD")).toBe(true);
    expect(isRouteAllowed("/hod", "PRINCIPAL")).toBe(true);
    expect(isRouteAllowed("/hod", "STUDENT")).toBe(false);
    expect(isRouteAllowed("/hod", "FACULTY")).toBe(false);

    // Admissions portal
    expect(isRouteAllowed("/admissions", "ADMISSIONS")).toBe(true);
    expect(isRouteAllowed("/admissions", "PRINCIPAL")).toBe(true);
    expect(isRouteAllowed("/admissions", "STUDENT")).toBe(false);

    // Principal portal
    expect(isRouteAllowed("/principal", "PRINCIPAL")).toBe(true);
    expect(isRouteAllowed("/principal", "HOD")).toBe(false);
    expect(isRouteAllowed("/principal", "ADMISSIONS")).toBe(false);
  });

  it("should have valid portal mappings for all 5 roles", () => {
    expect(ROLE_PORTAL_MAP.STUDENT).toBe("/student");
    expect(ROLE_PORTAL_MAP.FACULTY).toBe("/faculty");
    expect(ROLE_PORTAL_MAP.HOD).toBe("/hod");
    expect(ROLE_PORTAL_MAP.ADMISSIONS).toBe("/admissions");
    expect(ROLE_PORTAL_MAP.PRINCIPAL).toBe("/principal");
  });
});
