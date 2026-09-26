import prisma from "./prisma";
import { generateUSN } from "./utils";

export interface ReallocationInput {
  studentId: string;
  targetDepartmentId: string;
  performedBy: string;
  reason?: string;
  feeAdjustmentAmount?: number;
}

export interface ReallocationResult {
  success: boolean;
  message: string;
  oldUsn: string;
  newUsn: string;
  oldDepartmentCode: string;
  newDepartmentCode: string;
  auditLogId: string;
}

/**
 * Atomic Branch Reallocation:
 * Re-allocates a student from one department to another.
 * Executed inside a Prisma $transaction to guarantee consistency:
 * 1. Finds target department and next available USN sequence.
 * 2. Generates new USN.
 * 3. Updates Student record with new department, usnBranch, usnSequence, and usn.
 * 4. Updates User department relation.
 * 5. Updates or adjusts Fee Invoices.
 * 6. Creates a permanent AuditLog record.
 */
export async function reallocateStudentBranch(
  input: ReallocationInput
): Promise<ReallocationResult> {
  const { studentId, targetDepartmentId, performedBy, reason, feeAdjustmentAmount } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current student and department
    const student = await tx.student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        user: true,
        invoices: true,
      },
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found.`);
    }

    if (student.departmentId === targetDepartmentId) {
      throw new Error("Student is already allocated to this target department.");
    }

    // 2. Fetch target department
    const targetDept = await tx.department.findUnique({
      where: { id: targetDepartmentId },
    });

    if (!targetDept) {
      throw new Error(`Target department not found.`);
    }

    const oldUsn = student.usn;
    const oldDeptCode = student.department?.code || "UNASSIGNED";

    // 3. Find next available sequence in target department
    const maxSeqResult = await tx.student.aggregate({
      where: {
        departmentId: targetDepartmentId,
        usnYear: student.usnYear,
      },
      _max: {
        usnSequence: true,
      },
    });

    const nextSequence = (maxSeqResult._max.usnSequence || 0) + 1;
    const newUsn = generateUSN(
      student.usnCollegeCode,
      student.usnYear,
      targetDept.usnCode,
      nextSequence
    );

    // 4. Update Student record
    await tx.student.update({
      where: { id: student.id },
      data: {
        departmentId: targetDept.id,
        usnBranch: targetDept.usnCode,
        usnSequence: nextSequence,
        usn: newUsn,
      },
    });

    // 5. Update User record
    await tx.user.update({
      where: { id: student.userId },
      data: {
        departmentId: targetDept.id,
      },
    });

    // 6. Adjust Fee Invoice if applicable
    if (student.invoices.length > 0) {
      const primaryInvoice = student.invoices[0];
      const additionalFee = Number(feeAdjustmentAmount || 0);
      const newTotal = primaryInvoice.totalAmount + additionalFee;

      await tx.invoice.update({
        where: { id: primaryInvoice.id },
        data: {
          totalAmount: newTotal,
          title: `Annual Tuition Fee 2025-26 (${targetDept.code} Reallocated)`,
        },
      });
    }

    // 7. Write to AuditLog
    const audit = await tx.auditLog.create({
      data: {
        action: "BRANCH_REALLOCATION",
        performedBy,
        details: JSON.stringify({
          studentId: student.id,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          oldUsn,
          newUsn,
          oldDepartment: oldDeptCode,
          newDepartment: targetDept.code,
          newSequence: nextSequence,
          feeAdjustment: feeAdjustmentAmount || 0,
          reason: reason || "Branch change request approved by Admissions",
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      message: `Successfully reallocated student to ${targetDept.code} with new USN ${newUsn}.`,
      oldUsn,
      newUsn,
      oldDepartmentCode: oldDeptCode,
      newDepartmentCode: targetDept.code,
      auditLogId: audit.id,
    };
  });
}
