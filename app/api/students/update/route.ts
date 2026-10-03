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
    const {
      studentId,
      usn: inputUsn,
      newUsn,
      firstName,
      lastName,
      email,
      phone,
      dob,
      quota,
      semester,
      section,
      departmentId,
      isActive,
      photoUrl,
    } = body;

    // Strict institutional guardrail: Attendance and Marks can NEVER be modified through Admissions
    if (body.attendance !== undefined || body.marks !== undefined || body.cie !== undefined) {
      return NextResponse.json(
        { error: "Forbidden: Student attendance records and exam marks cannot be modified via Admissions." },
        { status: 403 }
      );
    }

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
          include: { user: true, department: true },
        });
      }
      if (!studentRecord && studentId) {
        studentRecord = await prisma.student.findUnique({
          where: { id: studentId },
          include: { user: true, department: true },
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
          if (email) userUpdateData.email = email;
          if (phone !== undefined) userUpdateData.phone = phone;
          if (photoUrl !== undefined) userUpdateData.photoUrl = photoUrl;
          if (isActive !== undefined) userUpdateData.isActive = Boolean(isActive);
          if (departmentId) userUpdateData.departmentId = departmentId;
          if (dob || firstName) userUpdateData.passwordHash = newPasswordHash;

          const effectiveNewUsn =
            newUsn && newUsn.trim().toUpperCase() !== studentRecord.usn
              ? newUsn.trim().toUpperCase()
              : null;

          if (effectiveNewUsn) {
            userUpdateData.username = effectiveNewUsn;
            if (!email && studentRecord.user.email.includes(studentRecord.usn.toLowerCase())) {
              userUpdateData.email = `${effectiveNewUsn.toLowerCase()}@student.rrce.org`;
            }
          }

          await tx.user.update({
            where: { id: studentRecord.userId },
            data: userUpdateData,
          });

          const studentUpdateData: any = {};
          if (effectiveNewUsn) {
            studentUpdateData.usn = effectiveNewUsn;
          }
          if (dob) studentUpdateData.dateOfBirth = new Date(dob);
          if (quota) studentUpdateData.quota = quota;
          if (semester !== undefined && !isNaN(Number(semester))) {
            studentUpdateData.currentSemester = Number(semester);
          }
          if (section !== undefined && section.trim()) {
            studentUpdateData.section = section.trim().toUpperCase();
          }
          if (departmentId) {
            studentUpdateData.departmentId = departmentId;
          }

          const st = await tx.student.update({
            where: { id: studentRecord.id },
            data: studentUpdateData,
            include: { user: true, department: true, invoices: true },
          });

          await tx.auditLog.create({
            data: {
              action: "STUDENT_MASTER_UPDATED",
              performedBy: session.username,
              details: JSON.stringify({
                originalUsn: studentRecord.usn,
                updatedUsn: effectiveNewUsn || studentRecord.usn,
                updatedName: `${firstName || studentRecord.user.firstName} ${
                  lastName !== undefined ? lastName : studentRecord.user.lastName
                }`,
                updatedEmail: email || studentRecord.user.email,
                updatedPhone: phone !== undefined ? phone : studentRecord.user.phone,
                updatedDob: dob || studentRecord.dateOfBirth,
                updatedSemester: semester ?? studentRecord.currentSemester,
                updatedSection: section ?? studentRecord.section,
                updatedQuota: quota || studentRecord.quota,
                updatedDepartmentId: departmentId || studentRecord.departmentId,
                updatedIsActive: isActive !== undefined ? isActive : studentRecord.user.isActive,
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
        if (firstName) seedMatch.firstName = firstName;
        if (lastName !== undefined) seedMatch.lastName = lastName;
        if (dob) seedMatch.dob = dob;
        if (phone !== undefined) seedMatch.phone = phone;
        if (quota) seedMatch.quota = quota as any;
      }
    }

    const displayName = firstName || updatedStudent?.user?.firstName || usn || "Student";
    const updateMsg = dob
      ? `Student ${displayName}'s master information updated successfully! Default password auto-recalculated to: ${newFormulaPassword}`
      : `Student ${displayName}'s master information updated successfully!`;

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
