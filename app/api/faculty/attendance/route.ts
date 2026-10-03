import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, resolveSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { computeAttendancePercentage, countsAsPresent } from "@/lib/attendance";
import { checkAttendanceLockout } from "@/lib/utils";

const ALLOWED_ROLES = ["FACULTY", "HOD", "PRINCIPAL"];

function parseDate(value: string | null) {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const date = new Date(`${value}T00:00:00.000Z`);
	return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export async function GET(request: NextRequest) {
	const session = getSessionFromRequest(request);
	if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	const resolvedUser = await resolveSessionUser(session);
	if (!resolvedUser) return NextResponse.json({ error: "Your session is no longer valid. Please sign in again." }, { status: 401 });
	if (!ALLOWED_ROLES.includes(session.role)) return NextResponse.json({ error: "Faculty access required." }, { status: 403 });
	if (session.role === "HOD" && !session.departmentId) return NextResponse.json({ error: "Department assignment is required." }, { status: 403 });
	const effectiveUserId = resolvedUser.id;
	const effectiveDepartmentId = resolvedUser.departmentId ?? session.departmentId ?? null;

	try {
		const assignmentWhere =
			session.role === "FACULTY"
				? { facultyId: effectiveUserId, isActive: true }
				: session.role === "HOD"
					? { departmentId: effectiveDepartmentId!, isActive: true }
					: { isActive: true };

		const assignments = await prisma.facultyCourseAssignment.findMany({
			where: assignmentWhere,
			include: {
				subject: { include: { department: true } },
			},
			orderBy: [{ departmentId: "asc" }, { semester: "asc" }, { section: "asc" }, { subject: { code: "asc" } }],
		});

		const subjects = assignments.map((assignment) => ({
			id: assignment.subjectId,
			code: assignment.subject.code,
			name: assignment.subject.name,
			departmentCode: assignment.subject.department.code,
			departmentName: assignment.subject.department.name,
			semester: assignment.subject.semester,
			section: assignment.subject.section,
		}));

		const subjectId = request.nextUrl.searchParams.get("subjectId");
		const selectedDate = request.nextUrl.searchParams.get("date");
		if (!subjectId || !selectedDate) return NextResponse.json({ subjects });

		const date = parseDate(selectedDate);
		const subject = subjects.find((item) => item.id === subjectId);
		if (!date || !subject) {
			return NextResponse.json({ error: "Choose a valid assigned subject and date." }, { status: 400 });
		}

		const students = await prisma.student.findMany({
			where: {
				departmentId: (await prisma.subject.findUnique({ where: { id: subjectId }, select: { departmentId: true } }))?.departmentId ?? undefined,
				currentSemester: subject.semester,
				section: subject.section,
			},
			select: {
				id: true,
				usn: true,
				usnSequence: true,
				user: { select: { firstName: true, lastName: true, photoUrl: true } },
			},
			orderBy: { usnSequence: "asc" },
		});

		const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`);
		const endOfDay = new Date(`${selectedDate}T23:59:59.999Z`);
		const sessionRecord = await prisma.attendanceSession.findFirst({
			where: {
				subjectId,
				date: { gte: startOfDay, lte: endOfDay },
			},
			include: {
				records: {
					select: { studentId: true, status: true },
				},
			},
		});

		const records = sessionRecord?.records ?? [];
		const studentIds = students.map((student) => student.id);
		const historyRecords = await prisma.sessionAttendanceRecord.findMany({
			where: {
				studentId: { in: studentIds },
				session: { subjectId },
			},
			select: { studentId: true, status: true },
		});

		const historyByStudent = new Map<string, { held: number; attended: number }>();
		for (const record of historyRecords) {
			const current = historyByStudent.get(record.studentId) || { held: 0, attended: 0 };
			current.held += 1;
			if (countsAsPresent(record.status)) current.attended += 1;
			historyByStudent.set(record.studentId, current);
		}

		const studentsWithStats = students.map((student) => {
			const stats = historyByStudent.get(student.id) || { held: 0, attended: 0 };
			return {
				...student,
				termAttendance: computeAttendancePercentage(stats.attended, stats.held),
			};
		});

		let lockoutStatus = null;
		if (sessionRecord) {
			lockoutStatus = checkAttendanceLockout({
				createdAt: sessionRecord.createdAt,
				isLockedOverride: sessionRecord.isLockedOverride,
			});
		}

		return NextResponse.json({
			subjects,
			students: studentsWithStats,
			records,
			lockoutStatus,
		});
	} catch (error) {
		console.error("Faculty attendance data error:", error);
		return NextResponse.json({ error: "Could not load faculty attendance data." }, { status: 500 });
	}
}
