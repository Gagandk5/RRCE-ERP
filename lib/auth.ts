import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { JWTPayload, Role } from "./types";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "rrce_fallback_jwt_secret_key_2025_prod";
const COOKIE_NAME = "rrce_session";

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): JWTPayload | null {
  try {
    const tokenFromCookie = req.cookies.get(COOKIE_NAME)?.value;
    const authHeader = req.headers.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const token = tokenFromCookie || tokenFromHeader;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        department: true,
        studentProfile: {
          include: {
            department: true,
            invoices: true,
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
}

export function isAuthorized(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}

export const AUTH_COOKIE_CONFIG = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
