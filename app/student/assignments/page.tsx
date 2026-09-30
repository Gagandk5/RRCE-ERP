"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ArrowUpRight, BookOpen, Check, ClipboardList, Clock3, FileText, Upload, X } from "lucide-react";

type Submission = {
	id: string;
	status: "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";
	submittedAt: string | null;
	fileUrl: string | null;
	textResponse: string | null;
	marksAwarded: number | null;
	feedback: string | null;
};

type Assignment = {
	id: string;
	title: string;
	description: string;
	type: "THEORY_ASSIGNMENT" | "PRACTICAL_RECORD";
	dueDate: string;
	totalMarks: number;
	subject: { code: string; name: string };
	submission: Submission | null;
	status: Submission["status"];
};

type AssignmentTab = "pending" | "completed";

const STATUS_STYLES: Record<Assignment["status"], string> = {
	PENDING: "border-amber-200 bg-amber-50 text-amber-800",
	OVERDUE: "border-rose-200 bg-rose-50 text-rose-700",
	SUBMITTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
	GRADED: "border-sky-200 bg-sky-50 text-sky-700",
};

const STATUS_LABELS: Record<Assignment["status"], string> = {
	PENDING: "Pending",
	OVERDUE: "Overdue",
	SUBMITTED: "Submitted",
	GRADED: "Graded",
};

