import prisma from "./prisma";
import { hashPassword } from "./auth";
import { generateDefaultPassword, generateUSN } from "./utils";
import { DEPARTMENTS, STAFF_ACCOUNTS, BCA_2025_STUDENTS, getSeedPassword } from "../prisma/seed-data";

const SUBJECT_CATALOG = [
  { code: "B25BCA301", name: "Digital Principles & Computer Organization", semester: 3, section: "A" },
  { code: "B25BCA302", name: "OOP in C++ & Lab", semester: 3, section: "A" },
  { code: "B25BCA303", name: "Operating System Concepts", semester: 3, section: "A" },
  { code: "B25BCA304", name: "RDBMS & Lab", semester: 3, section: "A" },
  { code: "B25BCA305", name: "Software Engineering", semester: 3, section: "A" },
  { code: "B25BCA306", name: "Reasoning & Aptitude", semester: 3, section: "A" },
  { code: "B25BCAL307", name: "OOP C++ Lab", semester: 3, section: "A" },
];

const FACULTY_COURSE_MAPPINGS = [
  { email: "jaishankar.m@rrce.org", code: "B25BCA301" },
  { email: "shreya.s@rrce.org", code: "B25BCA302" },
  { email: "thilagavallii.s@rrce.org", code: "B25BCA303" },
  { email: "pushpalatha.g@rrce.org", code: "B25BCA304" },
  { email: "deeraj.c@rrce.org", code: "B25BCA305" },
  { email: "darshan.p@rrce.org", code: "B25BCA306" },
  { email: "muruganandham.sk@rrce.org", code: "B25BCAL307" },
];

