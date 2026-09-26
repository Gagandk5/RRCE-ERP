import { NextRequest, NextResponse } from "next/server";
import { runDatabaseSeed } from "@/lib/seed-service";

export async function GET(req: NextRequest) {
  return handleSeed(req);
}

export async function POST(req: NextRequest) {
  return handleSeed(req);
}

async function handleSeed(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const providedSecret = searchParams.get("secret") || req.headers.get("x-seed-secret");
    const configuredSecret = process.env.SEED_SECRET;

    // If SEED_SECRET is set in environment, verify it unless in development
    if (configuredSecret && process.env.NODE_ENV === "production") {
      if (providedSecret !== configuredSecret) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or missing seed secret." },
          { status: 401 }
        );
      }
    }

    const result = await runDatabaseSeed();

    return NextResponse.json({
      success: true,
      message: "Rajarajeswari College of Engineering (RRCE) ERP Database seeded successfully!",
      summary: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Seed API error:", error);
    const message = error instanceof Error ? error.message : "Failed to seed database";
    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: "Ensure DATABASE_URL is properly configured and PostgreSQL is reachable.",
      },
      { status: 500 }
    );
  }
}
