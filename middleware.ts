import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  ROLE_PORTAL_MAP,
  isRouteAllowed,
  verifyTokenEdge,
} from "@/lib/auth-edge";
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  verifyCsrf,
} from "@/lib/csrf";

// Security headers applied to all responses
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';",
};

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";

  // 0. API Versioning Rewrite: /api/v1/* -> /api/*
  if (pathname.startsWith("/api/v1/")) {
    const unversionedPath = pathname.replace(/^\/api\/v1/, "/api");
    const rewriteUrl = new URL(unversionedPath + req.nextUrl.search, req.url);
    const rewriteRes = NextResponse.rewrite(rewriteUrl);
    rewriteRes.headers.set("X-API-Version", "1.0");
    return applySecurityHeaders(rewriteRes);
  }

  // 1. Request body size limit check (DoS prevention)
  if (pathname.startsWith("/api/")) {
    const contentLength = req.headers.get("content-length");
    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      const isUpload = pathname.startsWith("/api/assignments") || pathname.startsWith("/api/auth/profile-photo");
      const maxBytes = isUpload ? 10 * 1024 * 1024 : 1 * 1024 * 1024; // 10MB for uploads, 1MB for API JSON
      if (bytes > maxBytes) {
        const errRes = NextResponse.json(
          { error: `Payload too large. Request body exceeds ${isUpload ? "10MB" : "1MB"} limit.` },
          { status: 413 }
        );
        return applySecurityHeaders(errRes);
      }
    }

    const csrfCheck = verifyCsrf(req);
    if (!csrfCheck.valid) {
      const errRes = NextResponse.json(
        { error: csrfCheck.reason || "Forbidden: CSRF check failed" },
        { status: 403 }
      );
      return applySecurityHeaders(errRes);
    }
  }

  // 2. Handle Login Page - redirect if already authenticated
  if (pathname === "/login") {
    const sessionCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (sessionCookie) {
      const payload = await verifyTokenEdge(sessionCookie);
      if (payload?.role) {
        const dest = ROLE_PORTAL_MAP[payload.role] || "/student";
        const redirectRes = NextResponse.redirect(new URL(dest, req.url));
        return applySecurityHeaders(redirectRes);
      }
    }
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  // 3. Protected Portal Routes
  const isPortalRoute = [
    "/student",
    "/faculty",
    "/hod",
    "/admissions",
    "/principal",
  ].some((portal) => pathname === portal || pathname.startsWith(`${portal}/`));

  if (isPortalRoute) {
    const sessionCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirectRes);
    }

    const payload = await verifyTokenEdge(sessionCookie);
    if (!payload?.userId || !payload?.role) {
      // Invalid or expired token -> clear cookie and redirect to login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "session_expired");
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.delete(AUTH_COOKIE_NAME);
      return applySecurityHeaders(redirectRes);
    }

    // Role-based route authorization
    if (!isRouteAllowed(pathname, payload.role)) {
      const assignedPortal = ROLE_PORTAL_MAP[payload.role] || "/login";
      const redirectRes = NextResponse.redirect(new URL(assignedPortal, req.url));
      return applySecurityHeaders(redirectRes);
    }
  }

  // 4. Default Pass-through with CSRF cookie establishment if missing
  const res = NextResponse.next();
  applySecurityHeaders(res);

  if (!req.cookies.has(CSRF_COOKIE_NAME)) {
    const newCsrf = generateCsrfToken();
    res.cookies.set(CSRF_COOKIE_NAME, newCsrf, {
      path: "/",
      sameSite: "lax",
      secure: isProduction,
      httpOnly: false, // Accessible by client scripts to set x-csrf-token
    });
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
