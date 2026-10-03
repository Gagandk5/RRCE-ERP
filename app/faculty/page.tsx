"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Layers,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";
import { getAttendanceDateString } from "@/lib/attendance";
import {
  ACADEMIC_CALENDAR_EVENTS,
  ACADEMIC_CALENDAR_SYLLABUS,
  ACADEMIC_CALENDAR_TITLE,
  getAcademicCalendarEvents,
  getAcademicNonWorkingEvents,
  type AcademicCalendarCategory,
} from "@/lib/academic-calendar";
import type { TimetableClash } from "@/lib/clash-engine";

type FacultyUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: { id: string; code: string; name: string } | null;
};

type TimetableSlot = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  departmentId: string;
  semester: number;
  section: string;
  facultyId: string;
  roomNumber: string;
  studentCount?: number | null;
  teachingFaculty?: Array<{ id: string; name: string }>;
  faculty?: { id?: string; firstName: string; lastName: string };
  department?: { code: string; name: string };
};

type Department = { id: string; code: string; name: string };
type FacultySubject = {
  id: string;
  code: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  semester: number;
  section: string;
};
type PortalTab = "overview" | "schedule" | "risk" | "marks" | "calendar";

const CATEGORY_LABELS: Record<AcademicCalendarCategory, string> = {
  academic: "Academic event",
  holiday: "Holiday",
  assessment: "IA / assessment",
  examination: "Examination",
  "calendar-marker": "Calendar marker",
  "working-day": "Working day",
  "non-working-day": "Non-working day",
};

const CATEGORY_STYLES: Record<AcademicCalendarCategory, string> = {
  academic: "border-blue-200 bg-blue-50 text-blue-800",
  holiday: "border-rose-200 bg-rose-50 text-rose-800",
  assessment: "border-violet-200 bg-violet-50 text-violet-800",
  examination: "border-amber-200 bg-amber-50 text-amber-800",
  "calendar-marker": "border-zinc-200 bg-zinc-100 text-zinc-700",
  "working-day": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "non-working-day": "border-rose-200 bg-rose-50 text-rose-800",
};

const DAYS = [
  { code: "MON", label: "Monday" },
  { code: "TUE", label: "Tuesday" },
  { code: "WED", label: "Wednesday" },
  { code: "THU", label: "Thursday" },
  { code: "FRI", label: "Friday" },
  { code: "SAT", label: "Saturday" },
];

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2020, 0, 1, hour, minute)));
}

function weekdayInCollegeTimezone(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(date).toUpperCase();
}

function FacultyPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: PortalTab =
    requestedTab === "schedule" || requestedTab === "risk" || requestedTab === "marks" || requestedTab === "calendar"
      ? requestedTab
      : "overview";
  const [currentUser, setCurrentUser] = useState<FacultyUser | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [clashes, setClashes] = useState<TimetableClash[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<FacultySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => getAttendanceDateString().slice(0, 7));
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: "MON",
    startTime: "09:00",
    endTime: "10:00",
    subject: "",
    subjectId: "",
    departmentId: "",
    semester: 3,
    section: "A",
    facultyId: "",
    roomNumber: "",
  });
  const [clashResult, setClashResult] = useState<any>(null);
  const [checkingClash, setCheckingClash] = useState(false);
  const [schedulingSlot, setSchedulingSlot] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFacultyData() {
      setLoading(true);
      setPageError("");
      try {
        const [meResponse, departmentResponse, timetableResponse, attendanceResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/departments", { cache: "no-store" }),
          fetch("/api/timetable", { cache: "no-store" }),
          fetch("/api/faculty/attendance", { cache: "no-store" }),
        ]);
        const mePayload = await meResponse.json();
        if (!meResponse.ok || !mePayload.authenticated || !mePayload.user) {
          throw new Error(mePayload.error || "Could not load your faculty profile.");
        }
        const departmentPayload = await departmentResponse.json();
        if (!departmentResponse.ok) {
          throw new Error(departmentPayload.error || "Could not load departments.");
        }
        const timetablePayload = await timetableResponse.json();
        if (!timetableResponse.ok) {
          throw new Error(timetablePayload.error || "Could not load your timetable.");
        }
        const attendancePayload = await attendanceResponse.json();
        if (!attendanceResponse.ok) {
          throw new Error(attendancePayload.error || "Could not load your assigned subjects.");
        }
        if (!active) return;
        const faculty: FacultyUser = mePayload.user;
        setCurrentUser(faculty);
        setDepartments(departmentPayload.departments || []);
        setSlots(timetablePayload.slots || []);
        setClashes(timetablePayload.conflicts || []);
        setAssignedSubjects(attendancePayload.subjects || []);
        setScheduleForm((previous) => ({
          ...previous,
          departmentId: faculty.department?.id || previous.departmentId,
          subjectId: previous.subjectId || attendancePayload.subjects?.[0]?.id || "",
          subject: previous.subject || (attendancePayload.subjects?.[0]
            ? `${attendancePayload.subjects[0].name} (${attendancePayload.subjects[0].code})`
            : ""),
          semester: previous.subjectId ? previous.semester : attendancePayload.subjects?.[0]?.semester || previous.semester,
          section: previous.subjectId ? previous.section : attendancePayload.subjects?.[0]?.section || previous.section,
          facultyId: faculty.id,
        }));
      } catch (loadError) {
        if (active) {
          setPageError(loadError instanceof Error ? loadError.message : "Could not load faculty data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFacultyData();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login?portal=faculty");
      router.refresh();
    } catch (logoutError) {
      console.error("Logout error:", logoutError);
      setMessage({ type: "error", text: "Could not sign out. Please try again." });
    }
  }

  async function checkLiveClash(updatedForm: typeof scheduleForm) {
    setCheckingClash(true);
    setClashResult(null);
    try {
      const response = await fetch("/api/timetable/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not validate the timetable slot.");
      setClashResult(result);
    } catch (validationError) {
      setMessage({
        type: "error",
        text: validationError instanceof Error ? validationError.message : "Could not validate the timetable slot.",
      });
    } finally {
      setCheckingClash(false);
    }
  }

  async function handleScheduleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSchedulingSlot(true);
    setMessage(null);
    try {
      const response = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.clashes?.[0]?.message || "Scheduling failed.");
      }
      setMessage({ type: "success", text: "Class slot scheduled successfully." });
      setIsScheduleModalOpen(false);
      const timetableResponse = await fetch("/api/timetable", { cache: "no-store" });
      const timetablePayload = await timetableResponse.json();
      if (!timetableResponse.ok) {
        throw new Error(timetablePayload.error || "The slot was saved but the timetable could not be refreshed.");
      }
      setSlots(timetablePayload.slots || []);
      setClashes(timetablePayload.conflicts || []);
    } catch (scheduleError) {
      setMessage({
        type: "error",
        text: scheduleError instanceof Error ? scheduleError.message : "Could not schedule this class slot.",
      });
    } finally {
      setSchedulingSlot(false);
    }
  }

  const todayCode = weekdayInCollegeTimezone(now);
  const todayDate = getAttendanceDateString(now);
  const scheduledToday = slots
    .filter((slot) => slot.dayOfWeek === todayCode)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
  const todaysCalendarEvents = getAcademicCalendarEvents(todayDate);
  const nonWorkingEvents = getAcademicNonWorkingEvents(todayDate);
  const isNonWorkingDay = todayCode === "SUN" || nonWorkingEvents.length > 0;
  const todaysClasses = isNonWorkingDay ? [] : scheduledToday;
  const activeBatch = scheduledToday[0] || slots.find((slot) => slot.section === "A") || slots[0] || null;
  const departmentName = currentUser?.department?.name || currentUser?.department?.code || "Department not set";
  const fullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Faculty";
  const currentTimeParts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).formatToParts(now);
  const currentMinute = Number(currentTimeParts.find((part) => part.type === "hour")?.value || 0) * 60 +
    Number(currentTimeParts.find((part) => part.type === "minute")?.value || 0);
  const nextClassId = todaysClasses.find((slot) => {
    const [hour, minute] = slot.startTime.split(":").map(Number);
    return currentMinute < hour * 60 + minute;
  })?.id;
  const normalizeSubject = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  function getCourseInfo(slot: TimetableSlot) {
    const assignedSubject = assignedSubjects.find((course) => {
      const normalized = normalizeSubject(slot.subject);
      return normalized.includes(normalizeSubject(course.code)) ||
        normalized.includes(normalizeSubject(course.name));
    });
    const code = assignedSubject?.code || slot.subject.match(/B25BCAL?\d+/)?.[0] || "";
    const name = assignedSubject?.name || slot.subject.replace(/\s*\([^)]*\)\s*$/, "");
    return { code, name };
  }
  function classStatus(slot: TimetableSlot) {
    const [startHour, startMinute] = slot.startTime.split(":").map(Number);
    const [endHour, endMinute] = slot.endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    if (currentMinute >= start && currentMinute < end) return "Current";
    if (currentMinute >= end) return "Completed";
    return slot.id === nextClassId ? "Next" : "Upcoming";
  }
  const calendarMonths = Array.from(
    new Set(ACADEMIC_CALENDAR_EVENTS.flatMap((event) => [
      event.startDate.slice(0, 7),
      ...(event.endDate ? [event.endDate.slice(0, 7)] : []),
    ]))
  ).sort();
  const eventsForSelectedMonth = ACADEMIC_CALENDAR_EVENTS
    .filter((event) => {
      const endMonth = (event.endDate || event.startDate).slice(0, 7);
      return event.startDate.slice(0, 7) <= calendarMonth && endMonth >= calendarMonth;
    })
    .sort((left, right) => left.startDate.localeCompare(right.startDate));

  function calendarDateLabel(date: string) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date}T00:00:00.000Z`));
  }

  function calendarRangeLabel(startDate: string, endDate?: string) {
    if (!endDate || endDate === startDate) return calendarDateLabel(startDate);
    return `${calendarDateLabel(startDate)} – ${calendarDateLabel(endDate)}`;
  }
  const mentorshipStudents = [
    { name: "Deepika C S", usn: "1RR25BC005", attendance: "68%", missingClasses: 2 },
    { name: "Shamanth T D", usn: "1RR25BC039", attendance: "70%", missingClasses: 1 },
    { name: "Srujan S", usn: "1RR25BC046", attendance: "72%", missingClasses: 1 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-xs sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">RRCE ERP · Faculty Portal</p>
          <h1 className="mt-1 text-lg font-bold tracking-tight">{fullName}</h1>
          <p className="mt-1 text-xs text-slate-300">{departmentName}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px]">
            <span className="font-semibold text-slate-300">
              {assignedSubjects.length === 1 ? "Assigned Subject:" : "Assigned Subjects:"}
            </span>
            {loading ? (
              <span className="text-slate-400">Loading assignments…</span>
            ) : assignedSubjects.length ? (
              <span className="text-slate-200">
                {assignedSubjects.map((subject) => subject.name).join(" · ")}
              </span>
            ) : (
              <span className="text-slate-400">No active subjects assigned</span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="self-start rounded-md border border-slate-600 px-3.5 py-2 font-semibold text-slate-100 transition-colors hover:bg-slate-800 sm:self-auto"
        >
          Sign Out
        </button>
      </header>

      {message && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-md border p-3.5 font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <span className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message.text}
          </span>
          <button onClick={() => setMessage(null)} aria-label="Dismiss message" className="px-2 font-bold">×</button>
        </div>
      )}

      {pageError && (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3.5 text-rose-800">
          {pageError}
        </div>
      )}

      {activeTab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900">Today&apos;s Classes</h2>
                <p className="mt-1 text-slate-500">
                  {new Intl.DateTimeFormat("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "Asia/Kolkata",
                  }).format(now)}
                </p>
                {nonWorkingEvents.length > 0 ? (
                  <p className="mt-2 font-semibold text-rose-700">
                    Non-working day · {nonWorkingEvents.map((event) => event.title).join(" · ")}
                  </p>
                ) : todayCode === "SUN" ? (
                  <p className="mt-2 font-semibold text-rose-700">Non-working day · Sunday</p>
                ) : todaysCalendarEvents.length > 0 ? (
                  <p className="mt-2 text-slate-600">
                    Calendar: {todaysCalendarEvents.map((event) => event.title).join(" · ")}
                  </p>
                ) : null}
              </div>
              <span className="rounded bg-blue-50 px-2 py-1 font-bold text-blue-800">
                {todaysClasses.length} {todaysClasses.length === 1 ? "Lecture" : "Lectures"}
              </span>
            </div>
            {loading ? (
              <p className="py-6 text-center text-slate-500">Loading your schedule…</p>
            ) : todaysClasses.length ? (
              <ul className="divide-y divide-slate-100">
                {todaysClasses.map((slot) => (
                  <li key={slot.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{getCourseInfo(slot).name}</p>
                        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                          {getCourseInfo(slot).code || "Course code unavailable"}
                        </span>
                        <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                          {getCourseInfo(slot).code.startsWith("B25BCAL") ? "Lab" : "Lecture"}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          classStatus(slot) === "Current" ? "bg-emerald-100 text-emerald-800" :
                          classStatus(slot) === "Next" ? "bg-blue-100 text-blue-800" :
                          classStatus(slot) === "Completed" ? "bg-slate-100 text-slate-600" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {classStatus(slot)}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500">
                        {slot.department?.code || currentUser?.department?.code || "—"} Sem {slot.semester} · Sec {slot.section}
                        {" · "}Room {slot.roomNumber}
                      </p>
                      <p className="mt-1 text-slate-500">
                        Faculty: {slot.teachingFaculty?.map(({ name }) => name).join(" & ") || fullName}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">Topic: Not scheduled</p>
                    </div>
                    <p className="shrink-0 font-mono font-semibold text-slate-700">
                      {timeLabel(slot.startTime)} – {timeLabel(slot.endTime)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-slate-500">
                {pageError
                  ? "Your schedule could not be loaded."
                  : isNonWorkingDay
                    ? "No regular classes scheduled today."
                    : "No classes scheduled today."}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold uppercase tracking-wider text-slate-500">Active Batch</h2>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            {activeBatch ? (
              <>
                <p className="mt-4 text-lg font-bold text-slate-900">
                  {activeBatch.department?.code || currentUser?.department?.code || "—"} Sem {activeBatch.semester} (Sec {activeBatch.section})
                </p>
                <p className="mt-2 text-slate-500">
                  {activeBatch.studentCount == null ? "Enrollment not mapped" : `${activeBatch.studentCount} enrolled`}
                  {" · "}{getCourseInfo(activeBatch).name}
                </p>
              </>
            ) : (
              <p className="mt-4 text-slate-500">No teaching batch is available in the timetable.</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold uppercase tracking-wider text-slate-500">Clash Engine</h2>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                clashes.length ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
              }`}>3-layer checks active</span>
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">{clashes.length} Conflicts</p>
            <p className="mt-1 text-slate-500">Faculty · Room · Batch</p>
            {clashes.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-rose-700">
                {clashes.slice(0, 3).map((clash, index) => (
                  <li key={`${clash.type}-${clash.dayOfWeek}-${index}`}>{clash.message}</li>
                ))}
              </ul>
            )}
            {!loading && clashes.length === 0 && (
              <p className="mt-3 text-emerald-700">No conflicts found in the published timetable.</p>
            )}
          </section>
        </div>
      )}

      {activeTab === "schedule" && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Timetable &amp; Planner</h2>
              <p className="mt-1 text-slate-500">Scheduled classes assigned to your faculty profile.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/faculty?tab=calendar"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4" />
                Academic Calendar
              </Link>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3.5 py-2 font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Schedule Class Slot
              </button>
            </div>
          </div>
          {loading ? (
            <p className="py-6 text-center text-slate-500">Loading your timetable…</p>
          ) : slots.length ? (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div key={slot.id} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{getCourseInfo(slot).name}</p>
                      <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                        {getCourseInfo(slot).code || "Course code unavailable"}
                      </span>
                      <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                        {getCourseInfo(slot).code.startsWith("B25BCAL") ? "Lab" : "Lecture"}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {DAYS.find((day) => day.code === slot.dayOfWeek)?.label || slot.dayOfWeek}
                      {" · "}{slot.department?.code || currentUser?.department?.code || "—"} Sem {slot.semester} Sec {slot.section}
                      {" · "}Room {slot.roomNumber}
                    </p>
                    <p className="mt-1 text-slate-500">
                      Faculty: {slot.teachingFaculty?.map(({ name }) => name).join(" & ") || `${slot.faculty?.firstName || ""} ${slot.faculty?.lastName || ""}`.trim() || "Not assigned"}
                    </p>
                  </div>
                  <p className="font-mono font-semibold text-slate-700">
                    {timeLabel(slot.startTime)} – {timeLabel(slot.endTime)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-500">No timetable slots are assigned to you.</p>
          )}
        </section>
      )}

      {activeTab === "risk" && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-4 w-4 text-slate-500" />
            <div>
              <h2 className="font-bold text-slate-900">Mentorship &amp; Proctoring</h2>
              <p className="mt-1 text-slate-500">Attendance support alerts for students needing follow-up.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {mentorshipStudents.map((student) => (
              <div key={student.usn} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
                <div>
                  <p className="font-bold text-slate-900">{student.name}</p>
                  <p className="mt-1 text-slate-600">
                    {student.usn} · Attendance {student.attendance} · {student.missingClasses} classes needed to reach 75%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "marks" && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Marks Entry (CIE)</h2>
          <p className="mt-2 text-slate-500">No marks-entry view is currently configured in the Faculty Portal.</p>
        </section>
      )}

      {activeTab === "calendar" && (
        <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Academic Calendar</h2>
              <p className="mt-1 text-slate-500">{ACADEMIC_CALENDAR_TITLE}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/faculty?tab=schedule"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4" />
                Weekly Timetable
              </Link>
              <label className="font-semibold text-slate-700">
                Month
                <select
                  value={calendarMonth}
                  onChange={(event) => setCalendarMonth(event.target.value)}
                  className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2"
                >
                  {calendarMonths.map((month) => (
                    <option key={month} value={month}>
                      {new Intl.DateTimeFormat("en-IN", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(`${month}-01T00:00:00.000Z`))}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as AcademicCalendarCategory[]).map((category) => (
              <span key={category} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${CATEGORY_STYLES[category]}`}>
                {CATEGORY_LABELS[category]}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Calendar / Remarks</th>
                  <th className="px-3 py-2.5">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventsForSelectedMonth.map((event, index) => (
                  <tr key={`${event.startDate}-${event.title}-${index}`}>
                    <td className="whitespace-nowrap px-3 py-3 font-mono font-semibold text-slate-700">
                      {calendarRangeLabel(event.startDate, event.endDate)}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{event.title}</td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${CATEGORY_STYLES[event.category]}`}>
                        {CATEGORY_LABELS[event.category]}
                      </span>
                    </td>
                  </tr>
                ))}
                {!eventsForSelectedMonth.length && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                      No events are listed for this month in the supplied calendar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 font-bold text-slate-900">IA Syllabus Coverage Deadlines</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {ACADEMIC_CALENDAR_SYLLABUS.map((item) => (
                <div key={item.name} className="rounded-md border border-violet-200 bg-violet-50 p-3">
                  <p className="font-bold text-violet-900">{item.name}</p>
                  <p className="mt-1 text-violet-800">{item.modules}</p>
                  <p className="mt-1 font-mono text-violet-700">{calendarDateLabel(item.deadline)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Dates not specified in the source are not inferred. Saturday entries are shown as calendar markers, not assumed to be holidays.
            </p>
          </div>
        </section>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-slate-700" />
                <div>
                  <h3 className="font-bold text-slate-900">Schedule Class Slot</h3>
                  <p className="text-slate-500">Timetable clash checks cover faculty, room, and batch.</p>
                </div>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} aria-label="Close" className="px-2 text-lg text-slate-500">×</button>
            </div>

            {clashResult?.hasClash && (
              <div className="mb-4 space-y-1 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-800">
                <p className="flex items-center gap-2 font-bold"><ShieldAlert className="h-4 w-4" />Schedule conflict detected</p>
                {clashResult.clashes.map((clash: any, index: number) => (
                  <p key={index}>{clash.message}</p>
                ))}
              </div>
            )}
            {clashResult && !clashResult.hasClash && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                No timetable clashes detected.
              </p>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 font-semibold text-slate-700">
                  Day
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(event) => {
                      const updated = { ...scheduleForm, dayOfWeek: event.target.value };
                      setScheduleForm(updated);
                      void checkLiveClash(updated);
                    }}
                    className="w-full rounded border border-slate-300 p-2"
                  >
                    {DAYS.map((day) => <option key={day.code} value={day.code}>{day.label}</option>)}
                  </select>
                </label>
                <label className="space-y-1 font-semibold text-slate-700">
                  Start
                  <input required type="time" value={scheduleForm.startTime} onChange={(event) => setScheduleForm({ ...scheduleForm, startTime: event.target.value })} className="w-full rounded border border-slate-300 p-2" />
                </label>
                <label className="space-y-1 font-semibold text-slate-700">
                  End
                  <input required type="time" value={scheduleForm.endTime} onChange={(event) => setScheduleForm({ ...scheduleForm, endTime: event.target.value })} className="w-full rounded border border-slate-300 p-2" />
                </label>
              </div>
              <label className="block space-y-1 font-semibold text-slate-700">
                Assigned Subject
                <select
                  required
                  value={scheduleForm.subjectId}
                  onChange={(event) => {
                    const subject = assignedSubjects.find((item) => item.id === event.target.value);
                    if (!subject) return;
                    setScheduleForm({
                      ...scheduleForm,
                      subjectId: subject.id,
                      subject: `${subject.name} (${subject.code})`,
                      departmentId: departments.find((item) => item.code === subject.departmentCode)?.id || scheduleForm.departmentId,
                      semester: subject.semester,
                      section: subject.section,
                    });
                    setClashResult(null);
                  }}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="">Choose an assigned subject</option>
                  {assignedSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} · {subject.name} (Sem {subject.semester}, Sec {subject.section})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 font-semibold text-slate-700">
                  Room
                  <input required value={scheduleForm.roomNumber} onChange={(event) => setScheduleForm({ ...scheduleForm, roomNumber: event.target.value })} className="w-full rounded border border-slate-300 p-2" />
                </label>
                <label className="space-y-1 font-semibold text-slate-700">
                  Department
                  <select required value={scheduleForm.departmentId} onChange={(event) => setScheduleForm({ ...scheduleForm, departmentId: event.target.value })} className="w-full rounded border border-slate-300 p-2">
                    <option value="">Choose department</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.code} – {department.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 font-semibold text-slate-700">
                  Semester
                  <input required type="number" min={1} max={10} value={scheduleForm.semester} onChange={(event) => setScheduleForm({ ...scheduleForm, semester: Number(event.target.value) })} className="w-full rounded border border-slate-300 p-2" />
                </label>
                <label className="space-y-1 font-semibold text-slate-700">
                  Section
                  <input required value={scheduleForm.section} onChange={(event) => setScheduleForm({ ...scheduleForm, section: event.target.value })} className="w-full rounded border border-slate-300 p-2" />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700">Cancel</button>
                <button type="button" disabled={checkingClash || !scheduleForm.departmentId || !scheduleForm.facultyId || !scheduleForm.subjectId} onClick={() => void checkLiveClash(scheduleForm)} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">
                  {checkingClash ? "Checking…" : "Check clashes"}
                </button>
                <button type="submit" disabled={schedulingSlot || checkingClash || clashResult?.hasClash || !scheduleForm.facultyId || !scheduleForm.subjectId} className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50">
                  {schedulingSlot ? "Saving…" : "Save slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacultyPortal() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Faculty Portal…</div>}>
      <FacultyPortalContent />
    </Suspense>
  );
}
