import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || !["HOD", "PRINCIPAL"].includes(session.role)) {
    return NextResponse.json({ error: "HOD or Principal access is required." }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Attendance can be updated for any valid date up to today; no unlock is required." },
    { status: 410 }
  );
}
