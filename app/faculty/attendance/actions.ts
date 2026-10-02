"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkAttendanceLockout } from "@/lib/utils";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export type AttendanceSubmission = {
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

		// 24-Hour Lockout check
		const startOfDay = new Date(`${data.date}T00:00:00.000Z`);
		const endOfDay = new Date(`${data.date}T23:59:59.999Z`);
		const existingSession = await prisma.attendanceSession.findFirst({
			where: {
				departmentId: subject.departmentId,
				semester: subject.semester,
				section: subject.section,
				subject: { contains: subject.code, mode: "insensitive" },
				date: { gte: startOfDay, lte: endOfDay },
			},
		});

		if (existingSession) {
			const lockout = checkAttendanceLockout({
				createdAt: existingSession.createdAt,
				isLockedOverride: existingSession.isLockedOverride,
			});
			if (lockout.isLocked) {
				return {
					success: false,
					error: "Attendance session is locked. 24 hours have elapsed since creation. Requires HOD or Principal override to edit.",
					isLocked: true,
				};
			}
		} else {
			const now = Date.now();
			const elapsed = now - date.getTime();
			if (elapsed > 36 * 60 * 60 * 1000) {
				return {
					success: false,
					error: "Cannot create attendance records for dates older than 24 hours without HOD unlock.",
					isLocked: true,
				};
			}
		}

		const studentIds = Array.from(new Set(data.records.map((record) => record.studentId)));
		if (studentIds.length !== data.records.length) {
			return { success: false, error: "The roster contains duplicate students." };
		}
		if (data.records.some((record) => !["PRESENT", "ABSENT", "LATE"].includes(record.status))) {
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

		// Ensure AttendanceSession exists
		let sessionRecord = existingSession;
		if (!sessionRecord) {
			sessionRecord = await prisma.attendanceSession.create({
				data: {
					subject: `${subject.name} (${subject.code})`,
					facultyId: session.userId,
					departmentId: subject.departmentId,
					semester: subject.semester,
					section: subject.section,
					date,
					createdAt: date > new Date() ? new Date() : date,
					lockedAt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
					isLockedOverride: false,
				},
			});
		}

		await prisma.$transaction([
			// Daily attendance records
			...data.records.map((record) =>
				prisma.attendanceRecord.upsert({
					where: {
						studentId_subjectId_date: {
							studentId: record.studentId,
							subjectId: subject.id,
							date,
						},
					},
					update: { status: record.status as any },
					create: {
						studentId: record.studentId,
						subjectId: subject.id,
						date,
						status: record.status as any,
					},
				})
			),
			// Session attendance records
			...data.records.map((record) =>
				prisma.sessionAttendanceRecord.upsert({
					where: {
						sessionId_studentId: {
							sessionId: sessionRecord!.id,
							studentId: record.studentId,
						},
					},
					update: { status: record.status as any },
					create: {
						sessionId: sessionRecord!.id,
						studentId: record.studentId,
						status: record.status as any,
					},
				})
			),
		]);

		revalidatePath("/faculty");
		revalidatePath("/faculty/attendance");
		revalidatePath("/student");
		revalidatePath("/student/attendance");
		return { success: true, updatedCount: data.records.length };
	} catch (error) {
		console.error("Attendance submission failed:", error);
		return { success: false, error: "Could not save attendance. Please try again." };
	}
}
