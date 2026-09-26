import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { reallocateStudentBranch } from "@/lib/reallocation";

export async function POST(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser || !["ADMISSIONS", "PRINCIPAL"].includes(sessionUser.role)) {
    return NextResponse.json(
      { error: "Unauthorized: Only Admissions Officers and Principal can perform branch reallocation." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { studentId, targetDepartmentId, reason, feeAdjustmentAmount } = body;

    if (!studentId || !targetDepartmentId) {
      return NextResponse.json(
        { error: "studentId and targetDepartmentId are required." },
        { status: 400 }
      );
    }

    const result = await reallocateStudentBranch({
      studentId,
      targetDepartmentId,
      performedBy: sessionUser.username,
      reason,
      feeAdjustmentAmount: feeAdjustmentAmount ? Number(feeAdjustmentAmount) : 0,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Reallocation API error:", error);
    const message = error instanceof Error ? error.message : "Branch reallocation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
