import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { computeAttendancePercentage, countsAsPresent } from "@/lib/attendance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
	const session = getSessionFromRequest(request);
	if (!session) {
		return NextResponse.json(
			{ error: "Authentication required." },
			{ status: 401, headers: { "Cache-Control": "no-store" } }
		);
	}
	if (session.role !== "STUDENT") {
		return NextResponse.json(
			{ error: "Student access required." },
			{ status: 403, headers: { "Cache-Control": "no-store" } }
		);
	}

	try {
		let student = await prisma.student.findUnique({ where: { userId: session.userId } });
		if (!student && session.usn) {
			student = await prisma.student.findUnique({ where: { usn: session.usn } });
		}
		if (!student) {
			return NextResponse.json(
				{ records: [], subjects: [], totalHeld: 0, totalAttended: 0 },
				{ headers: { "Cache-Control": "no-store" } }
			);
		}

		const sessionRecords = await prisma.sessionAttendanceRecord.findMany({
			where: { studentId: student.id },
			include: {
				session: {
					include: {
						subjectRef: { select: { id: true, code: true, name: true } },
					},
				},
			},
			orderBy: [{ session: { date: "desc" } }, { createdAt: "desc" }],
		});

		const subjectTotals = new Map<string, {
			code: string;
			name: string;
			held: number;
			attended: number;
			absent: number;
			late: number;
		}>();

		for (const record of sessionRecords) {
			const subjectId = record.session.subjectId || record.session.subjectRef?.id || `${record.session.departmentId}:${record.session.semester}:${record.session.section}:${record.session.subject}`;
			const subjectKey = String(subjectId);
			const totals = subjectTotals.get(subjectKey) ?? {
				code: record.session.subjectRef?.code || record.session.subject || "UNKNOWN",
				name: record.session.subjectRef?.name || record.session.subject || "Unknown subject",
				held: 0,
				attended: 0,
				absent: 0,
				late: 0,
			};
			totals.held += 1;
			if (record.status === "ABSENT") totals.absent += 1;
			if (record.status === "LATE") totals.late += 1;
			if (countsAsPresent(record.status)) totals.attended += 1;
			subjectTotals.set(subjectKey, totals);
		}

		const subjects = Array.from(subjectTotals.values()).map((totals) => ({
			...totals,
			percentage: computeAttendancePercentage(totals.attended, totals.held),
		}));
		const totalHeld = sessionRecords.length;
		const totalAttended = sessionRecords.filter((record) => countsAsPresent(record.status)).length;

<<<<<<< Updated upstream
		return NextResponse.json(
			{
				records: records.map((record) => ({
					id: record.id,
					date: record.date.toISOString().slice(0, 10),
					status: record.status,
					subject: record.subject,
				})),
				subjects,
				totalHeld,
				totalAttended,
			},
			{
				headers: {
					"Cache-Control": "no-store, no-cache, must-revalidate",
				},
			}
		);
=======
		return NextResponse.json({
			records: sessionRecords.map((record) => ({
				id: record.id,
				date: record.session.date.toISOString().slice(0, 10),
				status: record.status,
				subject: {
					code: record.session.subjectRef?.code || record.session.subject || "UNKNOWN",
					name: record.session.subjectRef?.name || record.session.subject || "Unknown subject",
				},
			})),
			subjects,
			totalHeld,
			totalAttended,
		});
>>>>>>> Stashed changes
	} catch (error) {
		console.error("Student attendance load failed:", error);
		return NextResponse.json(
			{ error: "Could not load attendance." },
			{ status: 500, headers: { "Cache-Control": "no-store" } }
		);
	}
}