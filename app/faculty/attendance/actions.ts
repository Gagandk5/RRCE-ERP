"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

type AttendanceSubmission = {
	subjectId: string;
	date: string;
	records: Array<{ studentId: string; status: AttendanceStatus }>;
};

export async function submitAttendance(data: AttendanceSubmission) {
	const session = await getSession();
	if (!session) return { success: false, error: "Sign in to submit attendance." };
	if (!["FACULTY", "HOD", "PRINCIPAL"].includes(session.role)) {
		return { success: false, error: "Faculty access is required." };
	}
	if (!data.subjectId || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Array.isArray(data.records) || !data.records.length) {
		return { success: false, error: "Choose a subject and date and mark the roster." };
	}

	const date = new Date(`${data.date}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.date) {
		return { success: false, error: "Choose a valid attendance date." };
	}

	try {
		const subject = await prisma.subject.findUnique({
			where: { id: data.subjectId },
		});
		if (!subject) return { success: false, error: "Subject not found." };

		const assignment = await prisma.timetableSlot.findFirst({
			where: {
				facultyId: session.role === "FACULTY" ? session.userId : undefined,
				departmentId: subject.departmentId,
				semester: subject.semester,
				section: subject.section,
				subject: { contains: subject.code, mode: "insensitive" },
			},
		});
		if (!assignment) return { success: false, error: "You are not assigned to this subject." };
		if (session.role === "HOD" && session.departmentId !== subject.departmentId) {
			return { success: false, error: "You can only update attendance for your department." };
		}

		const studentIds = Array.from(new Set(data.records.map((record) => record.studentId)));
		if (studentIds.length !== data.records.length) {
			return { success: false, error: "The roster contains duplicate students." };
		}
		if (data.records.some((record) => !["PRESENT", "ABSENT", "EXCUSED"].includes(record.status))) {
			return { success: false, error: "One or more attendance statuses are invalid." };
		}

		const enrolledStudents = await prisma.student.findMany({
			where: {
				id: { in: studentIds },
				departmentId: subject.departmentId,
				currentSemester: subject.semester,
				section: subject.section,
			},
			select: { id: true },
		});
		if (enrolledStudents.length !== studentIds.length) {
			return { success: false, error: "The submission includes a student outside this class." };
		}

		await prisma.$transaction(
			data.records.map((record) => prisma.attendanceRecord.upsert({
				where: {
					studentId_subjectId_date: {
						studentId: record.studentId,
						subjectId: subject.id,
						date,
					},
				},
				update: { status: record.status },
				create: {
					studentId: record.studentId,
					subjectId: subject.id,
					date,
					status: record.status,
				},
			})),
		);

		revalidatePath("/student");
		revalidatePath("/student/attendance");
		return { success: true, updatedCount: data.records.length };
	} catch (error) {
		console.error("Attendance submission failed:", error);
		return { success: false, error: "Could not save attendance. Please try again." };
	}
}