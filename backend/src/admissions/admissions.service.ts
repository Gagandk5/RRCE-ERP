import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role, InvoiceStatus } from '@prisma/client';

export interface EnrollStudentDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  quota: 'CET' | 'MANAGEMENT' | 'COMEDK' | 'MERIT';
  departmentId: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  joiningYear?: number; // e.g. 25
  feeAmount?: number;
}

export interface ReallocateBranchDto {
  studentId: string;
  newDepartmentId: string;
  reason?: string;
}

export function generateDefaultPassword(firstName: string, dobString: string): string {
  const dob = new Date(dobString);
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  let name3 = cleanFirst.slice(0, 3);
  if (name3.length < 3) {
    name3 = name3.padEnd(3, 'X');
  }
  const day = String(dob.getDate()).padStart(2, '0');
  const month = String(dob.getMonth() + 1).padStart(2, '0');
  const year = String(dob.getFullYear()).slice(-2);
  return `${name3}${day}${month}${year}`;
}

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  async getNextUsn(year: number, branchCode: string) {
    const latestStudent = await this.prisma.student.findFirst({
      where: {
        usnYear: year,
        usnBranch: branchCode.toUpperCase(),
      },
      orderBy: {
        usnSequence: 'desc',
      },
    });

    const nextSeq = latestStudent ? latestStudent.usnSequence + 1 : 1;
    const seqPadded = String(nextSeq).padStart(3, '0');
    const usn = `1RR${year}${branchCode.toUpperCase()}${seqPadded}`;
    return {
      usn,
      usnCollegeCode: '1RR',
      usnYear: year,
      usnBranch: branchCode.toUpperCase(),
      usnSequence: nextSeq,
    };
  }

  async enrollStudent(dto: EnrollStudentDto, admissionOfficerUserId?: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!department) {
      throw new NotFoundException(`Department ID ${dto.departmentId} not found`);
    }

    const joiningYear = dto.joiningYear || 25; // 2025/2026 joining cohort
    const branchCode = department.usnCode;
    const { usn, usnCollegeCode, usnYear, usnBranch, usnSequence } = await this.getNextUsn(joiningYear, branchCode);

    const defaultPassword = generateDefaultPassword(dto.firstName, dto.dateOfBirth);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const email = `${usn}@rrce.org`;

    // Active semester for department
    const activeSemester = await this.prisma.academicSemester.findFirst({
      where: {
        departmentId: department.id,
        semesterNumber: 1,
        isActive: true,
      },
    });

    // Execute student creation atomically
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username: usn,
          passwordHash,
          role: Role.STUDENT,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          departmentId: department.id,
          isPasswordResetRequired: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          usn,
          usnCollegeCode,
          usnYear,
          usnBranch,
          usnSequence,
          dateOfBirth: new Date(dto.dateOfBirth),
          currentSemester: 1,
          quota: dto.quota,
          guardianName: dto.guardianName,
          guardianPhone: dto.guardianPhone,
        },
      });

      let enrollment = null;
      if (activeSemester) {
        enrollment = await tx.semesterEnrollment.create({
          data: {
            studentId: student.id,
            academicSemesterId: activeSemester.id,
            section: 'A',
          },
        });

        // Create initial invoice
        const standardFee = dto.feeAmount || (dto.quota === 'MANAGEMENT' ? 125000 : 85000);
        await tx.invoice.create({
          data: {
            invoiceNumber: `INV-${usnYear}-${usnBranch}-${String(usnSequence).padStart(3, '0')}`,
            studentId: student.id,
            academicSemesterId: activeSemester.id,
            totalAmount: standardFee,
            paidAmount: 0.0,
            status: InvoiceStatus.PENDING,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: admissionOfficerUserId || user.id,
          action: 'STUDENT_ENROLLED',
          targetId: student.id,
          metaJson: {
            usn,
            department: department.code,
            quota: dto.quota,
            generatedPassword: defaultPassword,
          },
        },
      });

      return { user, student, enrollment, defaultPassword };
    });

    return {
      message: 'Student enrolled successfully',
      usn: result.student.usn,
      defaultPassword: result.defaultPassword,
      credentials: {
        username: result.user.username,
        email: result.user.email,
        temporaryPassword: result.defaultPassword,
      },
      student: result.student,
    };
  }

  async reallocateBranch(dto: ReallocateBranchDto, officerUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: {
        user: true,
        enrollments: {
          include: { academicSemester: true },
        },
        invoices: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const newDept = await this.prisma.department.findUnique({
      where: { id: dto.newDepartmentId },
    });
    if (!newDept) {
      throw new NotFoundException('Target department not found');
    }

    if (student.usnBranch === newDept.usnCode) {
      throw new BadRequestException('Student is already in this branch');
    }

    const oldUsn = student.usn;
    const oldBranch = student.usnBranch;
    const targetBranch = newDept.usnCode;
    const year = student.usnYear;

    // Generate new USN in the target department
    const { usn: newUsn, usnSequence: newSeq } = await this.getNextUsn(year, targetBranch);
    const newEmail = `${newUsn}@rrce.org`;

    // Find new department active semester matching current student semester
    const newSemester = await this.prisma.academicSemester.findFirst({
      where: {
        departmentId: newDept.id,
        semesterNumber: student.currentSemester,
        isActive: true,
      },
    });

    // Department standard fee difference
    // CSE/AIML = 95,000; BCA = 85,000; ECE/ME/ISE = 90,000
    const feeScale: Record<string, number> = {
      CS: 95000,
      AI: 95000,
      BC: 85000,
      EC: 90000,
      IS: 90000,
      ME: 80000,
    };

    const oldBaseFee = feeScale[oldBranch] || 85000;
    const newBaseFee = feeScale[targetBranch] || 90000;
    const feeAdjustment = newBaseFee - oldBaseFee;

    // Execute atomic reallocation
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Archive to AuditLog
      await tx.auditLog.create({
        data: {
          userId: officerUserId,
          action: 'BRANCH_REALLOCATION',
          targetId: student.id,
          metaJson: {
            oldUsn,
            newUsn,
            oldBranch,
            targetBranch,
            reason: dto.reason || 'Branch transfer approved by Admission Office',
            feeAdjustment,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // 2. Update User credentials
      await tx.user.update({
        where: { id: student.userId },
        data: {
          username: newUsn,
          email: newEmail,
          departmentId: newDept.id,
        },
      });

      // 3. Update Student profile
      const updatedStudent = await tx.student.update({
        where: { id: student.id },
        data: {
          usn: newUsn,
          usnBranch: targetBranch,
          usnSequence: newSeq,
        },
      });

      // 4. Sever previous semester enrollments
      await tx.semesterEnrollment.deleteMany({
        where: { studentId: student.id },
      });

      // 5. Re-bind to new department semester
      if (newSemester) {
        await tx.semesterEnrollment.create({
          data: {
            studentId: student.id,
            academicSemesterId: newSemester.id,
            section: 'A',
          },
        });

        // 6. Fee adjustment invoice if fee delta > 0
        if (feeAdjustment !== 0) {
          await tx.invoice.create({
            data: {
              invoiceNumber: `ADJ-${newUsn}-${Date.now().toString().slice(-4)}`,
              studentId: student.id,
              academicSemesterId: newSemester.id,
              totalAmount: Math.abs(feeAdjustment),
              paidAmount: 0.0,
              status: feeAdjustment > 0 ? InvoiceStatus.PENDING : InvoiceStatus.PAID,
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }

      return { updatedStudent, newUsn, feeAdjustment };
    });

    return {
      success: true,
      message: `Student successfully reallocated from ${oldBranch} to ${targetBranch}`,
      oldUsn,
      newUsn: updated.newUsn,
      previousBranch: oldBranch,
      newBranch: targetBranch,
      newDepartmentName: newDept.name,
      feeAdjustment: updated.feeAdjustment,
    };
  }

  async getAllStudents() {
    return this.prisma.student.findMany({
      where: { isActive: true },
      include: {
        user: true,
        enrollments: {
          include: {
            academicSemester: {
              include: { department: true },
            },
          },
        },
        invoices: true,
      },
      orderBy: {
        usnSequence: 'asc',
      },
    });
  }

  async getDepartments() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

