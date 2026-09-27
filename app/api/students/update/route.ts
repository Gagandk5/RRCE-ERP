import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { generateDefaultPassword } from "@/lib/utils";
import { BCA_2025_STUDENTS } from "@/prisma/seed-data";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || !["ADMISSIONS", "PRINCIPAL"].includes(session.role)) {
    return NextResponse.json(
      { error: "Unauthorized: Only Admissions or Principal can edit student details." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { studentId, usn, firstName, lastName, phone, dob, quota } = body;

    if (!usn || !firstName || !dob) {
      return NextResponse.json(
        { error: "usn, firstName, and dob (Date of Birth) are required." },
        { status: 400 }
      );
    }

    // 1. Calculate new formula password automatically based on updated DOB and First Name
    const newFormulaPassword = generateDefaultPassword(firstName, dob);
    const newPasswordHash = await hashPassword(newFormulaPassword);

    let updatedStudent = null;
    let dbConnected = true;

    try {
      const studentRecord = await prisma.student.findUnique({
        where: { usn },
        include: { user: true },
      });

      if (studentRecord) {
        updatedStudent = await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: studentRecord.userId },
            data: {
              firstName,
              lastName: lastName || "",
              phone,
              passwordHash: newPasswordHash,
            },
          });

          const st = await tx.student.update({
            where: { id: studentRecord.id },
            data: {
              dateOfBirth: new Date(dob),
              quota: quota || studentRecord.quota,
            },
            include: { user: true, department: true, invoices: true },
          });

          await tx.auditLog.create({
            data: {
              action: "STUDENT_PROFILE_UPDATED",
              performedBy: session.username,
              details: JSON.stringify({
                usn,
                updatedName: `${firstName} ${lastName}`,
                updatedDob: dob,
                newFormulaPassword,
              }),
            },
          });

          return st;
        });
      }
    } catch (dbErr) {
      console.warn("DB update failed, updating in-memory seed data fallback:", dbErr);
      dbConnected = false;
    }

    // Update in-memory seed list fallback as well
    const seedMatch = BCA_2025_STUDENTS.find((s) => {
      const seqStr = String(s.sequence).padStart(3, "0");
      return `1RR25BC${seqStr}`.toLowerCase() === usn.toLowerCase();
    });

    if (seedMatch) {
      seedMatch.firstName = firstName;
      seedMatch.lastName = lastName || "";
      seedMatch.dob = dob;
      if (phone) seedMatch.phone = phone;
      if (quota) seedMatch.quota = quota as any;
    }

    return NextResponse.json({
      success: true,
      newFormulaPassword,
      message: `Student ${firstName}'s details updated successfully! Date of Birth set to ${dob}. Formula password automatically updated to: ${newFormulaPassword}`,
      student: updatedStudent,
      dbConnected,
    });
  } catch (error: unknown) {
    console.error("Student update API error:", error);
    const message = error instanceof Error ? error.message : "Failed to update student details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