function formatDate(value: string) {
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

export default function StudentAssignmentsPage() {
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [activeTab, setActiveTab] = useState<AssignmentTab>("pending");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
	const [isViewMode, setIsViewMode] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [textResponse, setTextResponse] = useState("");
	const [submitError, setSubmitError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function loadAssignments() {
		setLoading(true);
		setLoadError("");
		try {
			const response = await fetch("/api/assignments");
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Could not load assignments.");
			setAssignments(data.assignments || []);
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : "Could not load assignments.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadAssignments();
	}, []);

	const pendingAssignments = assignments.filter((assignment) =>
		assignment.status === "PENDING" || assignment.status === "OVERDUE",
	);
	const completedAssignments = assignments.filter((assignment) =>
		assignment.status === "SUBMITTED" || assignment.status === "GRADED",
	);
	const visibleAssignments = activeTab === "pending" ? pendingAssignments : completedAssignments;

	function openSubmit(assignment: Assignment) {
		setActiveAssignment(assignment);
		setIsViewMode(false);
		setSelectedFile(null);
		setTextResponse("");
		setSubmitError("");
	}

	function openSubmission(assignment: Assignment) {
		setActiveAssignment(assignment);
		setIsViewMode(true);
		setSubmitError("");
	}

	async function submitWork(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!activeAssignment) return;
		if (!selectedFile && !textResponse.trim()) {
			setSubmitError("Choose a file or enter a text response.");
			return;
		}

		setIsSubmitting(true);
		setSubmitError("");
		const formData = new FormData();
		formData.set("assignmentId", activeAssignment.id);
		formData.set("textResponse", textResponse);
		if (selectedFile) formData.set("file", selectedFile);

		try {
			const response = await fetch("/api/assignments", { method: "POST", body: formData });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Could not submit your work.");
			setActiveAssignment(null);
			await loadAssignments();
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : "Could not submit your work.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-6 text-zinc-900">
			<header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200/70 pb-5">
				<div>
					<div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
						<BookOpen className="h-3.5 w-3.5" />
						<span>COURSEWORK</span>
					</div>
					<h1 className="text-xl font-semibold tracking-tight">Assignments &amp; Practicals</h1>
					<p className="mt-1 text-xs text-zinc-500">Review tasks, submit your work, and track marks.</p>
				</div>
				<div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-600">
					<ClipboardList className="h-4 w-4 text-zinc-400" />
					<span><strong className="font-semibold text-zinc-900">{pendingAssignments.length}</strong> to complete</span>
				</div>
			</header>

			<div className="flex items-center gap-1 border-b border-zinc-200/70" role="tablist" aria-label="Assignment status">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "pending"}
					onClick={() => setActiveTab("pending")}
					className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors ${activeTab === "pending" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
				>
					Pending <span className="ml-1.5 text-zinc-400">{pendingAssignments.length}</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "completed"}
					onClick={() => setActiveTab("completed")}
					className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors ${activeTab === "completed" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
				>
					Completed / Graded <span className="ml-1.5 text-zinc-400">{completedAssignments.length}</span>
				</button>
			</div>

			{loadError && (
				<div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700" role="alert">
					<span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{loadError}</span>
					<button type="button" onClick={() => void loadAssignments()} className="font-semibold underline underline-offset-2">Retry</button>
				</div>
			)}

			{loading ? (
				<div className="rounded-2xl border border-zinc-200/70 bg-white px-6 py-16 text-center text-sm text-zinc-400">Loading assignments…</div>
			) : visibleAssignments.length === 0 ? (
				<div className="rounded-2xl border border-zinc-200/70 bg-white px-6 py-16 text-center">
					<div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
						<ClipboardList className="h-5 w-5" />
					</div>
					<h2 className="mt-4 text-sm font-semibold text-zinc-800">{activeTab === "pending" ? "All caught up" : "No completed work yet"}</h2>
					<p className="mt-1 text-xs text-zinc-500">{activeTab === "pending" ? "New coursework for your section will appear here." : "Submitted and graded work will appear here."}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
					{visibleAssignments.map((assignment) => {
						const isOverdue = assignment.status === "OVERDUE";
						const isGraded = assignment.status === "GRADED";
						return (
							<article key={assignment.id} className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="font-mono text-[11px] font-semibold text-zinc-500">{assignment.subject.code}<span className="mx-1.5 text-zinc-300">·</span>{assignment.subject.name}</p>
										<h2 className="mt-2 text-sm font-semibold leading-snug text-zinc-900">{assignment.title}</h2>
									</div>
									<span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[assignment.status]}`}>
										{STATUS_LABELS[assignment.status]}
									</span>
								</div>
								<p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-500">{assignment.description}</p>
								<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
									<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
										<span className="inline-flex items-center gap-1.5 text-zinc-500"><Clock3 className={`h-3.5 w-3.5 ${isOverdue ? "text-rose-500" : "text-zinc-400"}`} />Due <span className={isOverdue ? "font-semibold text-rose-600" : "font-medium text-zinc-700"}>{formatDate(assignment.dueDate)}</span></span>
										<span className="inline-flex items-center gap-1.5 text-zinc-500"><FileText className="h-3.5 w-3.5 text-zinc-400" />{assignment.type === "PRACTICAL_RECORD" ? "Practical record" : "Theory assignment"}</span>
									</div>
									<span className="text-xs font-medium text-zinc-600">
										{isGraded && assignment.submission?.marksAwarded != null
											? <>Marks: <strong className="font-semibold text-zinc-900">{assignment.submission.marksAwarded} / {assignment.totalMarks}</strong></>
											: <>Marks: <strong className="font-semibold text-zinc-400">-- / {assignment.totalMarks}</strong></>}
									</span>
								</div>
								<div className="mt-4 flex justify-end">
									{assignment.status === "PENDING" || assignment.status === "OVERDUE" ? (
										<button type="button" onClick={() => openSubmit(assignment)} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700">
											<Upload className="h-3.5 w-3.5" />Submit Work
										</button>
									) : (
										<button type="button" onClick={() => openSubmission(assignment)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
											{isGraded ? "View Feedback" : "View Submission"}<ArrowUpRight className="h-3.5 w-3.5" />
										</button>
									)}
								</div>
							</article>
						);
					})}
				</div>
			)}

			{activeAssignment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) setActiveAssignment(null); }}>
					<section role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
						<div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
							<div>
								<p className="font-mono text-[11px] font-medium text-zinc-400">{activeAssignment.subject.code} · {activeAssignment.subject.name}</p>
								<h2 id="assignment-modal-title" className="mt-1 text-base font-semibold text-zinc-900">{isViewMode ? "Your submission" : "Submit work"}</h2>
							</div>
							<button type="button" onClick={() => setActiveAssignment(null)} aria-label="Close dialog" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><X className="h-4 w-4" /></button>
						</div>
						{isViewMode ? (
							<div className="space-y-4 px-5 py-5">
								{activeAssignment.submission?.fileUrl && <a href={activeAssignment.submission.fileUrl} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"><span className="flex items-center gap-2"><FileText className="h-4 w-4 text-zinc-400" />Download submitted file</span><ArrowUpRight className="h-4 w-4" /></a>}
								{activeAssignment.submission?.textResponse && <div className="rounded-lg bg-zinc-50 p-3.5"><p className="text-[11px] font-semibold uppercase text-zinc-400">Text response</p><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-700">{activeAssignment.submission.textResponse}</p></div>}
								{activeAssignment.submission?.submittedAt && <p className="text-xs text-zinc-500">Submitted {formatDate(activeAssignment.submission.submittedAt)}</p>}
								{activeAssignment.status === "GRADED" && <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3.5"><p className="text-[11px] font-semibold uppercase text-sky-700">Feedback</p><p className="mt-2 text-xs leading-relaxed text-zinc-700">{activeAssignment.submission?.feedback || "No written feedback was added."}</p><p className="mt-3 text-xs font-semibold text-sky-800">Marks: {activeAssignment.submission?.marksAwarded ?? "--"} / {activeAssignment.totalMarks}</p></div>}
							</div>
						) : (
							<form onSubmit={submitWork} className="space-y-4 px-5 py-5">
								<p className="text-xs leading-relaxed text-zinc-500">{activeAssignment.title}<span className="mx-1.5 text-zinc-300">·</span>Due {formatDate(activeAssignment.dueDate)}</p>
								<label className="block rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 text-center transition-colors hover:border-zinc-400">
									<input type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="sr-only" />
									<span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm"><Upload className="h-4 w-4" /></span>
									<span className="mt-2 block text-xs font-medium text-zinc-700">{selectedFile?.name || "Choose a file to upload"}</span>
									<span className="mt-1 block text-[11px] text-zinc-400">PDF, DOC, DOCX or TXT · up to 10 MB</span>
								</label>
								<div className="flex items-center gap-3 text-[11px] text-zinc-400"><span className="h-px flex-1 bg-zinc-100" />OR<span className="h-px flex-1 bg-zinc-100" /></div>
								<label className="block text-xs font-medium text-zinc-700">Text response <span className="font-normal text-zinc-400">(optional)</span><textarea value={textResponse} onChange={(event) => setTextResponse(event.target.value)} rows={4} maxLength={10000} placeholder="Write your response here" className="mt-2 block w-full resize-y rounded-lg border border-zinc-200 px-3 py-2.5 text-xs font-normal text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" /></label>
								{submitError && <p role="alert" className="text-xs text-rose-600">{submitError}</p>}
								<div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
									<button type="button" onClick={() => setActiveAssignment(null)} className="rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
									<button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"><Check className="h-3.5 w-3.5" />{isSubmitting ? "Submitting…" : "Submit assignment"}</button>
								</div>
							</form>
						)}
					</section>
				</div>
			)}
		</div>
	);
}