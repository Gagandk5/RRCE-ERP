import prisma from "./prisma";
import { hashPassword } from "./auth";
import { generateDefaultPassword, generateUSN } from "./utils";
import { DEPARTMENTS, STAFF_ACCOUNTS, BCA_2025_STUDENTS } from "../prisma/seed-data";

export async function runDatabaseSeed() {
  console.log("Starting RRCE ERP Database Seed with Real BCA 3rd Sem Class Roster...");

  // 1. Wipe old attendance, invoices, and student profiles to ensure clean real roster insertion
  try {
    await prisma.sessionAttendanceRecord.deleteMany({});
    await prisma.attendanceSession.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.user.deleteMany({
      where: { role: "STUDENT" },
    });
  } catch (cleanErr) {
    console.warn("Pre-seed cleanup warning:", cleanErr);
  }

  // 2. Department setup
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

  // 3. Staff Accounts setup
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

  // 4. Ingest 54 Real BCA 3rd Sem 2nd Year Students
  const bcaDeptId = deptMap.get("BCA")!;
  const seededStudentIds: string[] = [];

  for (const s of BCA_2025_STUDENTS) {
    const seqStr = String(s.sequence).padStart(3, "0");
    const usn = generateUSN("1RR", "25", "BC", s.sequence);
    const username = usn.toLowerCase();
    const email = `${username}@student.rrce.org`;
    const defaultPassword = generateDefaultPassword(s.firstName, s.dob);
    const passwordHash = await hashPassword(defaultPassword);

    const studentUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: "STUDENT",
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        departmentId: bcaDeptId,
        isActive: true,
        isPasswordResetRequired: false,
      },
    });

    const studentProfile = await prisma.student.create({
      data: {
        userId: studentUser.id,
        usn,
        usnCollegeCode: "1RR",
        usnYear: "25",
        usnBranch: "BC",
        usnSequence: s.sequence,
        dateOfBirth: new Date(s.dob),
        currentSemester: 3, // Real BCA 3rd Sem 2nd Year
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

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: studentProfile.id,
        totalAmount: 85000,
        paidAmount,
        status,
        title: "Annual Tuition Fee 2025-26 (BCA 3rd Sem)",
        dueDate: new Date("2025-10-31"),
      },
    });
  }

  const jaishankarId = staffMap.get("jaishankar_m")!;
  const shreyaId = staffMap.get("shreya_s")!;
  const thilagavalliiId = staffMap.get("thilagavallii_s")!;
  const pushpalathaId = staffMap.get("pushpalatha_g")!;

  const timetableData = [
    {
      dayOfWeek: "MON",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Digital Principles and Computer Organization (B25BCA301)",
      departmentId: bcaDeptId,
      semester: 3,
      section: "A",
      facultyId: jaishankarId,
      roomNumber: "LH-201",
    },
    {
      dayOfWeek: "MON",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Object Oriented Programming in C++ (B25BCA302)",
      departmentId: bcaDeptId,
      semester: 3,
      section: "A",
      facultyId: shreyaId,
      roomNumber: "LH-201",
    },
    {
      dayOfWeek: "MON",
      startTime: "11:15",
      endTime: "12:15",
      subject: "Operating System Concepts (B25BCA303)",
      departmentId: bcaDeptId,
      semester: 3,
      section: "A",
      facultyId: thilagavalliiId,
      roomNumber: "LH-201",
    },
    {
      dayOfWeek: "MON",
      startTime: "14:00",
      endTime: "15:00",
      subject: "Relational Data Base Management System (B25BCA304)",
      departmentId: bcaDeptId,
      semester: 3,
      section: "A",
      facultyId: pushpalathaId,
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

  // Attendance sessions setup for real roster
  const lockedDate = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const activeDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const lockedSession = await prisma.attendanceSession.create({
    data: {
      subject: "Digital Principles and Computer Organization (B25BCA301)",
      facultyId: jaishankarId,
      departmentId: bcaDeptId,
      semester: 3,
      section: "A",
      date: lockedDate,
      createdAt: lockedDate,
      lockedAt: new Date(lockedDate.getTime() + 24 * 60 * 60 * 1000),
      isLockedOverride: false,
    },
  });

  for (let i = 0; i < Math.min(20, seededStudentIds.length); i++) {
    const studentId = seededStudentIds[i];
    const isAbsent = i === 4 || i === 9;
    const isLate = i === 12;
    await prisma.sessionAttendanceRecord.create({
      data: {
        sessionId: lockedSession.id,
        studentId,
        status: isAbsent ? "ABSENT" : isLate ? "LATE" : "PRESENT",
      },
    });
  }

  const activeSession = await prisma.attendanceSession.create({
    data: {
      subject: "Object Oriented Programming in C++ (B25BCA302)",
      facultyId: shreyaId,
      departmentId: bcaDeptId,
      semester: 3,
      section: "A",
      date: activeDate,
      createdAt: activeDate,
      lockedAt: new Date(activeDate.getTime() + 24 * 60 * 60 * 1000),
      isLockedOverride: false,
    },
  });

  for (let i = 0; i < Math.min(25, seededStudentIds.length); i++) {
    const studentId = seededStudentIds[i];
    const isAbsent = i === 7;
    await prisma.sessionAttendanceRecord.create({
      data: {
        sessionId: activeSession.id,
        studentId,
        status: isAbsent ? "ABSENT" : "PRESENT",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "REAL_CLASS_ROSTER_INGESTION",
      performedBy: "SYSTEM_SEED",
      details: JSON.stringify({
        departmentsSeeded: DEPARTMENTS.length,
        staffSeeded: STAFF_ACCOUNTS.length,
        realBca3rdSemStudentsSeeded: BCA_2025_STUDENTS.length,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log("RRCE ERP Real BCA 3rd Sem Seeding completed successfully!");
  return {
    success: true,
    departmentsCount: DEPARTMENTS.length,
    staffCount: STAFF_ACCOUNTS.length,
    studentsCount: BCA_2025_STUDENTS.length,
  };
}
