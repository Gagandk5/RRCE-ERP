import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ALLOWED_ROLES = ["FACULTY", "HOD", "PRINCIPAL"];

function getSubjectParts(subjectLabel: string) {
	const match = subjectLabel.match(/\(([^()]+)\)\s*$/);
	const code = match?.[1]?.trim() || subjectLabel.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 32);
	const name = subjectLabel.replace(/\s*\([^()]+\)\s*$/, "").trim() || subjectLabel.trim();
	return { code, name };
}

function parseDate(value: string | null) {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const date = new Date(`${value}T00:00:00.000Z`);
	return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export async function GET(request: NextRequest) {
	const session = getSessionFromRequest(request);
	if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	if (!ALLOWED_ROLES.includes(session.role)) return NextResponse.json({ error: "Faculty access required." }, { status: 403 });
	if (session.role === "HOD" && !session.departmentId) return NextResponse.json({ error: "Department assignment is required." }, { status: 403 });

	try {
		const slots = await prisma.timetableSlot.findMany({
			where: {
				facultyId: session.role === "FACULTY" ? session.userId : undefined,
				departmentId: session.role === "HOD" ? session.departmentId : undefined,
			},
			include: { department: { select: { code: true, name: true } } },
			orderBy: [{ departmentId: "asc" }, { semester: "asc" }, { section: "asc" }, { subject: "asc" }],
		});

		const subjectsById = new Map<string, {
			id: string;
			code: string;
			name: string;
			departmentCode: string;
			departmentName: string;
			semester: number;
			section: string;
		}>();

		for (const slot of slots) {
			const { code, name } = getSubjectParts(slot.subject);
			const subject = await prisma.subject.upsert({
				where: {
					code_departmentId_semester_section: {
						code,
						departmentId: slot.departmentId,
						semester: slot.semester,
						section: slot.section,
					},
				},
				update: { name },
				create: {
					code,
					name,
					departmentId: slot.departmentId,
					semester: slot.semester,
					section: slot.section,
				},
			});
			subjectsById.set(subject.id, {
				id: subject.id,
				code: subject.code,
				name: subject.name,
				departmentCode: slot.department.code,
				departmentName: slot.department.name,
				semester: subject.semester,
				section: subject.section,
			});
		}

		const subjects = Array.from(subjectsById.values());
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
				department: { code: subject.departmentCode },
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

		const records = await prisma.attendanceRecord.findMany({
			where: {
				subjectId,
				date,
				studentId: { in: students.map((student) => student.id) },
			},
			select: { studentId: true, status: true },
		});

		return NextResponse.json({ subjects, students, records });
	} catch (error) {
		console.error("Faculty attendance data error:", error);
		return NextResponse.json({ error: "Could not load faculty attendance data." }, { status: 500 });
	}
}