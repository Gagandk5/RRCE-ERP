import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/refresh-tokens";
import { AUTH_COOKIE_CONFIG } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const REFRESH_COOKIE_NAME = "rrce_refresh_token";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || undefined;

  let refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    try {
      const body = await req.json();
      refreshToken = body.refreshToken;
    } catch {
      // Body may be empty if reading from cookie
    }
  }

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Refresh token is missing" },
      { status: 400 }
    );
  }

  try {
    const result = await rotateRefreshToken(refreshToken, userAgent, clientIp);

    if (!result) {
      const response = NextResponse.json(
        { error: "Invalid, expired, or revoked refresh token" },
        { status: 401 }
      );
      response.cookies.delete(AUTH_COOKIE_CONFIG.name);
      response.cookies.delete(REFRESH_COOKIE_NAME);
      return response;
    }

    const response = NextResponse.json({
      success: true,
      message: "Tokens rotated successfully",
    });

    // Set new access token cookie (7 days / session)
    response.cookies.set(AUTH_COOKIE_CONFIG.name, result.accessToken, AUTH_COOKIE_CONFIG.options);

    // Set new refresh token cookie (30 days, HttpOnly)
    response.cookies.set(REFRESH_COOKIE_NAME, result.newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    logger.error({ error }, "Error during refresh token rotation");
    const msg = error instanceof Error ? error.message : "Token refresh failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
