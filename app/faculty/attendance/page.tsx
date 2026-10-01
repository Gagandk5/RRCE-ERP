"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, CheckCheck, CircleAlert, ClipboardCheck, LoaderCircle, Search, UserRound } from "lucide-react";
import { submitAttendance } from "./actions";

type Status = "PRESENT" | "ABSENT" | "EXCUSED";

type FacultySubject = {
	id: string;
	code: string;
	name: string;
	departmentCode: string;
	departmentName: string;
	semester: number;
	section: string;
};

type RosterStudent = {
	id: string;
	usn: string;
	usnSequence: number;
	user: { firstName: string; lastName: string; photoUrl: string | null };
};

type AttendanceRecordResponse = { studentId: string; status: Status };

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
	{ value: "PRESENT", label: "Present" },
	{ value: "ABSENT", label: "Absent" },
	{ value: "EXCUSED", label: "Excused" },
];

function localDateString() {
	const today = new Date();
	return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function initials(student: RosterStudent) {
	return `${student.user.firstName[0] || ""}${student.user.lastName[0] || ""}`.toUpperCase() || "S";
}

export default function FacultyAttendancePage() {
	const [subjects, setSubjects] = useState<FacultySubject[]>([]);
	const [subjectId, setSubjectId] = useState("");
	const [date, setDate] = useState(localDateString);
	const [students, setStudents] = useState<RosterStudent[]>([]);
	const [attendance, setAttendance] = useState<Record<string, Status>>({});
	const [loadingSubjects, setLoadingSubjects] = useState(true);
	const [loadingRoster, setLoadingRoster] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [toast, setToast] = useState("");
	const [search, setSearch] = useState("");

	useEffect(() => {
		let active = true;
		async function loadSubjects() {
			setLoadingSubjects(true);
			try {
				const response = await fetch("/api/faculty/attendance", { cache: "no-store" });
				const payload = await response.json();
				if (!response.ok) throw new Error(payload.error || "Could not load your scheduled subjects.");
				if (active) {
					setSubjects(payload.subjects || []);
					setSubjectId((current) => current || payload.subjects?.[0]?.id || "");
				}
			} catch (loadError) {
				if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your subjects.");
			} finally {
				if (active) setLoadingSubjects(false);
			}
		}
		void loadSubjects();
		return () => { active = false; };
	}, []);

	useEffect(() => {
		if (!subjectId || !date) {
			setStudents([]);
			setAttendance({});
			return;
		}

		const controller = new AbortController();
		async function loadRoster() {
			setLoadingRoster(true);
			setError("");
			try {
				const query = new URLSearchParams({ subjectId, date });
				const response = await fetch(`/api/faculty/attendance?${query}`, { cache: "no-store", signal: controller.signal });
				const payload = await response.json();
				if (!response.ok) throw new Error(payload.error || "Could not load this class roster.");
				const roster: RosterStudent[] = payload.students || [];
				const savedRecords: AttendanceRecordResponse[] = payload.records || [];
				const nextAttendance: Record<string, Status> = {};
				roster.forEach((student) => { nextAttendance[student.id] = "PRESENT"; });
				savedRecords.forEach((record) => { nextAttendance[record.studentId] = record.status; });
				setStudents(roster);
				setAttendance(nextAttendance);
			} catch (loadError) {
				if (!controller.signal.aborted) {
					setStudents([]);
					setAttendance({});
					setError(loadError instanceof Error ? loadError.message : "Could not load this class roster.");
				}
			} finally {
				if (!controller.signal.aborted) setLoadingRoster(false);
			}
		}
		void loadRoster();
		return () => controller.abort();
	}, [subjectId, date]);

	useEffect(() => {
		if (!toast) return;
		const timeout = window.setTimeout(() => setToast(""), 3500);
		return () => window.clearTimeout(timeout);
	}, [toast]);

	const counts = useMemo(() => {
		const values = Object.values(attendance);
		return {
			present: values.filter((status) => status === "PRESENT").length,
			absent: values.filter((status) => status === "ABSENT").length,
			excused: values.filter((status) => status === "EXCUSED").length,
		};
	}, [attendance]);

	const filteredStudents = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		if (!normalizedSearch) return students;
		return students.filter((student) =>
			`${student.usn} ${student.user.firstName} ${student.user.lastName}`.toLowerCase().includes(normalizedSearch),
		);
	}, [students, search]);

	const selectedSubject = subjects.find((subject) => subject.id === subjectId);

	function setStatus(studentId: string, status: Status) {
		setAttendance((current) => ({ ...current, [studentId]: status }));
	}

	function markAllPresent() {
		setAttendance(Object.fromEntries(students.map((student) => [student.id, "PRESENT"])));
	}

	async function saveAttendance() {
		if (!subjectId || !students.length) return;
		setSaving(true);
		setError("");
		setToast("");
		const result = await submitAttendance({
			subjectId,
			date,
			records: students.map((student) => ({ studentId: student.id, status: attendance[student.id] || "PRESENT" })),
		});
		if (result.success) {
			setToast(`Attendance saved for ${result.updatedCount} students.`);
		} else {
			setError(result.error || "Could not save attendance.");
		}
		setSaving(false);
	}

	return (
		<main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
			<header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
				<div>
					<Link href="/faculty" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900">
						<ArrowLeft className="h-3.5 w-3.5" />Faculty dashboard
					</Link>
					<div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
						<ClipboardCheck className="h-4 w-4" />Attendance
					</div>
					<h1 className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-900">Daily class roll</h1>
					<p className="mt-1 text-xs text-zinc-500">Review or correct attendance for any class date.</p>
				</div>
				{selectedSubject && <div className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-right text-xs text-zinc-500"><span className="font-mono font-semibold text-zinc-800">{selectedSubject.departmentCode} · Sem {selectedSubject.semester} · Sec {selectedSubject.section}</span><span className="mt-0.5 block">{selectedSubject.departmentName}</span></div>}
			</header>

			<section className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
				<label className="block text-xs font-medium text-zinc-700">Subject
					<select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={loadingSubjects || !subjects.length} className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50">
						{loadingSubjects && <option value="">Loading subjects…</option>}
						{!loadingSubjects && !subjects.length && <option value="">No scheduled subjects</option>}
						{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} · {subject.name} · Sem {subject.semester} Sec {subject.section}</option>)}
					</select>
				</label>
				<label className="block text-xs font-medium text-zinc-700">Class date
					<span className="relative mt-1.5 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input type="date" value={date} max={localDateString()} onChange={(event) => setDate(event.target.value)} className="block w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100" /></span>
				</label>
				<button type="button" onClick={markAllPresent} disabled={!students.length || loadingRoster || saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50">
					<CheckCheck className="h-4 w-4" />Mark All Present
				</button>
			</section>

			{error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"><CircleAlert className="h-4 w-4 shrink-0" />{error}</div>}

			<section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3.5">
					<div>
						<h2 className="text-sm font-semibold text-zinc-900">Student roster</h2>
						<p className="mt-0.5 text-xs text-zinc-500">{loadingRoster ? "Loading class list…" : `${students.length} students · changes are saved for ${date}`}</p>
					</div>
					<label className="relative block w-full sm:w-64"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or roll number" className="w-full rounded-lg border border-zinc-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-zinc-400" /></label>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[720px] border-collapse text-left">
						<thead className="sticky top-0 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
							<tr><th className="px-4 py-3">Roll number</th><th className="px-4 py-3">Student</th><th className="px-4 py-3 text-center">Attendance status</th></tr>
						</thead>
						<tbody className="divide-y divide-zinc-100">
							{loadingRoster ? Array.from({ length: 6 }, (_, index) => <tr key={index}><td colSpan={3} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-zinc-100" /></td></tr>) : filteredStudents.map((student) => {
								const status = attendance[student.id] || "PRESENT";
								return <tr key={student.id} className="hover:bg-zinc-50/70">
									<td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-500">{student.usn}</td>
									<td className="px-4 py-3"><div className="flex items-center gap-3"><span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500">{initials(student)}{student.user.photoUrl && <img src={student.user.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</span><span className="text-xs font-medium text-zinc-800">{student.user.firstName} {student.user.lastName}</span></div></td>
									<td className="px-4 py-3"><div className="mx-auto flex w-fit rounded-lg border border-zinc-200 bg-zinc-50 p-0.5" role="group" aria-label={`Attendance for ${student.usn}`}>
										{STATUS_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={status === option.value} onClick={() => setStatus(student.id, option.value)} disabled={saving || loadingRoster} className={`min-w-[82px] rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${status === option.value ? option.value === "PRESENT" ? "bg-emerald-600 text-white shadow-sm" : option.value === "ABSENT" ? "bg-rose-600 text-white shadow-sm" : "bg-amber-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}>{option.label}</button>)}
									</div></td>
								</tr>;
							})}
							{!loadingRoster && !filteredStudents.length && <tr><td colSpan={3} className="px-4 py-14 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400"><UserRound className="h-5 w-5" /></div><p className="mt-3 text-sm font-medium text-zinc-700">{students.length ? "No matching students" : "No students in this section"}</p><p className="mt-1 text-xs text-zinc-400">Choose another subject or check the enrolled roster.</p></td></tr>}
						</tbody>
					</table>
				</div>
				<footer className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"><span className="font-medium text-zinc-500">Class summary</span><span className="font-semibold text-emerald-700">Present: {counts.present}</span><span className="font-semibold text-rose-700">Absent: {counts.absent}</span><span className="font-semibold text-amber-700">Excused: {counts.excused}</span></div>
					<button type="button" onClick={saveAttendance} disabled={saving || loadingRoster || !students.length || !subjectId} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50">
						{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving attendance…" : "Save attendance"}
					</button>
				</footer>
			</section>
			{toast && <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-xs font-medium text-white shadow-lg"><Check className="h-4 w-4" />{toast}</div>}
		</main>
	);
}