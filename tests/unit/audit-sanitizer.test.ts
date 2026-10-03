import { describe, it, expect } from "vitest";
import { sanitizeAuditData, formatAuditDetails } from "@/lib/audit-sanitizer";

describe("lib/audit-sanitizer - Redacting Sensitive Credentials from Logs", () => {
  it("should redact password and token fields from object payloads", () => {
    const raw = {
      username: "amith.k",
      password: "SuperSecretPassword123!",
      token: "jwt_token_payload_xyz",
      email: "amith@rrce.org",
      nested: {
        currentPassword: "OldPass123!",
        safeField: "Active",
      },
    };

    const sanitized = sanitizeAuditData(raw);

    expect(sanitized.username).toBe("amith.k");
    expect(sanitized.email).toBe("amith@rrce.org");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.nested.currentPassword).toBe("[REDACTED]");
    expect(sanitized.nested.safeField).toBe("Active");
  });

  it("should format stringified audit details with credentials masked", () => {
    const jsonStr = JSON.stringify({
      action: "LOGIN",
      password: "secretpassword",
      role: "FACULTY",
    });

    const formatted = formatAuditDetails(jsonStr);
    expect(formatted).not.toContain("secretpassword");
    expect(formatted).toContain("[REDACTED]");
    expect(formatted).toContain("FACULTY");
  });
});
