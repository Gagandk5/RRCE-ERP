"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Layers,
  Sparkles,
  Users,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

export default function FacultyPortal() {
  const [activeTab, setActiveTab] = useState<"rollcall" | "timetable">("rollcall");
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  // New Class Scheduling Modal & 3-Layer Clash Detection State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: "MON",
    startTime: "09:00",
    endTime: "10:00",
    subject: "Discrete Mathematics (25BC101)",
    departmentId: "",
    semester: 1,
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
      // 1. Fetch departments
      const dRes = await fetch("/api/departments");
      if (dRes.ok) {
        const d = await dRes.json();
        setDepartments(d.departments || []);
        if (d.departments?.length > 0 && !scheduleForm.departmentId) {
          setScheduleForm((prev) => ({ ...prev, departmentId: d.departments[0].id }));
        }
      }

      // 2. Fetch BCA students (Invariant 2: strictly ordered by usnSequence ASC)
      const stRes = await fetch("/api/students?dept=BCA");
      if (stRes.ok) {
        const stData = await stRes.json();
        const roster = stData.students || [];
        setStudents(roster);

        // Initialize all as PRESENT by default
        const initMap: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
        roster.forEach((s: any) => {
          initMap[s.id] = "PRESENT";
        });
        setAttendanceMap(initMap);
      }

      // 3. Fetch attendance sessions
      const sessRes = await fetch("/api/attendance/session?dept=BCA");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const sessList = sessData.sessions || [];
        setSessions(sessList);
        if (sessList.length > 0) {
          setSelectedSessionId(sessList[0].id);
        }
      }

      // 4. Fetch timetable
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

  // Live 3-Layer Clash Detection Check
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

  // Handle Timetable Slot Submission
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
          text: "Class scheduled successfully! Zero scheduling conflicts detected by 3-Layer Clash Engine.",
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

  // Toggle individual student attendance status
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

  // Save Attendance to Server (Enforces Invariant 4: 24h Lockout)
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-900/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 border border-emerald-400/30">
              Teaching Faculty Portal
            </div>
            <h1 className="text-2xl font-black text-white">Faculty Class & Attendance Desk</h1>
            <p className="text-xs text-emerald-200/80">
              Prof. Sunitha Sharma (Mathematics) • 3-Layer Clash Engine • VTU Roll-Call
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Class Slot</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : message.type === "warning"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-red-50 text-red-800 border-red-200"
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
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("rollcall")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "rollcall"
              ? "text-emerald-600 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Daily Roll-Call Marker (Ordered by usnSequence ASC)
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "timetable"
              ? "text-emerald-600 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Weekly Timetable & 3-Layer Clash Engine
        </button>
      </div>

      {/* TAB 1: DAILY ROLL-CALL MARKER */}
      {activeTab === "rollcall" && (
        <div className="space-y-6">
          {/* Session Selector & Lockout Indicator Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 shrink-0">
                Select Session:
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.subject} ({new Date(sess.date).toLocaleDateString("en-GB")})
                  </option>
                ))}
              </select>
            </div>

            {/* 24-Hour Lockout Status Badge */}
            <div className="flex items-center gap-3">
              {currentSession && (
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Submit Attendance"}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics & Batch Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-slate-500 font-medium">Total: <strong>{students.length}</strong></span>
              <span className="text-emerald-700 font-bold">Present: {presentCount}</span>
              <span className="text-red-700 font-bold">Absent: {absentCount}</span>
              <span className="text-amber-700 font-bold">Late: {lateCount}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => markAll("PRESENT")}
                disabled={isSessionLocked}
                className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg font-bold text-[11px] disabled:opacity-50"
              >
                Mark All Present
              </button>
              <button
                onClick={() => markAll("ABSENT")}
                disabled={isSessionLocked}
                className="px-3 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-lg font-bold text-[11px] disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Roll-Call Grid / Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Official BCA 2025 Roll-Call (Guaranteed usnSequence ASC)
              </span>
              <span className="text-[11px] text-slate-500">
                Click P, A, or L to set status
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
                    <th className="py-2.5 px-4 text-right">Quick Toggles</th>
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
                            ? "bg-red-50/40"
                            : currentStatus === "LATE"
                            ? "bg-amber-50/40"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-400">
                          #{String(st.usnSequence).padStart(3, "0")}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-extrabold text-blue-700">
                          {st.usn}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {st.user?.firstName} {st.user?.lastName}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : currentStatus === "ABSENT"
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
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
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
                                currentStatus === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-slate-100 hover:bg-emerald-100 text-emerald-800 border border-slate-200"
                              }`}
                            >
                              P
                            </button>
                            <button
                              disabled={isSessionLocked}
                              onClick={() => toggleStatus(st.id, "ABSENT")}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
                                currentStatus === "ABSENT"
                                  ? "bg-red-600 text-white shadow-sm"
                                  : "bg-slate-100 hover:bg-red-100 text-red-800 border border-slate-200"
                              }`}
                            >
                              A
                            </button>
                            <button
                              disabled={isSessionLocked}
                              onClick={() => toggleStatus(st.id, "LATE")}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
                                currentStatus === "LATE"
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : "bg-slate-100 hover:bg-amber-100 text-amber-800 border border-slate-200"
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

      {/* TAB 2: TIMETABLE & 3-LAYER CLASH ENGINE */}
      {activeTab === "timetable" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Weekly Class Timetable (BCA Semester 1)
                </h2>
                <p className="text-xs text-slate-500">
                  Protected by the 3-Layer Clash Engine: Faculty Clash • Room Clash • Batch Clash
                </p>
              </div>

              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Class Slot (Clash Tested)</span>
              </button>
            </div>

            {/* Timetable Slot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {timetableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px]">
                      {slot.dayOfWeek} • {slot.startTime} - {slot.endTime}
                    </span>
                    <span className="font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                      {slot.roomNumber}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{slot.subject}</h3>

                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-0.5">
                    <p>Faculty: Prof. {slot.faculty?.firstName} {slot.faculty?.lastName}</p>
                    <p>Batch: {slot.department?.code} Sem {slot.semester} (Sec {slot.section})</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3-LAYER CLASH ENGINE SCHEDULING MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Schedule Class Slot
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validated simultaneously by the 3-Layer Clash Engine
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

            {/* Real-Time Clash Alert Banner */}
            {clashResult && clashResult.hasClash && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-900 border border-red-200 rounded-2xl text-xs space-y-2">
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
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs flex items-center gap-2 font-semibold">
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
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
                  placeholder="e.g. Discrete Mathematics (25BC101)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
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
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
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
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingSlot || clashResult?.hasClash}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
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
