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
    const { studentId, usn: inputUsn, firstName, lastName, phone, dob, quota, photoUrl } = body;

    if (!inputUsn && !studentId) {
      return NextResponse.json(
        { error: "USN or Student ID is required." },
        { status: 400 }
      );
    }

    let usn = inputUsn;
    let newFormulaPassword = "";
    if (firstName && dob) {
      newFormulaPassword = generateDefaultPassword(firstName, dob);
    }

    let updatedStudent = null;
    let dbConnected = true;

    try {
      let studentRecord = null;
      if (usn) {
        studentRecord = await prisma.student.findUnique({
          where: { usn },
          include: { user: true },
        });
      } else if (studentId) {
        studentRecord = await prisma.student.findUnique({
          where: { id: studentId },
          include: { user: true },
        });
      }

      if (studentRecord) {
        usn = studentRecord.usn;
        const targetFirstName = firstName || studentRecord.user.firstName;
        const targetDob = dob ? new Date(dob) : studentRecord.dateOfBirth;
        newFormulaPassword = generateDefaultPassword(targetFirstName, targetDob);
        const newPasswordHash = await hashPassword(newFormulaPassword);

        updatedStudent = await prisma.$transaction(async (tx) => {
          const userUpdateData: any = {};
          if (firstName) userUpdateData.firstName = firstName;
          if (lastName !== undefined) userUpdateData.lastName = lastName;
          if (phone !== undefined) userUpdateData.phone = phone;
          if (photoUrl !== undefined) userUpdateData.photoUrl = photoUrl;
          if (dob) userUpdateData.passwordHash = newPasswordHash;

          await tx.user.update({
            where: { id: studentRecord.userId },
            data: userUpdateData,
          });

          const studentUpdateData: any = {};
          if (dob) studentUpdateData.dateOfBirth = new Date(dob);
          if (quota) studentUpdateData.quota = quota;

          const st = await tx.student.update({
            where: { id: studentRecord.id },
            data: studentUpdateData,
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
    if (usn) {
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
    }

    const displayName = firstName || updatedStudent?.user?.firstName || usn || "Student";
    const updateMsg = dob
      ? `Student ${displayName}'s details updated successfully! Date of Birth set to ${dob}. Formula password automatically recalculated to: ${newFormulaPassword}`
      : `Student ${displayName}'s profile updated successfully!`;

    return NextResponse.json({
      success: true,
      newFormulaPassword,
      message: updateMsg,
      student: updatedStudent,
      dbConnected,
    });
  } catch (error: unknown) {
    console.error("Student update API error:", error);
    const message = error instanceof Error ? error.message : "Failed to update student details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
