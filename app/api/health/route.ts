import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const isDeepCheck = url.searchParams.get("ready") === "1" || url.pathname.endsWith("/ready");

  const baseHealth = {
    status: "ok",
    version: "1.0.0",
    service: "rrce-erp",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
  };

  if (!isDeepCheck) {
    return NextResponse.json(baseHealth, {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  // Deep readiness probe checking database connectivity
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    return NextResponse.json(
      {
        ...baseHealth,
        status: "ready",
        database: {
          status: "connected",
          latencyMs,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Database connection failed";
    return NextResponse.json(
      {
        ...baseHealth,
        status: "degraded",
        database: {
          status: "disconnected",
          error: errorMsg,
        },
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }
}
