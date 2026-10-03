/**
 * Audit Log Sanitizer
 * Recursively redacts credentials, secrets, and sensitive PII from audit records.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "confirmpassword",
  "currentpassword",
  "token",
  "refreshtoken",
  "jwt",
  "secret",
  "authorization",
  "cookie",
  "creditcard",
  "cvv",
  "ssn",
]);

export function sanitizeAuditData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Check if it's a JSON string
    const trimmed = data.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        const sanitized = sanitizeAuditData(parsed);
        return JSON.stringify(sanitized) as unknown as T;
      } catch {
        return data;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditData(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitizedObj[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitizedObj[key] = sanitizeAuditData(value);
      } else {
        sanitizedObj[key] = value;
      }
    }
    return sanitizedObj as T;
  }

  return data;
}

/**
 * Helper to safely format audit details string for Prisma AuditLog.create
 */
export function formatAuditDetails(details: Record<string, unknown> | string): string {
  if (typeof details === "string") {
    return sanitizeAuditData(details);
  }
  return JSON.stringify(sanitizeAuditData(details));
}
