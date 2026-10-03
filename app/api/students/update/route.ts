import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { generateDefaultPassword, generateUSN } from "@/lib/utils";
import { BCA_2025_STUDENTS } from "@/prisma/seed-data";

import { studentUpdateSchema } from "@/lib/validations";

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
    const parseResult = studentUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid student data." },
        { status: 400 }
      );
    }
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
      reallocReason,
      feeAdjustment,
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
    let wasReallocated = false;
    let finalAssignedUsn = inputUsn;
    let targetDeptCode = "";

    try {
      let studentRecord = null;
      if (usn) {
        studentRecord = await prisma.student.findUnique({
          where: { usn },
          include: { user: true, department: true, invoices: true },
        });
      }
      if (!studentRecord && studentId) {
        studentRecord = await prisma.student.findUnique({
          where: { id: studentId },
          include: { user: true, department: true, invoices: true },
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
          if (dob || firstName) userUpdateData.passwordHash = newPasswordHash;

          const studentUpdateData: any = {};
          if (dob) studentUpdateData.dateOfBirth = new Date(dob);
          if (quota) studentUpdateData.quota = quota;
          if (semester !== undefined && !isNaN(Number(semester))) {
            studentUpdateData.currentSemester = Number(semester);
          }
          if (section !== undefined && section.trim()) {
            studentUpdateData.section = section.trim().toUpperCase();
          }

          let effectiveUsn =
            newUsn && newUsn.trim().toUpperCase() !== studentRecord.usn
              ? newUsn.trim().toUpperCase()
              : studentRecord.usn;

          // Check if Branch Reallocation is requested (departmentId differs from existing)
          if (departmentId && departmentId !== studentRecord.departmentId) {
            const targetDept = await tx.department.findUnique({
              where: { id: departmentId },
            });

            if (targetDept) {
              wasReallocated = true;
              targetDeptCode = targetDept.code;

              let nextSequence = studentRecord.usnSequence;
              // If user did not manually override USN, auto-generate sequential USN in target branch
              if (!newUsn || newUsn.trim().toUpperCase() === studentRecord.usn) {
                const maxSeqResult = await tx.student.aggregate({
                  where: {
                    departmentId: targetDept.id,
                    usnYear: studentRecord.usnYear,
                  },
                  _max: {
                    usnSequence: true,
                  },
                });
                nextSequence = (maxSeqResult._max.usnSequence || 0) + 1;
                effectiveUsn = generateUSN(
                  studentRecord.usnCollegeCode,
                  studentRecord.usnYear,
                  targetDept.usnCode,
                  nextSequence
                );
              }

              studentUpdateData.departmentId = targetDept.id;
              studentUpdateData.usnBranch = targetDept.usnCode;
              studentUpdateData.usnSequence = nextSequence;
              studentUpdateData.usn = effectiveUsn;

              userUpdateData.departmentId = targetDept.id;
              userUpdateData.username = effectiveUsn;
              if (!email || email.includes(studentRecord.usn.toLowerCase())) {
                userUpdateData.email = `${effectiveUsn.toLowerCase()}@student.rrce.org`;
              }

              // Adjust invoice if differential fee is provided
              const feeAdj = Number(feeAdjustment || 0);
              if (studentRecord.invoices && studentRecord.invoices.length > 0 && feeAdj !== 0) {
                const primaryInvoice = studentRecord.invoices[0];
                await tx.invoice.update({
                  where: { id: primaryInvoice.id },
                  data: {
                    totalAmount: primaryInvoice.totalAmount + feeAdj,
                    title: `Annual Tuition Fee 2025-26 (${targetDept.code} Reallocated)`,
                  },
                });
              }

              // Log branch reallocation in audit log
              await tx.auditLog.create({
                data: {
                  action: "BRANCH_REALLOCATION",
                  performedBy: session.username,
                  details: JSON.stringify({
                    studentId: studentRecord.id,
                    studentName: `${firstName || studentRecord.user.firstName} ${
                      lastName !== undefined ? lastName : studentRecord.user.lastName
                    }`,
                    oldUsn: studentRecord.usn,
                    newUsn: effectiveUsn,
                    oldDepartment: studentRecord.department?.code || "ORIGINAL",
                    newDepartment: targetDept.code,
                    newSequence: nextSequence,
                    feeAdjustment: feeAdj,
                    reason: reallocReason || "Branch reallocation executed via Edit Student Master Desk",
                    timestamp: new Date().toISOString(),
                  }),
                },
              });
            }
          } else {
            // Standard update without branch change
            if (effectiveUsn !== studentRecord.usn) {
              studentUpdateData.usn = effectiveUsn;
              userUpdateData.username = effectiveUsn;
              if (!email && studentRecord.user.email.includes(studentRecord.usn.toLowerCase())) {
                userUpdateData.email = `${effectiveUsn.toLowerCase()}@student.rrce.org`;
              }
            }
          }

          finalAssignedUsn = effectiveUsn;

          await tx.user.update({
            where: { id: studentRecord.userId },
            data: userUpdateData,
          });

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
                updatedUsn: effectiveUsn,
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
                wasReallocated,
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
    const updateMsg = wasReallocated
      ? `Student ${displayName} reallocated to ${targetDeptCode}! New USN: ${finalAssignedUsn}. Default password: ${newFormulaPassword}`
      : dob
      ? `Student ${displayName}'s master information updated successfully! Default password auto-recalculated to: ${newFormulaPassword}`
      : `Student ${displayName}'s master information updated successfully!`;

    return NextResponse.json({
      success: true,
      wasReallocated,
      targetDeptCode,
      newUsn: finalAssignedUsn,
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
