import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser || !["PRINCIPAL", "ADMISSIONS", "HOD"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Unauthorized access to audit logs." }, { status: 403 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50");

    let logs: any[] = [];
    try {
      logs = await prisma.auditLog.findMany({
        where: action ? { action } : undefined,
        orderBy: { timestamp: "desc" },
        take: limit,
      });
    } catch (dbErr) {
      console.warn("DB audit log query failed, using empty list:", dbErr);
    }

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
