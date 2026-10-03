import { NextRequest } from "next/server";

export const CSRF_COOKIE_NAME = "rrce_csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

// Endpoints exempt from CSRF checks (e.g. unauthenticated auth endpoints, webhook/health)
export const CSRF_EXEMPT_ROUTES = [
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/unlock-account",
  "/api/auth/refresh",
  "/api/health",
  "/api/health/ready",
  "/api/seed",
];

/**
 * Generate a cryptographically secure random 64-character hex CSRF token
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Check if the request method is considered safe (idempotent / read-only)
 */
export function isSafeMethod(method: string): boolean {
  return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

/**
 * Check if the pathname is exempt from CSRF token requirements
 */
export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Verify CSRF for incoming requests
 * Validates Origin/Referer matching and/or double-submit CSRF cookie & header
 */
export function verifyCsrf(req: NextRequest): { valid: boolean; reason?: string } {
  if (isSafeMethod(req.method)) {
    return { valid: true };
  }

  const { pathname } = req.nextUrl;
  if (isCsrfExempt(pathname)) {
    return { valid: true };
  }

  // 1. Validate Origin / Referer against request host
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return { valid: false, reason: "Cross-origin request forbidden" };
      }
    } catch {
      return { valid: false, reason: "Malformed Origin header" };
    }
  } else if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        return { valid: false, reason: "Cross-origin referer forbidden" };
      }
    } catch {
      return { valid: false, reason: "Malformed Referer header" };
    }
  }

  // 2. Double-submit cookie verification if token header is present
  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (headerToken && cookieToken) {
    if (!safeEqual(headerToken, cookieToken)) {
      return { valid: false, reason: "CSRF token mismatch" };
    }
  }

  return { valid: true };
}
