import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES: Record<string, string> = {
	"application/pdf": "pdf",
	"application/msword": "doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
	"text/plain": "txt",
};

const uploadDirectory = path.join(process.cwd(), "private_uploads", "assignments");

export async function GET(request: NextRequest) {
	const session = getSessionFromRequest(request);
	if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	if (session.role !== "STUDENT") return NextResponse.json({ error: "Students only." }, { status: 403 });

	try {
		const student = await prisma.student.findUnique({ where: { userId: session.userId } });
		if (!student?.departmentId) return NextResponse.json({ assignments: [] });

		const assignments = await prisma.assignment.findMany({
			where: {
				subject: {
					departmentId: student.departmentId,
					semester: student.currentSemester,
					section: student.section,
				},
			},
			include: {
				subject: { select: { code: true, name: true } },
				submissions: {
					where: { studentId: session.userId },
					select: {
						id: true,
						status: true,
						submittedAt: true,
						fileUrl: true,
						textResponse: true,
						marksAwarded: true,
						feedback: true,
					},
				},
			},
			orderBy: { dueDate: "asc" },
		});

		const now = Date.now();
		return NextResponse.json({
			assignments: assignments.map(({ submissions, ...assignment }) => {
				const submission = submissions[0] ?? null;
				const isOverdue = new Date(assignment.dueDate).getTime() < now;
				return {
					...assignment,
					submission,
					status: submission?.status ?? (isOverdue ? "OVERDUE" : "PENDING"),
				};
			}),
		});
	} catch (error) {
		console.error("Failed to load student assignments:", error);
		return NextResponse.json({ error: "Could not load assignments." }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const session = getSessionFromRequest(request);
	if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	if (session.role !== "STUDENT") return NextResponse.json({ error: "Students only." }, { status: 403 });

	let newFilePath: string | null = null;
	try {
		const student = await prisma.student.findUnique({ where: { userId: session.userId } });
		if (!student?.departmentId) {
			return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
		}

		const formData = await request.formData();
		const assignmentId = formData.get("assignmentId");
		const textResponseValue = formData.get("textResponse");
		const fileValue = formData.get("file");
		const textResponse = typeof textResponseValue === "string" ? textResponseValue.trim() : "";
		const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

		if (typeof assignmentId !== "string" || (!file && !textResponse)) {
			return NextResponse.json({ error: "Choose a file or enter a text response." }, { status: 400 });
		}
		if (file && file.size > MAX_FILE_SIZE) {
			return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 413 });
		}

		const assignment = await prisma.assignment.findFirst({
			where: {
				id: assignmentId,
				subject: {
					departmentId: student.departmentId,
					semester: student.currentSemester,
					section: student.section,
				},
			},
			include: { submissions: { where: { studentId: session.userId } } },
		});
		if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
		if (assignment.submissions[0]?.status === "GRADED") {
			return NextResponse.json({ error: "A graded submission cannot be changed." }, { status: 409 });
		}

		let fileUrl: string | null = null;
		if (file) {
			const extension = ALLOWED_FILE_TYPES[file.type];
			if (!extension) {
				return NextResponse.json({ error: "Upload a PDF, Word document, or text file." }, { status: 415 });
			}
			const storageKey = `${randomUUID()}.${extension}`;
			await mkdir(uploadDirectory, { recursive: true });
			newFilePath = path.join(uploadDirectory, storageKey);
			await writeFile(newFilePath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
			fileUrl = `/api/assignments/files/${storageKey}`;
		}

		const previousFileUrl = assignment.submissions[0]?.fileUrl;
		const submission = await prisma.submission.upsert({
			where: { assignmentId_studentId: { assignmentId, studentId: session.userId } },
			create: {
				assignmentId,
				studentId: session.userId,
				status: "SUBMITTED",
				submittedAt: new Date(),
				fileUrl,
				textResponse: textResponse || null,
			},
			update: {
				status: "SUBMITTED",
				submittedAt: new Date(),
				fileUrl: file ? fileUrl : previousFileUrl,
				textResponse: textResponse || null,
				marksAwarded: null,
				feedback: null,
			},
		});

		if (file && previousFileUrl) {
			const previousKey = previousFileUrl.split("/").pop();
			if (previousKey && /^[0-9a-f-]+\.(pdf|doc|docx|txt)$/i.test(previousKey)) {
				await unlink(path.join(uploadDirectory, previousKey)).catch(() => undefined);
			}
		}
		newFilePath = null;
		return NextResponse.json({ submission }, { status: 201 });
	} catch (error) {
		if (newFilePath) await unlink(newFilePath).catch(() => undefined);
		console.error("Failed to submit assignment:", error);
		return NextResponse.json({ error: "Could not submit assignment." }, { status: 500 });
	}
}