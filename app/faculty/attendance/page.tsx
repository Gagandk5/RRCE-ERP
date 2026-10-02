"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  Lock,
  RotateCcw,
  Search,
  UserCheck,
  UserX,
  X,
  AlertTriangle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { submitAttendance, type AttendanceStatus } from "./actions";

type Status = AttendanceStatus;

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
  termAttendance: number;
};

type AttendanceRecordResponse = { studentId: string; status: Status };

type LockoutStatus = {
  isLocked: boolean;
  remainingMs: number;
  formattedRemaining: string;
};

function localDateString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function FacultyAttendancePage() {
  const [subjects, setSubjects] = useState<FacultySubject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(localDateString);
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!subjectId || !date) {
      setStudents([]);
      setAttendance({});
      setLockoutStatus(null);
      return;
    }

    const controller = new AbortController();
    async function loadRoster() {
      setLoadingRoster(true);
      setError("");
      try {
        const query = new URLSearchParams({ subjectId, date });
        const response = await fetch(`/api/faculty/attendance?${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load this class roster.");
        const roster: RosterStudent[] = payload.students || [];
        const savedRecords: AttendanceRecordResponse[] = payload.records || [];
        const nextAttendance: Record<string, Status> = {};

        // Default all to PRESENT, then overlay saved records if present
        roster.forEach((student) => {
          nextAttendance[student.id] = "PRESENT";
        });
        savedRecords.forEach((record) => {
          if (record.status === "PRESENT" || record.status === "ABSENT" || record.status === "LATE") {
            nextAttendance[record.studentId] = record.status;
          }
        });

        setStudents(roster);
        setAttendance(nextAttendance);
        setLockoutStatus(payload.lockoutStatus || null);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setStudents([]);
          setAttendance({});
          setLockoutStatus(null);
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
    const timeout = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const counts = useMemo(() => {
    const values = Object.values(attendance);
    return {
      total: students.length,
      present: values.filter((s) => s === "PRESENT").length,
      absent: values.filter((s) => s === "ABSENT").length,
      late: values.filter((s) => s === "LATE").length,
    };
  }, [attendance, students.length]);

  const absentStudents = useMemo(() => {
    return students.filter((s) => attendance[s.id] === "ABSENT");
  }, [students, attendance]);

  const lateStudents = useMemo(() => {
    return students.filter((s) => attendance[s.id] === "LATE");
  }, [students, attendance]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return students;
    return students.filter((student) =>
      `${student.usn} ${student.user.firstName} ${student.user.lastName}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [students, search]);

  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const isLocked = lockoutStatus?.isLocked || false;

  function setStatus(studentId: string, status: Status) {
    if (isLocked) return;
    setAttendance((current) => ({ ...current, [studentId]: status }));
  }

  function markAllPresent() {
    if (isLocked) return;
    setAttendance(Object.fromEntries(students.map((student) => [student.id, "PRESENT"])));
  }

  function resetAll() {
    if (isLocked) return;
    setAttendance(Object.fromEntries(students.map((student) => [student.id, "PRESENT"])));
  }

  async function handleConfirmSubmit() {
    if (!subjectId || !students.length || isLocked) return;
    setSaving(true);
    setError("");
    setToast("");

    try {
      const result = await submitAttendance({
        subjectId,
        date,
        records: students.map((student) => ({
          studentId: student.id,
          status: attendance[student.id] || "PRESENT",
        })),
      });

      if (result.success) {
        setToast(`Attendance recorded successfully for ${result.updatedCount} students.`);
        setIsConfirmModalOpen(false);
      } else {
        setError(result.error || "Could not save attendance.");
        setIsConfirmModalOpen(false);
      }
    } catch (e) {
      setError("An unexpected error occurred while saving attendance.");
      setIsConfirmModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      {/* 1. OPERATIONAL HEADER & 24H LOCKOUT HUD */}
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/faculty"
            className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Faculty Desk</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              Classroom Roll-Call Ledger
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500 font-medium">
            {selectedSubject ? (
              <span>
                <strong className="text-zinc-800 font-semibold">{selectedSubject.code}</strong> •{" "}
                {selectedSubject.name} · {selectedSubject.departmentCode} Sem {selectedSubject.semester} (Sec {selectedSubject.section})
              </span>
            ) : (
              "Official VTU Daily Attendance Ledger"
            )}
          </p>
        </div>

        {/* 24-HOUR LOCKOUT STATUS INDICATOR */}
        <div className="flex items-center gap-2 shrink-0">
          {lockoutStatus && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs ${
                isLocked
                  ? "bg-rose-50 border-rose-200/80 text-rose-700"
                  : "bg-emerald-50 border-emerald-200/80 text-emerald-800"
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-rose-600" />
                  <span>{lockoutStatus.formattedRemaining}</span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{lockoutStatus.formattedRemaining}</span>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 2. CONTROL STRIP: SUBJECT, DATE, LIVE COUNTERS, AND FAST ACTIONS */}
      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs lg:grid-cols-[1fr_200px_auto] lg:items-end">
        {/* SUBJECT SELECTOR */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Subject & Section
          </label>
          <div className="relative">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={loadingSubjects || !subjects.length || saving}
              aria-label="Subject & Section"
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50"
            >
              {loadingSubjects && <option value="">Loading subjects…</option>}
              {!loadingSubjects && !subjects.length && <option value="">No scheduled subjects</option>}
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} • {sub.name} (Sem {sub.semester} Sec {sub.section})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DATE PICKER */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Session Date
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="date"
              value={date}
              max={localDateString()}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
              aria-label="Session Date"
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50"
            />
          </div>
        </div>

        {/* FAST ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllPresent}
            disabled={!students.length || loadingRoster || saving || isLocked}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-2xs disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600" />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={resetAll}
            disabled={!students.length || loadingRoster || saving || isLocked}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors shadow-2xs disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
            title="Reset to Present"
            aria-label="Reset selection to Present"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ERROR NOTICE */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
        >
          <CircleAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 24-HOUR LOCKOUT WARNING BANNER */}
      {isLocked && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-2xs">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-semibold block leading-tight">
              24-Hour Lockout Active
            </span>
            <p className="mt-0.5 text-rose-700 leading-normal">
              This attendance session was finalized over 24 hours ago. In accordance with VTU autonomy regulations, edits are strictly prohibited without an administrative unlock granted by the Head of Department (HOD) or Principal.
            </p>
          </div>
        </div>
      )}

      {/* 3. HIGH-DENSITY ROLL-CALL LEDGER (DATA TABLE) */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xs">
        {/* TABLE SUB-HEADER: SEARCH & METRICS */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-900">
              Enrolled Roster ({students.length})
            </span>
            {/* INLINE LIVE METRIC COUNTERS */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-emerald-800 font-semibold">
                Present: {counts.present}
              </span>
              <span className="rounded-md bg-rose-50 border border-rose-200/60 px-2 py-0.5 text-rose-800 font-semibold">
                Absent: {counts.absent}
              </span>
              <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-amber-800 font-semibold">
                Late: {counts.late}
              </span>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by USN or Name…"
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead className="bg-zinc-50/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80 select-none">
              <tr>
                <th className="px-4 py-3.5 w-16 text-center">SEQ</th>
                <th className="px-4 py-3.5 w-36">USN</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5 w-40 text-center">Term Attendance</th>
                <th className="px-4 py-3.5 w-64 text-center">Attendance Marker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loadingRoster ? (
                Array.from({ length: 8 }, (_, idx) => (
                  <tr key={idx}>
                    <td colSpan={5} className="px-4 py-3.5">
                      <div className="h-5 animate-pulse rounded-md bg-zinc-100" />
                    </td>
                  </tr>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const status = attendance[student.id] || "PRESENT";
                  const seqFormatted = `#${String(student.usnSequence).padStart(3, "0")}`;
                  const isShortage = student.termAttendance < 75;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        status === "ABSENT" ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* SEQ */}
                      <td className="px-4 py-3 text-center font-mono text-[11px] font-semibold text-zinc-400">
                        {seqFormatted}
                      </td>

                      {/* USN */}
                      <td className="px-4 py-3 font-mono font-semibold text-zinc-800">
                        {student.usn}
                      </td>

                      {/* STUDENT NAME (CLEAN TYPOGRAPHY, NO CIRCLE AVATAR) */}
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {student.user.firstName} {student.user.lastName}
                      </td>

                      {/* TERM ATTENDANCE */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isShortage ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={`font-mono text-xs font-semibold ${
                              isShortage ? "text-rose-700" : "text-zinc-700"
                            }`}
                          >
                            {student.termAttendance.toFixed(1)}%
                          </span>
                          {isShortage && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-100/70 border border-rose-200/80 px-1.5 py-0.5 rounded ml-1">
                              Shortage
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3-SEGMENT ATTENDANCE SWITCHER (PRESENT | ABSENT | LATE) */}
                      <td className="px-4 py-3 text-center">
                        <div
                          className="inline-flex rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-0.5"
                          role="group"
                          aria-label={`Attendance for ${student.usn}`}
                        >
                          {/* PRESENT */}
                          <button
                            type="button"
                            onClick={() => setStatus(student.id, "PRESENT")}
                            disabled={isLocked || saving}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all touch-manipulation ${
                              status === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60"
                            } disabled:cursor-not-allowed`}
                          >
                            Present
                          </button>

                          {/* ABSENT */}
                          <button
                            type="button"
                            onClick={() => setStatus(student.id, "ABSENT")}
                            disabled={isLocked || saving}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all touch-manipulation ${
                              status === "ABSENT"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60"
                            } disabled:cursor-not-allowed`}
                          >
                            Absent
                          </button>

                          {/* LATE */}
                          <button
                            type="button"
                            onClick={() => setStatus(student.id, "LATE")}
                            disabled={isLocked || saving}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all touch-manipulation ${
                              status === "LATE"
                                ? "bg-amber-500 text-white shadow-xs"
                                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60"
                            } disabled:cursor-not-allowed`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                    <UserX className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
                    <span className="font-semibold text-zinc-700 block">
                      No matching students found
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5 block">
                      Try adjusting your search criteria or switch subjects.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. DOCKED STICKY SUBMISSION & ABSENTEE DRAWER */}
      <footer className="sticky bottom-4 z-20 mx-auto w-full max-w-6xl rounded-2xl border border-zinc-200/90 bg-white/95 backdrop-blur-md p-4 shadow-lg transition-all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* ABSENTEE / STATUS SUMMARY */}
          <div className="flex-1 min-w-0">
            {absentStudents.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-rose-700 text-xs flex items-center gap-1.5 shrink-0">
                  <UserX className="h-3.5 w-3.5" />
                  <span>Absent ({absentStudents.length}):</span>
                </span>
                <div className="flex flex-wrap gap-1.5 overflow-hidden">
                  {absentStudents.slice(0, 6).map((s) => (
                    <span
                      key={s.id}
                      className="font-mono text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md"
                    >
                      {s.usn}
                    </span>
                  ))}
                  {absentStudents.length > 6 && (
                    <span className="text-[11px] font-semibold text-rose-600 self-center">
                      +{absentStudents.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <UserCheck className="h-4 w-4" />
                <span>All {students.length} students marked present.</span>
              </div>
            )}

            {lateStudents.length > 0 && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>Late ({lateStudents.length}):</span>
                <span className="font-mono text-[11px]">
                  {lateStudents.map((s) => s.usn).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={saving || loadingRoster || !students.length || !subjectId || isLocked}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-xs font-bold text-white hover:bg-zinc-800 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Ledger…</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Submit Attendance Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* 5. PRE-SUBMIT CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                  <CheckCheck className="w-4 h-4 text-zinc-800" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-950 leading-tight">
                    Confirm Attendance Submission
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {date} • {selectedSubject?.code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/70">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Present
                </span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono">
                  {counts.present}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  Absent
                </span>
                <span className="text-xl font-extrabold text-rose-700 font-mono">
                  {counts.absent}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Late
                </span>
                <span className="text-xl font-extrabold text-amber-700 font-mono">
                  {counts.late}
                </span>
              </div>
            </div>

            {/* ABSENT ROLL NUMBER VERIFICATION LIST */}
            {absentStudents.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-800 block">
                  Absent Students for Double-Checking ({absentStudents.length}):
                </span>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-200/80 bg-zinc-50 p-2.5 space-y-1.5">
                  {absentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-zinc-200/60"
                    >
                      <span className="font-mono font-semibold text-zinc-800">
                        {student.usn}
                      </span>
                      <span className="text-zinc-600 font-medium truncate max-w-[200px]">
                        {student.user.firstName} {student.user.lastName}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        ABSENT
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-800 font-medium text-center">
                All {students.length} students are accounted for as PRESENT.
              </div>
            )}

            {/* VTU 24-HOUR NOTICE */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
              <strong className="text-zinc-900 font-semibold block mb-0.5">
                VTU Autonomy Compliance Notice:
              </strong>
              Submitting this record will lock modifications after 24 hours. After the 24-hour lockout threshold, changes will require formal Department HOD clearance.
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming…</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
