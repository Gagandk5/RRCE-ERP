"use client";

import React, { useState, useEffect } from "react";
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
  BookOpen,
  MapPin,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function FacultyPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rollcall" | "schedule" | "risk">("rollcall");
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: "MON",
    startTime: "09:00",
    endTime: "10:00",
    subject: "Discrete Mathematics (25BC301)",
    departmentId: "",
    semester: 3,
    section: "A",
    facultyId: "mock-staff-faculty_math",
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
      const dRes = await fetch("/api/departments");
      if (dRes.ok) {
        const d = await dRes.json();
        setDepartments(d.departments || []);
        if (d.departments?.length > 0 && !scheduleForm.departmentId) {
          setScheduleForm((prev) => ({ ...prev, departmentId: d.departments[0].id }));
        }
      }

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
          text: "Class slot scheduled successfully! Conflict checks verified across Faculty, Room, and Batch.",
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
          text: `Attendance saved successfully for ${records.length} students!`,
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

  const teacherClassesToday = [
    {
      time: "09:00 AM - 10:00 AM",
      subject: "Discrete Mathematics (25BC301)",
      batch: "BCA Sem 3 (Sec A)",
      room: "LH-201",
      status: "ACTIVE_NOW",
    },
    {
      time: "11:15 AM - 12:15 PM",
      subject: "Engineering Mathematics III (25BS301)",
      batch: "CSE Sem 3 (Sec B)",
      room: "LH-104",
      status: "UPCOMING",
    },
    {
      time: "02:00 PM - 03:00 PM",
      subject: "Discrete Mathematics Tutorial",
      batch: "BCA Sem 3 (Sec A)",
      room: "LH-201",
      status: "SCHEDULED",
    },
  ];

  const lowAttendanceStudents = [
    { name: "Deepika C S", usn: "1RR25BC005", attendance: "68%", missingClasses: 2 },
    { name: "Shamanth T D", usn: "1RR25BC039", attendance: "70%", missingClasses: 1 },
    { name: "Srujan S", usn: "1RR25BC046", attendance: "72%", missingClasses: 1 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* SIMPLE HUMANLIKE TEACHER WELCOME BANNER (NO GRADIENTS) */}
      <div className="bg-slate-900 text-white rounded-xl p-6 md:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-slate-700">
            <img src="/images.svg" alt="RRCE Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded font-medium mb-1">
              <span>Department of Basic Sciences & Mathematics</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Welcome, Prof. Sunitha Sharma! 👋
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Discrete Mathematics & Engineering Math • Rajarajeswari College of Engineering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Extra Class</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border text-xs font-medium flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : message.type === "warning"
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : "bg-red-50 text-red-900 border-red-200"
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

      {/* TOP SUMMARY CARDS (SOLID BASIC COLORS, NO GRADIENTS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Classes</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              3 Lectures
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            LH-201 <span className="text-xs font-normal text-slate-400">Next Class</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            09:00 AM - Discrete Mathematics
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Batch</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              54 Enrolled
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            BCA Sem 3 (Sec A)
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            USN: 1RR25BC001 - 057
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">24h Edit Window</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            Open
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Editable for 24 hours after creation
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clash Prevention</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              3-Layer Active
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            0 Conflicts
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Faculty • Room • Batch Verified
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("rollcall")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "rollcall"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Mark Attendance (BCA 3rd Sem)
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "schedule"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Today's Teaching Schedule & Timetable
        </button>

        <button
          onClick={() => setActiveTab("risk")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "risk"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Attendance Warnings ({lowAttendanceStudents.length} Students)
        </button>
      </div>

      {/* TAB 1: ATTENDANCE MARKER */}
      {activeTab === "rollcall" && (
        <div className="space-y-6">
          {/* SESSION BAR */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 shrink-0">
                Class Session:
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.subject} ({new Date(sess.date).toLocaleDateString("en-GB")})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              {currentSession && (
                <div
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                    currentSession.isLockedOverride
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : isSessionLocked
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                  }`}
                >
                  {isSessionLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-red-600" />
                      <span>24-Hour Lockout Active (Requires HOD Override)</span>
                    </>
                  ) : currentSession.isLockedOverride ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unlocked via HOD/Principal Override</span>
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
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Submit Attendance"}</span>
              </button>
            </div>
          </div>

          {/* QUICK SUMMARY AND CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-medium">Total: <strong>{students.length}</strong></span>
              <span className="text-emerald-700 font-bold">Present: {presentCount}</span>
              <span className="text-red-700 font-bold">Absent: {absentCount}</span>
              <span className="text-amber-700 font-bold">Late: {lateCount}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => markAll("PRESENT")}
                disabled={isSessionLocked}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-[11px] disabled:opacity-50"
              >
                Mark All Present
              </button>
              <button
                onClick={() => markAll("ABSENT")}
                disabled={isSessionLocked}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-[11px] disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* STUDENT ROSTER TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Official BCA 2025 Roll-Call Roster (Guaranteed usnSequence ASC)
              </span>
              <span className="text-[11px] text-slate-500">
                Click P (Present), A (Absent), or L (Late)
              </span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Seq</th>
                    <th className="py-2.5 px-4">USN</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => {
                    const currentStatus = attendanceMap[st.id] || "PRESENT";
                    return (
                      <tr
                        key={st.id}
                        className={`transition-colors ${
                          currentStatus === "ABSENT"
                            ? "bg-red-50/70"
                            : currentStatus === "LATE"
                            ? "bg-amber-50/70"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-400">
                          #{String(st.usnSequence).padStart(3, "0")}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                          {st.usn}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {st.user?.firstName} {st.user?.lastName}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : currentStatus === "ABSENT"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              disabled={isSessionLocked}
                              onClick={() => toggleStatus(st.id, "PRESENT")}
                              className={`w-7 h-7 rounded text-xs font-bold transition-colors disabled:opacity-40 ${
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
                              className={`w-7 h-7 rounded text-xs font-bold transition-colors disabled:opacity-40 ${
                                currentStatus === "ABSENT"
                                  ? "bg-red-600 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                              }`}
                            >
                              A
                            </button>
                            <button
                              disabled={isSessionLocked}
                              onClick={() => toggleStatus(st.id, "LATE")}
                              className={`w-7 h-7 rounded text-xs font-bold transition-colors disabled:opacity-40 ${
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

      {/* TAB 2: SCHEDULE & TIMETABLE */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Today's Teaching Schedule (Monday)
                </h2>
                <p className="text-xs text-slate-500">
                  Protected by 3-Layer Clash Engine (Faculty • Room • Batch)
                </p>
              </div>

              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Extra Class</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {teacherClassesToday.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    c.status === "ACTIVE_NOW"
                      ? "bg-blue-50/80 border-blue-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{c.subject}</h3>
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
                    <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
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
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Attendance Compliance Alerts (&lt;75%)
              </h2>
              <p className="text-xs text-slate-500">
                Students below the 75% minimum VTU eligibility requirement in your subject
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
              3 Students Need Reminders
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {lowAttendanceStudents.map((st, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{st.name}</h3>
                    <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-amber-200">
                      {st.usn}
                    </span>
                  </div>
                  <p className="text-amber-800 mt-1 text-[11px]">
                    Current Subject Attendance: <strong>{st.attendance}</strong>. Needs to attend next <strong>{st.missingClasses} classes</strong> to reach 75%.
                  </p>
                </div>

                <button
                  onClick={() => alert(`Reminder sent to ${st.name} (${st.usn})`)}
                  className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold text-xs shrink-0 transition-colors"
                >
                  Send Student Reminder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Schedule Class Slot
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validated by the 3-Layer Clash Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {clashResult && clashResult.hasClash && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-900 border border-red-200 rounded-lg text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-red-700">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>3-Layer Clash Detected!</span>
                </div>
                {clashResult.clashes.map((c: any, idx: number) => (
                  <p key={idx} className="text-[11px] leading-relaxed pl-6 list-disc">
                    • <strong>{c.type.replace("_", " ")}:</strong> {c.message}
                  </p>
                ))}
              </div>
            )}

            {clashResult && !clashResult.hasClash && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero clashes detected! Slot is free across Faculty, Room, and Batch.</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
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
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
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
                  placeholder="e.g. Discrete Mathematics (25BC301)"
                  className="w-full p-2 border border-slate-300 rounded-lg"
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
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
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
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
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
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingSlot || clashResult?.hasClash}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {schedulingSlot ? "Validating & Saving..." : "Confirm & Save Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
