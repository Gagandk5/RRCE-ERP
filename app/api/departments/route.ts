import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DEPARTMENTS } from "@/prisma/seed-data";

export async function GET() {
  try {
    let departments: any[] = [];
    try {
      departments = await prisma.department.findMany({
        include: {
          _count: {
            select: {
              students: true,
              users: true,
              attendanceSessions: true,
            },
          },
        },
        orderBy: { code: "asc" },
      });
    } catch (dbErr) {
      console.warn("DB departments fetch failed, using seed data:", dbErr);
    }

    if (departments.length === 0) {
      const mapped = DEPARTMENTS.map((d, idx) => ({
        id: `mock-dept-${d.code.toLowerCase()}`,
        code: d.code,
        name: d.name,
        usnCode: d.usnCode,
        _count: {
          students: d.code === "BCA" ? 54 : 0,
          users: d.code === "BCA" ? 55 : 1,
          attendanceSessions: d.code === "BCA" ? 2 : 0,
        },
      }));
      return NextResponse.json({ departments: mapped, isMock: true });
    }

    return NextResponse.json({ departments, isMock: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load departments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
