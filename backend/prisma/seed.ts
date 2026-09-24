import { PrismaClient, Role, AttendanceStatus, LeaveType, LeaveStatus, InvoiceStatus, ExamModerationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export function calculateDefaultPassword(firstName: string, dob: Date): string {
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

async function main() {
  console.log('--- Starting RRCE ERP Comprehensive Database Seed ---');

  const defaultStaffPasswordHash = await bcrypt.hash('Password@123', 10);

  // 1. Departments
  const deptData = [
    { code: 'BCA', usnCode: 'BC', name: 'Bachelor of Computer Applications' },
    { code: 'CSE', usnCode: 'CS', name: 'Computer Science and Engineering' },
    { code: 'AIML', usnCode: 'AI', name: 'Artificial Intelligence and Machine Learning' },
    { code: 'ECE', usnCode: 'EC', name: 'Electronics and Communication Engineering' },
    { code: 'ME', usnCode: 'ME', name: 'Mechanical Engineering' },
    { code: 'ISE', usnCode: 'IS', name: 'Information Science and Engineering' },
    { code: 'BS', usnCode: 'BS', name: 'Basic Science & Humanities' },
  ];

  const depts: Record<string, any> = {};
  for (const d of deptData) {
    depts[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }
  console.log('✓ Departments created/ensured');

  // 2. Users & Staff
  // Principal
  const principalUser = await prisma.user.upsert({
    where: { email: 'principal@rrce.org' },
    update: {},
    create: {
      email: 'principal@rrce.org',
      username: 'principal',
      passwordHash: defaultStaffPasswordHash,
      role: Role.PRINCIPAL,
      firstName: 'Dr. Ramesh',
      lastName: 'Kumar',
      phone: '9845011223',
    },
  });

  // Admission Officer
  const admissionUser = await prisma.user.upsert({
    where: { email: 'admissions@rrce.org' },
    update: {},
    create: {
      email: 'admissions@rrce.org',
      username: 'admissions',
      passwordHash: defaultStaffPasswordHash,
      role: Role.ADMISSION_OFFICE,
      firstName: 'Shuresh',
      lastName: 'Gowda',
      phone: '9845022334',
    },
  });

  // HOD BCA
  const hodBcaUser = await prisma.user.upsert({
    where: { email: 'hod.bca@rrce.org' },
    update: {},
    create: {
      email: 'hod.bca@rrce.org',
      username: 'hod.bca',
      passwordHash: defaultStaffPasswordHash,
      role: Role.HOD,
      firstName: 'Dr. Sunitha',
      lastName: 'Murthy',
      phone: '9845033445',
      departmentId: depts['BCA'].id,
    },
  });
  await prisma.department.update({
    where: { id: depts['BCA'].id },
    data: { hodUserId: hodBcaUser.id },
  });

  // HOD CSE
  const hodCseUser = await prisma.user.upsert({
    where: { email: 'hod.cse@rrce.org' },
    update: {},
    create: {
      email: 'hod.cse@rrce.org',
      username: 'hod.cse',
      passwordHash: defaultStaffPasswordHash,
      role: Role.HOD,
      firstName: 'Dr. Balakrishna',
      lastName: 'Reddy',
      phone: '9845044556',
      departmentId: depts['CSE'].id,
    },
  });
  await prisma.department.update({
    where: { id: depts['CSE'].id },
    data: { hodUserId: hodCseUser.id },
  });

  // Cross-department Math Faculty (Home Dept: Basic Science)
  const mathFacultyUser = await prisma.user.upsert({
    where: { email: 'faculty.math@rrce.org' },
    update: {},
    create: {
      email: 'faculty.math@rrce.org',
      username: 'faculty.math',
      passwordHash: defaultStaffPasswordHash,
      role: Role.FACULTY,
      firstName: 'Prof. Ananya',
      lastName: 'Sharma',
      phone: '9845055667',
      departmentId: depts['BS'].id,
    },
  });

  const mathFaculty = await prisma.faculty.upsert({
    where: { userId: mathFacultyUser.id },
    update: {},
    create: {
      userId: mathFacultyUser.id,
      employeeCode: 'RRCE-FAC-014',
      designation: 'Associate Professor',
      homeDeptId: depts['BS'].id,
    },
  });

  // BCA Faculty
  const bcaFacultyUser = await prisma.user.upsert({
    where: { email: 'faculty.bca@rrce.org' },
    update: {},
    create: {
      email: 'faculty.bca@rrce.org',
      username: 'faculty.bca',
      passwordHash: defaultStaffPasswordHash,
      role: Role.FACULTY,
      firstName: 'Prof. Chethan',
      lastName: 'Kumar',
      phone: '9845066778',
      departmentId: depts['BCA'].id,
    },
  });

  const bcaFaculty = await prisma.faculty.upsert({
    where: { userId: bcaFacultyUser.id },
    update: {},
    create: {
      userId: bcaFacultyUser.id,
      employeeCode: 'RRCE-FAC-022',
      designation: 'Assistant Professor',
      homeDeptId: depts['BCA'].id,
    },
  });

  // CSE Faculty
  const cseFacultyUser = await prisma.user.upsert({
    where: { email: 'faculty.cs@rrce.org' },
    update: {},
    create: {
      email: 'faculty.cs@rrce.org',
      username: 'faculty.cs',
      passwordHash: defaultStaffPasswordHash,
      role: Role.FACULTY,
      firstName: 'Prof. Divya',
      lastName: 'Narayanan',
      phone: '9845077889',
      departmentId: depts['CSE'].id,
    },
  });

  const cseFaculty = await prisma.faculty.upsert({
    where: { userId: cseFacultyUser.id },
    update: {},
    create: {
      userId: cseFacultyUser.id,
      employeeCode: 'RRCE-FAC-035',
      designation: 'Assistant Professor',
      homeDeptId: depts['CSE'].id,
    },
  });
  console.log('✓ Staff & Faculty created');

  // 3. Academic Semesters
  const bcaSem1 = await prisma.academicSemester.upsert({
    where: {
      departmentId_semesterNumber_academicYear: {
        departmentId: depts['BCA'].id,
        semesterNumber: 1,
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      departmentId: depts['BCA'].id,
      semesterNumber: 1,
      academicYear: '2026-2027',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });

  const cseSem1 = await prisma.academicSemester.upsert({
    where: {
      departmentId_semesterNumber_academicYear: {
        departmentId: depts['CSE'].id,
        semesterNumber: 1,
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      departmentId: depts['CSE'].id,
      semesterNumber: 1,
      academicYear: '2026-2027',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });

  // 4. Courses
  const discreteMath = await prisma.course.upsert({
    where: { code: '25BC101' },
    update: {},
    create: {
      code: '25BC101',
      name: 'Discrete Mathematical Structures',
      credits: 4,
      departmentId: depts['BCA'].id,
    },
  });

  const dataStructures = await prisma.course.upsert({
    where: { code: '25BC102' },
    update: {},
    create: {
      code: '25BC102',
      name: 'Data Structures and Algorithms',
      credits: 4,
      departmentId: depts['BCA'].id,
    },
  });

  const engMath = await prisma.course.upsert({
    where: { code: '25CS101' },
    update: {},
    create: {
      code: '25CS101',
      name: 'Engineering Mathematics I',
      credits: 4,
      departmentId: depts['CSE'].id,
    },
  });

  // 5. Course Offerings (Cross-dept: mathFaculty teaches BCA discreteMath & CSE engMath)
  const mathBcaOffering = await prisma.courseOffering.upsert({
    where: {
      academicSemesterId_courseId_section: {
        academicSemesterId: bcaSem1.id,
        courseId: discreteMath.id,
        section: 'A',
      },
    },
    update: {},
    create: {
      academicSemesterId: bcaSem1.id,
      courseId: discreteMath.id,
      facultyId: mathFaculty.id,
      section: 'A',
    },
  });

  const dsBcaOffering = await prisma.courseOffering.upsert({
    where: {
      academicSemesterId_courseId_section: {
        academicSemesterId: bcaSem1.id,
        courseId: dataStructures.id,
        section: 'A',
      },
    },
    update: {},
    create: {
      academicSemesterId: bcaSem1.id,
      courseId: dataStructures.id,
      facultyId: bcaFaculty.id,
      section: 'A',
    },
  });

  const mathCseOffering = await prisma.courseOffering.upsert({
    where: {
      academicSemesterId_courseId_section: {
        academicSemesterId: cseSem1.id,
        courseId: engMath.id,
        section: 'A',
      },
    },
    update: {},
    create: {
      academicSemesterId: cseSem1.id,
      courseId: engMath.id,
      facultyId: mathFaculty.id,
      section: 'A',
    },
  });

  // 6. Timetable Slots
  // Slot 1: Monday 09:00 - 10:00 (540 to 600) Math for BCA in Room 204
  const slotMathBca = await prisma.timetableSlot.create({
    data: {
      courseOfferingId: mathBcaOffering.id,
      dayOfWeek: 1, // Monday
      startTimeMinutes: 540,
      endTimeMinutes: 600,
      roomNumber: 'LH-204',
    },
  });

  // Slot 2: Monday 10:00 - 11:00 (600 to 660) Data Structures for BCA in Room 204
  await prisma.timetableSlot.create({
    data: {
      courseOfferingId: dsBcaOffering.id,
      dayOfWeek: 1, // Monday
      startTimeMinutes: 600,
      endTimeMinutes: 660,
      roomNumber: 'LH-204',
    },
  });

  // Slot 3: Tuesday 09:00 - 10:00 (540 to 600) Math for CSE in Room 301
  await prisma.timetableSlot.create({
    data: {
      courseOfferingId: mathCseOffering.id,
      dayOfWeek: 2, // Tuesday
      startTimeMinutes: 540,
      endTimeMinutes: 600,
      roomNumber: 'LH-301',
    },
  });

  // 7. Students Generation
  // Target 1: Gagan (1RR25BC007, DOB: 14-Dec-2007)
  const gaganDob = new Date('2007-12-14');
  const gaganDefaultPassword = calculateDefaultPassword('Gagan', gaganDob); // GAG141207
  const gaganPasswordHash = await bcrypt.hash(gaganDefaultPassword, 10);

  const gaganUser = await prisma.user.upsert({
    where: { email: '1RR25BC007@rrce.org' },
    update: {},
    create: {
      email: '1RR25BC007@rrce.org',
      username: '1RR25BC007',
      passwordHash: gaganPasswordHash,
      role: Role.STUDENT,
      firstName: 'Gagan',
      lastName: 'R',
      phone: '9845099881',
      isPasswordResetRequired: true,
      departmentId: depts['BCA'].id,
    },
  });

  const gaganStudent = await prisma.student.upsert({
    where: { usn: '1RR25BC007' },
    update: {},
    create: {
      userId: gaganUser.id,
      usn: '1RR25BC007',
      usnCollegeCode: '1RR',
      usnYear: 25,
      usnBranch: 'BC',
      usnSequence: 7,
      dateOfBirth: gaganDob,
      currentSemester: 1,
      quota: 'CET',
      guardianName: 'Rameshwar',
      guardianPhone: '9845011999',
    },
  });

  await prisma.semesterEnrollment.upsert({
    where: {
      studentId_academicSemesterId: {
        studentId: gaganStudent.id,
        academicSemesterId: bcaSem1.id,
      },
    },
    update: {},
    create: {
      studentId: gaganStudent.id,
      academicSemesterId: bcaSem1.id,
      section: 'A',
    },
  });

  // Target 2: Rahul Sharma (1RR25BC008) - Attendance < 75% for Condonation Testing
  const rahulDob = new Date('2007-05-20');
  const rahulPasswordHash = await bcrypt.hash(calculateDefaultPassword('Rahul', rahulDob), 10);
  const rahulUser = await prisma.user.upsert({
    where: { email: '1RR25BC008@rrce.org' },
    update: {},
    create: {
      email: '1RR25BC008@rrce.org',
      username: '1RR25BC008',
      passwordHash: rahulPasswordHash,
      role: Role.STUDENT,
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '9845099882',
      isPasswordResetRequired: false,
      departmentId: depts['BCA'].id,
    },
  });
  const rahulStudent = await prisma.student.upsert({
    where: { usn: '1RR25BC008' },
    update: {},
    create: {
      userId: rahulUser.id,
      usn: '1RR25BC008',
      usnCollegeCode: '1RR',
      usnYear: 25,
      usnBranch: 'BC',
      usnSequence: 8,
      dateOfBirth: rahulDob,
      currentSemester: 1,
      quota: 'MANAGEMENT',
    },
  });
  await prisma.semesterEnrollment.upsert({
    where: {
      studentId_academicSemesterId: {
        studentId: rahulStudent.id,
        academicSemesterId: bcaSem1.id,
      },
    },
    update: {},
    create: {
      studentId: rahulStudent.id,
      academicSemesterId: bcaSem1.id,
      section: 'A',
    },
  });

  // Target 3: Priya Kumar (1RR25BC009) - Approved Medical Leave (EXCUSED) for percentage verification
  const priyaDob = new Date('2007-08-11');
  const priyaPasswordHash = await bcrypt.hash(calculateDefaultPassword('Priya', priyaDob), 10);
  const priyaUser = await prisma.user.upsert({
    where: { email: '1RR25BC009@rrce.org' },
    update: {},
    create: {
      email: '1RR25BC009@rrce.org',
      username: '1RR25BC009',
      passwordHash: priyaPasswordHash,
      role: Role.STUDENT,
      firstName: 'Priya',
      lastName: 'Kumar',
      phone: '9845099883',
      isPasswordResetRequired: false,
      departmentId: depts['BCA'].id,
    },
  });
  const priyaStudent = await prisma.student.upsert({
    where: { usn: '1RR25BC009' },
    update: {},
    create: {
      userId: priyaUser.id,
      usn: '1RR25BC009',
      usnCollegeCode: '1RR',
      usnYear: 25,
      usnBranch: 'BC',
      usnSequence: 9,
      dateOfBirth: priyaDob,
      currentSemester: 1,
      quota: 'MERIT',
    },
  });
  await prisma.semesterEnrollment.upsert({
    where: {
      studentId_academicSemesterId: {
        studentId: priyaStudent.id,
        academicSemesterId: bcaSem1.id,
      },
    },
    update: {},
    create: {
      studentId: priyaStudent.id,
      academicSemesterId: bcaSem1.id,
      section: 'A',
    },
  });

  // More cohort students 1RR25BC001 - 1RR25BC006
  const cohort = [
    { seq: 1, fn: 'Aarav', ln: 'Patel', dob: new Date('2007-01-10') },
    { seq: 2, fn: 'Ananya', ln: 'Iyer', dob: new Date('2007-02-15') },
    { seq: 3, fn: 'Bhavya', ln: 'Rao', dob: new Date('2007-03-20') },
    { seq: 4, fn: 'Chetan', ln: 'Verma', dob: new Date('2007-04-25') },
    { seq: 5, fn: 'Deepak', ln: 'Nair', dob: new Date('2007-05-18') },
    { seq: 6, fn: 'Esha', ln: 'Deshmukh', dob: new Date('2007-06-30') },
  ];

  const allBcaStudents = [gaganStudent, rahulStudent, priyaStudent];
  for (const c of cohort) {
    const usn = `1RR25BC${String(c.seq).padStart(3, '0')}`;
    const pHash = await bcrypt.hash(calculateDefaultPassword(c.fn, c.dob), 10);
    const u = await prisma.user.upsert({
      where: { email: `${usn}@rrce.org` },
      update: {},
      create: {
        email: `${usn}@rrce.org`,
        username: usn,
        passwordHash: pHash,
        role: Role.STUDENT,
        firstName: c.fn,
        lastName: c.ln,
        departmentId: depts['BCA'].id,
      },
    });
    const s = await prisma.student.upsert({
      where: { usn },
      update: {},
      create: {
        userId: u.id,
        usn,
        usnCollegeCode: '1RR',
        usnYear: 25,
        usnBranch: 'BC',
        usnSequence: c.seq,
        dateOfBirth: c.dob,
        currentSemester: 1,
        quota: 'CET',
      },
    });
    await prisma.semesterEnrollment.upsert({
      where: {
        studentId_academicSemesterId: {
          studentId: s.id,
          academicSemesterId: bcaSem1.id,
        },
      },
      update: {},
      create: {
        studentId: s.id,
        academicSemesterId: bcaSem1.id,
        section: 'A',
      },
    });
    allBcaStudents.push(s);
  }
  console.log('✓ BCA Cohort (1RR25BC001 - 009) seeded');

  // 8. Attendance Sessions & Records
  // Session 1: 5 days ago (Locked)
  const session1Date = new Date();
  session1Date.setDate(session1Date.getDate() - 5);
  const session1 = await prisma.attendanceSession.create({
    data: {
      courseOfferingId: mathBcaOffering.id,
      sessionDate: session1Date,
      periodNumber: 1,
      markedById: mathFacultyUser.id,
      isLocked: true, // Past 24h
    },
  });

  // Session 2: Today (Recent / editable)
  const session2Date = new Date();
  const session2 = await prisma.attendanceSession.create({
    data: {
      courseOfferingId: mathBcaOffering.id,
      sessionDate: session2Date,
      periodNumber: 1,
      markedById: mathFacultyUser.id,
      isLocked: false,
    },
  });

  // Populate records:
  // Gagan: Present in both -> 100%
  // Rahul: Absent in both -> 0% (<75%)
  // Priya: Absent in 1, EXCUSED in 2 -> (0 + 1)/2 = 50% or Excused in 1, Present in 1 -> (1+1)/2 = 100%
  for (const s of allBcaStudents) {
    let status1: AttendanceStatus = AttendanceStatus.PRESENT;
    let status2: AttendanceStatus = AttendanceStatus.PRESENT;

    if (s.usn === '1RR25BC008') {
      // Rahul: Absent both
      status1 = AttendanceStatus.ABSENT;
      status2 = AttendanceStatus.ABSENT;
    } else if (s.usn === '1RR25BC009') {
      // Priya: Excused in session 2 due to medical leave
      status1 = AttendanceStatus.PRESENT;
      status2 = AttendanceStatus.EXCUSED;
    }

    await prisma.attendanceRecord.create({
      data: {
        sessionId: session1.id,
        studentId: s.id,
        status: status1,
      },
    });

    await prisma.attendanceRecord.create({
      data: {
        sessionId: session2.id,
        studentId: s.id,
        status: status2,
      },
    });
  }
  console.log('✓ Attendance sessions and records seeded');

  // 9. Leave Request Pending HOD Review
  // Math Faculty requests leave next Monday, requiring substitute faculty for slotMathBca
  const leaveStartDate = new Date();
  leaveStartDate.setDate(leaveStartDate.getDate() + 3);
  const leaveEndDate = new Date();
  leaveEndDate.setDate(leaveEndDate.getDate() + 3);

  const pendingLeave = await prisma.leaveRequest.create({
    data: {
      applicantId: mathFacultyUser.id,
      departmentId: depts['BS'].id,
      leaveType: LeaveType.CASUAL,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: 'Attending National Mathematics Symposium at IISc Bangalore',
      status: LeaveStatus.PENDING,
    },
  });

  // Approved Student Medical Leave for Priya
  const studentLeaveStart = new Date();
  studentLeaveStart.setDate(studentLeaveStart.getDate() - 1);
  const studentLeave = await prisma.leaveRequest.create({
    data: {
      applicantId: priyaUser.id,
      departmentId: depts['BCA'].id,
      leaveType: LeaveType.SICK,
      startDate: studentLeaveStart,
      endDate: new Date(),
      reason: 'Viral fever - doctor prescription attached',
      status: LeaveStatus.APPROVED,
      reviewedById: hodBcaUser.id,
    },
  });

  // 10. Exam Schedule & Moderation Status
  const examCie1 = await prisma.examSchedule.create({
    data: {
      courseOfferingId: mathBcaOffering.id,
      examType: 'CIE_1',
      maxMarks: 50.0,
      weightage: 25.0,
      examDate: new Date('2026-09-15'),
      status: ExamModerationStatus.SUBMITTED_TO_HOD,
    },
  });

  // Add marks entries for students
  for (const s of allBcaStudents) {
    const marks = s.usn === '1RR25BC007' ? 47.5 : s.usn === '1RR25BC008' ? 22.0 : 41.0;
    await prisma.marksEntry.create({
      data: {
        examScheduleId: examCie1.id,
        studentId: s.id,
        marksObtained: marks,
        isAbsent: false,
      },
    });
  }

  // 11. Invoices & Fees
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-BC-007',
      studentId: gaganStudent.id,
      academicSemesterId: bcaSem1.id,
      totalAmount: 85000.0,
      paidAmount: 85000.0,
      status: InvoiceStatus.PAID,
      dueDate: new Date('2026-10-31'),
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-BC-008',
      studentId: rahulStudent.id,
      academicSemesterId: bcaSem1.id,
      totalAmount: 110000.0,
      paidAmount: 50000.0,
      status: InvoiceStatus.PARTIALLY_PAID,
      dueDate: new Date('2026-10-31'),
    },
  });

  console.log('--- RRCE ERP Seed Completed Successfully! ---');
  console.log('Summary of Test Personas:');
  console.log('1. Principal: principal@rrce.org / Password@123');
  console.log('2. Admissions: admissions@rrce.org / Password@123');
  console.log('3. HOD BCA: hod.bca@rrce.org / Password@123');
  console.log('4. Faculty Math (Cross-dept): faculty.math@rrce.org / Password@123');
  console.log(`5. Student Gagan: 1RR25BC007 / ${gaganDefaultPassword} (Password reset required: true)`);
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

