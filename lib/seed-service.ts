import prisma from "./prisma";
import { hashPassword } from "./auth";
import { generateDefaultPassword, generateUSN } from "./utils";
import { DEPARTMENTS, STAFF_ACCOUNTS, BCA_2025_STUDENTS } from "../prisma/seed-data";

export async function runDatabaseSeed() {
  console.log("Starting RRCE ERP Database Seed...");

  const deptMap = new Map<string, string>();

  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, usnCode: dept.usnCode },
      create: {
        code: dept.code,
        name: dept.name,
        usnCode: dept.usnCode,
      },
    });
    deptMap.set(dept.code, record.id);
  }

  const staffMap = new Map<string, string>();

  for (const staff of STAFF_ACCOUNTS) {
    const passwordHash = await hashPassword(staff.defaultPassword);
    const deptId = staff.deptCode ? deptMap.get(staff.deptCode) : undefined;

    const user = await prisma.user.upsert({
      where: { username: staff.username },
      update: {
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        role: staff.role,
        departmentId: deptId,
      },
      create: {
        username: staff.username,
        email: staff.email,
        passwordHash,
        role: staff.role,
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        departmentId: deptId,
        isActive: true,
        isPasswordResetRequired: false,
      },
    });
    staffMap.set(staff.username, user.id);
  }

  const bcaDeptId = deptMap.get("BCA")!;
  const seededStudentIds: string[] = [];

  for (const s of BCA_2025_STUDENTS) {
    const seqStr = String(s.sequence).padStart(3, "0");
    const usn = generateUSN("1RR", "25", "BC", s.sequence);
    const username = usn.toLowerCase();
    const email = `${username}@student.rrce.org`;
    const defaultPassword = generateDefaultPassword(s.firstName, s.dob);
    const passwordHash = await hashPassword(defaultPassword);

    const studentUser = await prisma.user.upsert({
      where: { username },
      update: {
        email,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        role: "STUDENT",
        departmentId: bcaDeptId,
      },
      create: {
        username,
        email,
        passwordHash,
        role: "STUDENT",
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        departmentId: bcaDeptId,
        isActive: true,
        isPasswordResetRequired: true,
      },
    });

    const studentProfile = await prisma.student.upsert({
      where: { usn },
      update: {
        currentSemester: 1,
        quota: s.quota,
        departmentId: bcaDeptId,
      },
      create: {
        userId: studentUser.id,
        usn,
        usnCollegeCode: "1RR",
        usnYear: "25",
        usnBranch: "BC",
        usnSequence: s.sequence,
        dateOfBirth: new Date(s.dob),
        currentSemester: 1,
        quota: s.quota,
        departmentId: bcaDeptId,
      },
    });

    seededStudentIds.push(studentProfile.id);

    const invoiceNumber = `INV-2025-BC${seqStr}`;
    const isPaidInFull = s.sequence % 3 === 0;
    const isPartiallyPaid = s.sequence % 3 === 1;
    const paidAmount = isPaidInFull ? 85000 : isPartiallyPaid ? 50000 : 0;
    const status = isPaidInFull ? "PAID" : isPartiallyPaid ? "PENDING" : "OVERDUE";

    await prisma.invoice.upsert({
      where: { invoiceNumber },
      update: {
        totalAmount: 85000,
        paidAmount,
        status,
      },
      create: {
        invoiceNumber,
        studentId: studentProfile.id,
        totalAmount: 85000,
        paidAmount,
        status,
        title: "Annual Tuition Fee 2025-26",
        dueDate: new Date("2025-10-31"),
      },
    });
  }

  const facultyMathId = staffMap.get("faculty_math")!;
  const hodBcaId = staffMap.get("hod_bca")!;

  const timetableData = [
    {
      dayOfWeek: "MON",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Discrete Mathematics (25BC101)",
      departmentId: bcaDeptId,
      semester: 1,
      section: "A",
      facultyId: facultyMathId,
      roomNumber: "LH-201",
    },
    {
      dayOfWeek: "MON",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Problem Solving with C (25BC102)",
      departmentId: bcaDeptId,
      semester: 1,
      section: "A",
      facultyId: hodBcaId,
      roomNumber: "LH-201",
    },
  ];

  for (const slot of timetableData) {
    const existing = await prisma.timetableSlot.findFirst({
      where: {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        departmentId: slot.departmentId,
        semester: slot.semester,
        section: slot.section,
      },
    });

    if (!existing) {
      await prisma.timetableSlot.create({
        data: slot,
      });
    }
  }

  const lockedDate = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const activeDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const lockedSession = await prisma.attendanceSession.create({
    data: {
      subject: "Discrete Mathematics (25BC101)",
      facultyId: facultyMathId,
      departmentId: bcaDeptId,
      semester: 1,
      section: "A",
      date: lockedDate,
      createdAt: lockedDate,
      lockedAt: new Date(lockedDate.getTime() + 24 * 60 * 60 * 1000),
      isLockedOverride: false,
    },
  });

  for (let i = 0; i < Math.min(15, seededStudentIds.length); i++) {
    const studentId = seededStudentIds[i];
    const isAbsent = i === 4 || i === 9;
    const isLate = i === 12;
    await prisma.attendanceRecord.create({
      data: {
        sessionId: lockedSession.id,
        studentId,
        status: isAbsent ? "ABSENT" : isLate ? "LATE" : "PRESENT",
      },
    });
  }

  const activeSession = await prisma.attendanceSession.create({
    data: {
      subject: "Problem Solving with C (25BC102)",
      facultyId: hodBcaId,
      departmentId: bcaDeptId,
      semester: 1,
      section: "A",
      date: activeDate,
      createdAt: activeDate,
      lockedAt: new Date(activeDate.getTime() + 24 * 60 * 60 * 1000),
      isLockedOverride: false,
    },
  });

  for (let i = 0; i < Math.min(20, seededStudentIds.length); i++) {
    const studentId = seededStudentIds[i];
    const isAbsent = i === 7;
    await prisma.attendanceRecord.create({
      data: {
        sessionId: activeSession.id,
        studentId,
        status: isAbsent ? "ABSENT" : "PRESENT",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "SYSTEM_INITIALIZATION",
      performedBy: "SYSTEM_SEED",
      details: JSON.stringify({
        departmentsSeeded: DEPARTMENTS.length,
        staffSeeded: STAFF_ACCOUNTS.length,
        studentsSeeded: BCA_2025_STUDENTS.length,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log("RRCE ERP Seeding completed successfully!");
  return {
    success: true,
    departmentsCount: DEPARTMENTS.length,
    staffCount: STAFF_ACCOUNTS.length,
    studentsCount: BCA_2025_STUDENTS.length,
  };
}