export async function runDatabaseSeed() {
  console.log("Starting RRCE ERP database seed with real course assignments...");

  await prisma.attendanceAuditLog.deleteMany({});
  await prisma.sessionAttendanceRecord.deleteMany({});
  await prisma.attendanceSession.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.facultyCourseAssignment.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      OR: [{ role: "STUDENT" }, { role: "FACULTY" }, { role: "HOD" }, { role: "PRINCIPAL" }, { role: "ADMISSIONS" }],
    },
  });
  await prisma.subject.deleteMany({});
  await prisma.department.deleteMany({});

  const deptMap = new Map<string, string>();
  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.create({
      data: { code: dept.code, name: dept.name, usnCode: dept.usnCode },
    });
    deptMap.set(dept.code, record.id);
  }

  const staffMap = new Map<string, string>();
  for (const staff of STAFF_ACCOUNTS) {
    const passwordHash = await hashPassword(staff.defaultPassword || getSeedPassword());
    const user = await prisma.user.create({
      data: {
        username: staff.username,
        email: staff.email,
        passwordHash,
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        role: staff.role,
        departmentId: staff.deptCode ? deptMap.get(staff.deptCode) : null,
        isActive: true,
        isPasswordResetRequired: false,
      },
    });
    staffMap.set(staff.email, user.id);
  }

  const bcaDeptId = deptMap.get("BCA")!;
  for (const subject of SUBJECT_CATALOG) {
    await prisma.subject.upsert({
      where: {
        code_departmentId_semester_section: {
          code: subject.code,
          departmentId: bcaDeptId,
          semester: subject.semester,
          section: subject.section,
        },
      },
      update: { name: subject.name, isActive: true },
      create: {
        code: subject.code,
        name: subject.name,
        departmentId: bcaDeptId,
        semester: subject.semester,
        section: subject.section,
        isActive: true,
      },
    });
  }

  for (const mapping of FACULTY_COURSE_MAPPINGS) {
    const facultyId = staffMap.get(mapping.email);
    if (!facultyId) continue;
    const subjectRecord = await prisma.subject.findFirst({
      where: {
        code: mapping.code,
        departmentId: bcaDeptId,
      },
    });
    if (!subjectRecord) continue;

    await prisma.facultyCourseAssignment.upsert({
      where: { facultyId_subjectId: { facultyId, subjectId: subjectRecord.id } },
      update: { isActive: true, departmentId: bcaDeptId, semester: subjectRecord.semester, section: subjectRecord.section },
      create: {
        facultyId,
        subjectId: subjectRecord.id,
        departmentId: bcaDeptId,
        semester: subjectRecord.semester,
        section: subjectRecord.section,
        isActive: true,
      },
    });
  }

  const studentIds: string[] = [];
  for (const student of BCA_2025_STUDENTS) {
    const usn = generateUSN("1RR", "25", "BC", student.sequence);
    const username = usn.toLowerCase();
    const email = `${username}@student.rrce.org`;
    const passwordHash = await hashPassword(generateDefaultPassword(student.firstName, student.dob));

    const userRecord = await prisma.user.upsert({
      where: { email },
      update: {
        username,
        passwordHash,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        departmentId: bcaDeptId,
        isActive: true,
      },
      create: {
        username,
        email,
        passwordHash,
        role: "STUDENT",
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        departmentId: bcaDeptId,
        isActive: true,
      },
    });

    const studentRecord = await prisma.student.upsert({
      where: { userId: userRecord.id },
      update: {
        usn,
        usnCollegeCode: "1RR",
        usnYear: "25",
        usnBranch: "BC",
        usnSequence: student.sequence,
        dateOfBirth: new Date(student.dob),
        currentSemester: 3,
        section: "A",
        quota: student.quota,
        departmentId: bcaDeptId,
      },
      create: {
        userId: userRecord.id,
        usn,
        usnCollegeCode: "1RR",
        usnYear: "25",
        usnBranch: "BC",
        usnSequence: student.sequence,
        dateOfBirth: new Date(student.dob),
        currentSemester: 3,
        section: "A",
        quota: student.quota,
        departmentId: bcaDeptId,
      },
    });

    studentIds.push(studentRecord.id);

    const invoiceNumber = `INV-2025-BC${String(student.sequence).padStart(3, "0")}`;
    const isPartiallyPaid = student.sequence % 3 === 1;
    const isPaidInFull = student.sequence % 3 === 0;
    await prisma.invoice.upsert({
      where: { invoiceNumber },
      update: {
        studentId: studentRecord.id,
        totalAmount: 85000,
        paidAmount: isPaidInFull ? 85000 : isPartiallyPaid ? 50000 : 0,
        status: isPaidInFull ? "PAID" : isPartiallyPaid ? "PENDING" : "OVERDUE",
        dueDate: new Date("2025-10-31"),
      },
      create: {
        invoiceNumber,
        studentId: studentRecord.id,
        totalAmount: 85000,
        paidAmount: isPaidInFull ? 85000 : isPartiallyPaid ? 50000 : 0,
        status: isPaidInFull ? "PAID" : isPartiallyPaid ? "PENDING" : "OVERDUE",
        dueDate: new Date("2025-10-31"),
        title: "Annual Tuition Fee 2025-26 (BCA 3rd Sem)",
      },
    });
  }

  const today = new Date();
  const recentPast = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  const courseSeed = await prisma.subject.findFirst({ where: { code: "B25BCA301", departmentId: bcaDeptId } });
  if (courseSeed) {
    const session = await prisma.attendanceSession.upsert({
      where: {
        facultyId_subjectId_semester_section_date: {
          facultyId: staffMap.get("jaishankar.m@rrce.org")!,
          subjectId: courseSeed.id,
          semester: 3,
          section: "A",
          date: recentPast,
        },
      },
      update: {},
      create: {
        subjectId: courseSeed.id,
        subject: `${courseSeed.name} (${courseSeed.code})`,
        facultyId: staffMap.get("jaishankar.m@rrce.org")!,
        departmentId: bcaDeptId,
        semester: 3,
        section: "A",
        date: recentPast,
        createdAt: recentPast,
        lockedAt: new Date(recentPast.getTime() + 24 * 60 * 60 * 1000),
        isLockedOverride: false,
      },
    });

    for (const studentId of studentIds.slice(0, 8)) {
      await prisma.sessionAttendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId: session.id, studentId } },
        update: { status: "PRESENT" },
        create: { sessionId: session.id, studentId, status: "PRESENT" },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "SEED_INITIAL_DATA",
      performedBy: "SYSTEM",
      details: JSON.stringify({
        departmentsSeeded: DEPARTMENTS.length,
        staffSeeded: STAFF_ACCOUNTS.length,
        studentSeeded: BCA_2025_STUDENTS.length,
        courseAssignments: FACULTY_COURSE_MAPPINGS.length,
      }),
    },
  });

  return {
    success: true,
    departmentsCount: DEPARTMENTS.length,
    staffCount: STAFF_ACCOUNTS.length,
    studentsCount: BCA_2025_STUDENTS.length,
    courseAssignmentsCount: FACULTY_COURSE_MAPPINGS.length,
  };
}
