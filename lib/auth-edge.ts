// Edge Runtime authentication & role authorization utilities
import { jwtVerify, SignJWT } from "jose";
import { JWTPayload, Role } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "rrce_fallback_jwt_secret_key_2025_prod";
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export const AUTH_COOKIE_NAME = "rrce_session";

export const ROLE_PORTAL_MAP: Record<Role, string> = {
  STUDENT: "/student",
  FACULTY: "/faculty",
  HOD: "/hod",
  ADMISSIONS: "/admissions",
  PRINCIPAL: "/principal",
};

export const ROLE_ALLOWED_ROUTES: Record<string, Role[]> = {
  "/student": ["STUDENT", "PRINCIPAL"],
  "/faculty": ["FACULTY", "HOD", "PRINCIPAL"],
  "/hod": ["HOD", "PRINCIPAL"],
  "/admissions": ["ADMISSIONS", "PRINCIPAL"],
  "/principal": ["PRINCIPAL"],
};

/**
 * Verify JWT token in Next.js Edge runtime (jose-based)
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Sign JWT token in Next.js Edge runtime (jose-based)
 */
export async function signTokenEdge(
  payload: JWTPayload,
  expiresIn: string = "7d"
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey);
}

/**
 * Check whether a user's role is allowed to access a specific route pathname
 */
export function isRouteAllowed(pathname: string, role: Role): boolean {
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ALLOWED_ROUTES)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      return allowedRoles.includes(role);
    }
  }
  return true; // Non-protected routes are allowed
}
