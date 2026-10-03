import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

		const records = await prisma.attendanceRecord.findMany({
			where: { studentId: student.id },
			include: { subject: { select: { code: true, name: true } } },
			orderBy: [{ date: "desc" }, { subject: { code: "asc" } }],
		});

		const subjectTotals = new Map<string, {
			code: string;
			name: string;
			held: number;
			attended: number;
			absent: number;
			excused: number;
		}>();

		for (const record of records) {
			const key = record.subjectId;
			const totals = subjectTotals.get(key) ?? {
				code: record.subject.code,
				name: record.subject.name,
				held: 0,
				attended: 0,
				absent: 0,
				excused: 0,
			};
			totals.held += 1;
			if (record.status === "PRESENT") totals.attended += 1;
			if (record.status === "ABSENT") totals.absent += 1;
			if (record.status === "EXCUSED") totals.excused += 1;
			subjectTotals.set(key, totals);
		}

		const subjects = Array.from(subjectTotals.values()).map((totals) => ({
			...totals,
			percentage: totals.held ? Number(((totals.attended / totals.held) * 100).toFixed(1)) : 0,
		}));
		const totalHeld = subjects.reduce((total, item) => total + item.held, 0);
		const totalAttended = subjects.reduce((total, item) => total + item.attended, 0);

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
	} catch (error) {
		console.error("Student attendance load failed:", error);
		return NextResponse.json(
			{ error: "Could not load attendance." },
			{ status: 500, headers: { "Cache-Control": "no-store" } }
		);
	}
}