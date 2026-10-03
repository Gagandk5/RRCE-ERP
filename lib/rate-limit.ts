import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale keys periodically
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function purgeExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  memoryStore.forEach((record, key) => {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  });
}

export interface RateLimitOptions {
  limit?: number; // max requests per window
  windowMs?: number; // window size in milliseconds
  keyPrefix?: string;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
} {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60 * 1000;
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;

  purgeExpired(windowMs);

  const now = Date.now();
  const record = memoryStore.get(key) ?? { timestamps: [] };

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  memoryStore.set(key, record);

  const resetMs = windowMs;
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetMs,
  };
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export function rateLimitResponse(limit: number, resetMs: number): NextResponse {
  const retryAfterSeconds = Math.ceil(resetMs / 1000);
  return NextResponse.json(
    {
      error: "Too many requests. Please wait a moment before trying again.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
