import { NextRequest, NextResponse } from "next/server";
import { validateTimetableClash } from "@/lib/clash-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slotId,
      dayOfWeek,
      startTime,
      endTime,
      facultyId,
      roomNumber,
      departmentId,
      semester,
      section,
    } = body;

    if (!dayOfWeek || !startTime || !endTime || !facultyId || !roomNumber || !departmentId) {
      return NextResponse.json(
        { error: "Missing required parameters for clash detection." },
        { status: 400 }
      );
    }

    const result = await validateTimetableClash({
      slotId,
      dayOfWeek,
      startTime,
      endTime,
      facultyId,
      roomNumber,
      departmentId,
      semester: Number(semester) || 1,
      section: section || "A",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Clash validation error:", error);
    const message = error instanceof Error ? error.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
