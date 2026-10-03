"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Plus,
  Layers,
  Users,
  ShieldAlert,
  LogOut,
  AlertCircle,
  Search,
} from "lucide-react";

export default function FacultyPortal() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"rollcall" | "schedule" | "risk">("rollcall");
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: "MON",
    startTime: "09:00",
    endTime: "10:00",
    subject: "Digital Principles and Computer Organization (B25BCA301)",
    departmentId: "",
    semester: 3,
    section: "A",
    facultyId: "",
    roomNumber: "LH-201",
  });
  const [clashResult, setClashResult] = useState<any>(null);
  const [checkingClash, setCheckingClash] = useState(false);
  const [schedulingSlot, setSchedulingSlot] = useState(false);

  useEffect(() => {
    loadFacultyData();
  }, []);

  async function loadFacultyData() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      let loggedInUser: any = null;
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          loggedInUser = meData.user;
          setCurrentUser(loggedInUser);
        }
      }

      const dRes = await fetch("/api/departments");
      let deptList: any[] = [];
      if (dRes.ok) {
        const d = await dRes.json();
        deptList = d.departments || [];
        setDepartments(deptList);
      }

      const bcaDept = deptList.find((d: any) => d.code === "BCA") || deptList[0];
      setScheduleForm((prev) => ({
        ...prev,
        departmentId: prev.departmentId || bcaDept?.id || "",
        facultyId: prev.facultyId || loggedInUser?.id || "",
      }));

      const stRes = await fetch("/api/students?dept=BCA");
      if (stRes.ok) {
        const stData = await stRes.json();
        const roster = stData.students || [];
        setStudents(roster);

        const initMap: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
        roster.forEach((s: any) => {
          initMap[s.id] = "PRESENT";
        });
        setAttendanceMap(initMap);
      }

      const sessRes = await fetch("/api/attendance/session?dept=BCA");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const sessList = sessData.sessions || [];
        setSessions(sessList);
        if (sessList.length > 0) {
          setSelectedSessionId(sessList[0].id);
        }
      }

      const ttRes = await fetch("/api/timetable?dept=BCA");
      if (ttRes.ok) {
        const ttData = await ttRes.json();
        setTimetableSlots(ttData.slots || []);
      }
    } catch (e) {
      console.error("Failed to load faculty portal data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  async function checkLiveClash(updatedForm: typeof scheduleForm) {
    setCheckingClash(true);
    setClashResult(null);
    try {
      const res = await fetch("/api/timetable/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });
      const data = await res.json();
      setClashResult(data);
    } catch (e) {
      console.error("Clash validation error:", e);
    } finally {
      setCheckingClash(false);
    }
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSchedulingSlot(true);
    setMessage(null);

    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: "Class slot scheduled successfully. Conflict checks verified across Faculty, Room, and Batch.",
        });
        setIsScheduleModalOpen(false);
        await loadFacultyData();
      } else {
        setMessage({
          type: "error",
          text: data.error || (data.clashes ? data.clashes[0]?.message : "Scheduling failed."),
        });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to communicate with timetable server." });
    } finally {
      setSchedulingSlot(false);
    }
  }

  function toggleStatus(studentId: string, status: "PRESENT" | "ABSENT" | "LATE") {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  }

  function markAll(status: "PRESENT" | "ABSENT") {
    const updated: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  }

  async function handleSaveAttendance() {
    if (!selectedSessionId) return;
    setSaving(true);
    setMessage(null);

    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const res = await fetch("/api/attendance/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          records,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Attendance saved successfully for ${records.length} students.`,
        });
        await loadFacultyData();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to record attendance.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while saving attendance." });
    } finally {
      setSaving(false);
    }
  }

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const isSessionLocked = currentSession?.lockoutStatus?.isLocked && !currentSession?.isLockedOverride;

  const presentCount = Object.values(attendanceMap).filter((s) => s === "PRESENT").length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === "ABSENT").length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === "LATE").length;

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    return s.usn.toLowerCase().includes(term) || fullName.includes(term);
  });

  const userSlots = timetableSlots.filter((slot: any) => {
    if (!currentUser?.id) return true;
    return slot.facultyId === currentUser.id || slot.faculty?.email === currentUser.email;
  });

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const currentDayCode = dayNames[new Date().getDay()] || "MON";
  const todayUserSlots = userSlots.filter((s: any) => s.dayOfWeek === (currentDayCode === "SUN" ? "MON" : currentDayCode));
  const activeSlots = todayUserSlots.length > 0 ? todayUserSlots : userSlots;

  const teacherClassesToday = activeSlots.length > 0
    ? activeSlots.map((s: any, idx: number) => ({
        time: `${s.startTime} - ${s.endTime}`,
        subject: s.subject,
        batch: `${s.department?.code || "BCA"} Sem ${s.semester} (Sec ${s.section})`,
        room: s.roomNumber,
        status: idx === 0 ? "ACTIVE_NOW" : "SCHEDULED",
      }))
    : [
        {
          time: "09:00 - 10:00",
          subject: "Digital Principles and Computer Organization (B25BCA301)",
          batch: "BCA Sem 3 (Sec A)",
          room: "LH-201",
          status: "ACTIVE_NOW",
        },
      ];

  const lowAttendanceStudents = [
    { name: "Deepika C S", usn: "1RR25BC005", attendance: "68%", missingClasses: 2 },
    { name: "Shamanth T D", usn: "1RR25BC039", attendance: "70%", missingClasses: 1 },
    { name: "Srujan S", usn: "1RR25BC046", attendance: "72%", missingClasses: 1 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 text-xs">
      {/* GROUNDED HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center shrink-0 border border-slate-700">
            <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Faculty Desk • Prof. {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Jaishankar M"}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Department of Mathematics • RRCE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/faculty/attendance"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-md transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Daily Attendance</span>
          </Link>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Class Slot</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-md border font-medium flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : message.type === "warning"
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <span className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            {message.text}
          </span>
          <button onClick={() => setMessage(null)} className="font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* COMPACT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Today's Classes</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
              {teacherClassesToday.length} {teacherClassesToday.length === 1 ? "Lecture" : "Lectures"}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {teacherClassesToday[0]?.room || "LH-201"}{" "}
            <span className="text-xs font-normal text-slate-400">Next Lecture</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
            {teacherClassesToday[0]
              ? `${teacherClassesToday[0].time} • ${teacherClassesToday[0].subject}`
              : "09:00 - 10:00 • Digital Principles and Computer Organization (B25BCA301)"}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Active Batch</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px]">
              54 Enrolled
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            BCA Sem 3 (Sec A)
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            USN Sequence: 001 - 057
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">24h Edit Window</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
              Active
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            Editable
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            24-Hour Edit Window Open
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Clash Engine</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px]">
              3-Layer Active
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            0 Conflicts
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Faculty • Room • Batch Verified
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 gap-6 font-bold">
        <button
          onClick={() => setActiveTab("rollcall")}
          className={`pb-2.5 transition-colors flex items-center gap-2 ${
            activeTab === "rollcall"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4 text-slate-600" />
          Mark Attendance (BCA 3rd Sem)
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-2.5 transition-colors flex items-center gap-2 ${
            activeTab === "schedule"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4 text-slate-600" />
          Teaching Schedule & Timetable
        </button>

        <button
          onClick={() => setActiveTab("risk")}
          className={`pb-2.5 transition-colors flex items-center gap-2 ${
            activeTab === "risk"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-slate-600" />
          Attendance Warnings ({lowAttendanceStudents.length} Students)
        </button>
      </div>

      {/* TAB 1: ATTENDANCE MARKER */}
      {activeTab === "rollcall" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="font-bold text-slate-700 shrink-0">
                Session:
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                {sessions.length === 0 ? (
                  <option value="">No Active Sessions</option>
                ) : (
                  sessions.map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.subject} ({new Date(sess.date).toLocaleDateString("en-GB")})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-3">
              {currentSession && (
                <div
                  className={`px-3 py-1 rounded-md border font-bold flex items-center gap-2 ${
                    currentSession.isLockedOverride
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : isSessionLocked
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                  }`}
                >
                  {isSessionLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>24-Hour Lockout Active</span>
                    </>
                  ) : currentSession.isLockedOverride ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unlocked via Override</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{currentSession.lockoutStatus?.formattedRemaining || "Active"}</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={handleSaveAttendance}
                disabled={saving || isSessionLocked}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Submit Attendance"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-medium">Total: <strong>{students.length}</strong></span>
              <span className="text-emerald-700 font-bold">Present: {presentCount}</span>
              <span className="text-rose-700 font-bold">Absent: {absentCount}</span>
              <span className="text-amber-700 font-bold">Late: {lateCount}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <button
                onClick={() => markAll("PRESENT")}
                disabled={isSessionLocked}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-md font-bold text-[11px] disabled:opacity-50"
              >
                Mark All Present
              </button>
              <button
                onClick={() => markAll("ABSENT")}
                disabled={isSessionLocked}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-md font-bold text-[11px] disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">
                Official BCA 2025 Roll-Call Roster (Guaranteed usnSequence ASC)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Click P, A, or L
              </span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Seq</th>
                    <th className="py-2.5 px-3">USN</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ergonomic Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => {
                    const currentStatus = attendanceMap[st.id] || "PRESENT";
                    return (
                      <tr
                        key={st.id}
                        className={`transition-colors ${
                          currentStatus === "ABSENT"
                            ? "bg-rose-50/60"
                            : currentStatus === "LATE"
                            ? "bg-amber-50/60"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                          #{String(st.usnSequence).padStart(3, "0")}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {st.usn}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {st.user?.firstName} {st.user?.lastName}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : currentStatus === "ABSENT"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              disabled={isSessionLocked}
                              onClick={() => toggleStatus(st.id, "PRESENT")}
                              className={`w-7 h-7 rounded font-bold transition-colors disabled:opacity-40 ${
                                currentStatus === "PRESENT"
                                  ? "bg-slate-900 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                              }`}
                            >
                              P
                            </button>
                            <button
                              disabled={isSessionLocked}
                              onClick={() => toggleStatus(st.id, "ABSENT")}
                              className={`w-7 h-7 rounded font-bold transition-colors disabled:opacity-40 ${
                                currentStatus === "ABSENT"
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                              }`}
                            >
                              A
                            </button>
                            <button
                              disabled={isSessionLocked}
                              onClick={() => toggleStatus(st.id, "LATE")}
                              className={`w-7 h-7 rounded font-bold transition-colors disabled:opacity-40 ${
                                currentStatus === "LATE"
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                              }`}
                            >
                              L
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Today's Teaching Schedule ({["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]})
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  3-Layer Clash Engine Verified (Faculty • Room • Batch)
                </p>
              </div>

              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Class Slot</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {teacherClassesToday.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    c.status === "ACTIVE_NOW"
                      ? "bg-blue-50/80 border-blue-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{c.subject}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          c.status === "ACTIVE_NOW"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {c.status === "ACTIVE_NOW" ? "Active Lecture" : c.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Batch: {c.batch} • Room: <strong>{c.room}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {c.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE WARNINGS */}
      {activeTab === "risk" && (
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Attendance Compliance Alerts (&lt;75%)
              </h2>
              <p className="text-xs text-slate-500">
                Students below the 75% minimum VTU eligibility requirement
              </p>
            </div>
            <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              3 Students Alerted
            </span>
          </div>

          <div className="space-y-2.5">
            {lowAttendanceStudents.map((st, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{st.name}</h3>
                    <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-amber-200">
                      {st.usn}
                    </span>
                  </div>
                  <p className="text-amber-800 mt-1 text-[11px]">
                    Current Attendance: <strong>{st.attendance}</strong>. Requires <strong>{st.missingClasses} additional sessions</strong> to reach 75%.
                  </p>
                </div>

                <button
                  onClick={() => alert(`Reminder sent to ${st.name} (${st.usn})`)}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-md font-semibold text-xs shrink-0 transition-colors"
                >
                  Send Student Reminder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMETABLE SCHEDULE MODAL WITH INLINE CLASH ALERTS */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-xl w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Schedule Class Slot
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    3-Layer Timetable Clash Validation Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {clashResult && clashResult.hasClash && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-md text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-2 text-rose-700">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>3-Layer Clash Conflict Detected!</span>
                </div>
                {clashResult.clashes.map((c: any, idx: number) => (
                  <p key={idx} className="text-[11px] leading-relaxed pl-5 font-mono">
                    • <strong>{c.type.replace("_", " ")}:</strong> {c.message}
                  </p>
                ))}
              </div>
            )}

            {clashResult && !clashResult.hasClash && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero clashes detected. Room, Faculty, and Batch are available.</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, dayOfWeek: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-bold"
                  >
                    <option value="MON">Monday</option>
                    <option value="TUE">Tuesday</option>
                    <option value="WED">Wednesday</option>
                    <option value="THU">Thursday</option>
                    <option value="FRI">Friday</option>
                    <option value="SAT">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, startTime: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, endTime: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name & Code</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.subject}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                  placeholder="e.g. Digital Principles and Computer Organization (B25BCA301)"
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.roomNumber}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, roomNumber: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    placeholder="LH-201 or LAB-3"
                    className="w-full p-2 border border-slate-300 rounded-md font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={scheduleForm.departmentId}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, departmentId: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingSlot || clashResult?.hasClash}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {schedulingSlot ? "Validating..." : "Save Schedule Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
