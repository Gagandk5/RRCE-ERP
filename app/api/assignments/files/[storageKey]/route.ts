import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

const uploadDirectory = path.join(process.cwd(), "private_uploads", "assignments");
const CONTENT_TYPES: Record<string, string> = {
	pdf: "application/pdf",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	txt: "text/plain; charset=utf-8",
};

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ storageKey: string }> },
) {
	const session = getSessionFromRequest(request);
	if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	if (session.role !== "STUDENT") return NextResponse.json({ error: "Students only." }, { status: 403 });

	const { storageKey } = await params;
	if (!/^[0-9a-f-]{36}\.(pdf|doc|docx|txt)$/i.test(storageKey)) {
		return NextResponse.json({ error: "File not found." }, { status: 404 });
	}

	try {
		const fileUrl = `/api/assignments/files/${storageKey}`;
		const submission = await prisma.submission.findFirst({
			where: { studentId: session.userId, fileUrl },
			select: { id: true },
		});
		if (!submission) return NextResponse.json({ error: "File not found." }, { status: 404 });

		const bytes = await readFile(path.join(uploadDirectory, storageKey));
		const extension = storageKey.split(".").pop() ?? "pdf";
		return new NextResponse(new Uint8Array(bytes), {
			headers: {
				"Content-Type": CONTENT_TYPES[extension],
				"Content-Disposition": `attachment; filename="submission.${extension}"`,
				"Cache-Control": "private, no-store",
			},
		});
	} catch (error) {
		console.error("Failed to retrieve assignment file:", error);
		return NextResponse.json({ error: "File not found." }, { status: 404 });
	}
}