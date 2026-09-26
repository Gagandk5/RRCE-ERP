import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { generateDefaultPassword, generateUSN } from "@/lib/utils";
import { BCA_2025_STUDENTS } from "@/prisma/seed-data";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const departmentCode = searchParams.get("dept");
    const semester = searchParams.get("sem") ? parseInt(searchParams.get("sem")!) : undefined;
    const search = searchParams.get("q")?.toLowerCase();

    let students = [];
    try {
      students = await prisma.student.findMany({
        where: {
          department: departmentCode ? { code: departmentCode } : undefined,
          currentSemester: semester,
          OR: search
            ? [
                { usn: { contains: search, mode: "insensitive" } },
                { user: { firstName: { contains: search, mode: "insensitive" } } },
                { user: { lastName: { contains: search, mode: "insensitive" } } },
              ]
            : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
              isPasswordResetRequired: true,
            },
          },
          department: {
            select: {
              id: true,
              code: true,
              name: true,
              usnCode: true,
            },
          },
          invoices: true,
          attendanceRecords: {
            include: {
              session: {
                select: {
                  subject: true,
                  date: true,
                  semester: true,
                  section: true,
                },
              },
            },
          },
        },
        // Invariant 2: Queries MUST return rosters ordered by usnSequence ASC
        orderBy: {
          usnSequence: "asc",
        },
      });
    } catch (dbErr) {
      console.warn("DB query for students failed, using in-memory roster:", dbErr);
    }

    // If database returned 0 students (e.g. before initial seeding), provide realistic BCA 2025 roster
    if (students.length === 0) {
      const mockList = BCA_2025_STUDENTS.map((s) => {
        const usn = generateUSN("1RR", "25", "BC", s.sequence);
        const defaultPwd = generateDefaultPassword(s.firstName, s.dob);
        const isPaid = s.sequence % 3 === 0;
        const isPartial = s.sequence % 3 === 1;

        return {
          id: `mock-student-${s.sequence}`,
          userId: `mock-user-${s.sequence}`,
          usn,
          usnCollegeCode: "1RR",
          usnYear: "25",
          usnBranch: "BC",
          usnSequence: s.sequence,
          dateOfBirth: s.dob,
          currentSemester: 1,
          quota: s.quota,
          defaultPassword: defaultPwd,
          departmentId: "mock-dept-bca",
          user: {
            id: `mock-user-${s.sequence}`,
            firstName: s.firstName,
            lastName: s.lastName,
            email: `${usn.toLowerCase()}@student.rrce.org`,
            phone: s.phone,
            isActive: true,
            isPasswordResetRequired: true,
          },
          department: {
            id: "mock-dept-bca",
            code: "BCA",
            name: "Bachelor of Computer Applications",
            usnCode: "BC",
          },
          invoices: [
            {
              id: `mock-inv-${s.sequence}`,
              invoiceNumber: `INV-2025-BC${String(s.sequence).padStart(3, "0")}`,
              totalAmount: 85000,
              paidAmount: isPaid ? 85000 : isPartial ? 50000 : 0,
              status: isPaid ? "PAID" : isPartial ? "PENDING" : "OVERDUE",
              title: "Annual Tuition Fee 2025-26",
            },
          ],
          attendanceRecords: [],
        };
      });

      // Filter in-memory roster if search or dept applied
      const filtered = mockList.filter((st) => {
        if (departmentCode && st.department.code !== departmentCode) return false;
        if (search) {
          const fullName = `${st.user.firstName} ${st.user.lastName}`.toLowerCase();
          return st.usn.toLowerCase().includes(search) || fullName.includes(search);
        }
        return true;
      });

      // Guarantee invariant ordering
      filtered.sort((a, b) => a.usnSequence - b.usnSequence);

      return NextResponse.json({
        students: filtered,
        count: filtered.length,
        isMock: true,
      });
    }

    return NextResponse.json({
      students,
      count: students.length,
      isMock: false,
    });
  } catch (error: unknown) {
    console.error("Students GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to retrieve students";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || !["ADMISSIONS", "PRINCIPAL"].includes(session.role)) {
    return NextResponse.json(
      { error: "Unauthorized: Only Admissions or Principal can enroll new students." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, dob, departmentId, quota, semester } = body;

    if (!firstName || !lastName || !dob || !departmentId) {
      return NextResponse.json(
        { error: "firstName, lastName, dateOfBirth, and departmentId are required." },
        { status: 400 }
      );
    }

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!dept) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    // Determine next sequence in department for year 25
    const maxSeqResult = await prisma.student.aggregate({
      where: { departmentId, usnYear: "25" },
      _max: { usnSequence: true },
    });

    const nextSeq = (maxSeqResult._max.usnSequence || 0) + 1;
    const usn = generateUSN("1RR", "25", dept.usnCode, nextSeq);
    const username = usn.toLowerCase();
    const defaultPassword = generateDefaultPassword(firstName, dob);
    const passwordHash = await hashPassword(defaultPassword);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email: email || `${username}@student.rrce.org`,
          passwordHash,
          role: "STUDENT",
          firstName,
          lastName,
          phone,
          departmentId: dept.id,
          isActive: true,
          isPasswordResetRequired: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          usn,
          usnCollegeCode: "1RR",
          usnYear: "25",
          usnBranch: dept.usnCode,
          usnSequence: nextSeq,
          dateOfBirth: new Date(dob),
          currentSemester: semester || 1,
          quota: quota || "KCET",
          departmentId: dept.id,
        },
        include: {
          user: true,
          department: true,
        },
      });

      // Generate initial invoice
      const invoiceNumber = `INV-2025-${dept.usnCode}${String(nextSeq).padStart(3, "0")}`;
      await tx.invoice.create({
        data: {
          invoiceNumber,
          studentId: student.id,
          totalAmount: 85000,
          paidAmount: 0,
          status: "PENDING",
          title: `Annual Tuition Fee 2025-26 (${dept.code})`,
          dueDate: new Date("2025-10-31"),
        },
      });

      await tx.auditLog.create({
        data: {
          action: "STUDENT_ENROLLMENT",
          performedBy: session.username,
          details: JSON.stringify({
            studentId: student.id,
            usn,
            name: `${firstName} ${lastName}`,
            department: dept.code,
            defaultPassword,
          }),
        },
      });

      return { student, defaultPassword };
    });

    return NextResponse.json({
      success: true,
      student: result.student,
      generatedUsn: usn,
      defaultPassword: result.defaultPassword,
      message: `Enrolled successfully with USN: ${usn}`,
    });
  } catch (error: unknown) {
    console.error("Enrollment error:", error);
    const message = error instanceof Error ? error.message : "Failed to enroll student";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
