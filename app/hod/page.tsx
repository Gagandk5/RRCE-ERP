"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Search,
  Clock,
  GraduationCap,
} from "lucide-react";

export default function HODPortal() {
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"attendance" | "students" | "faculty">("attendance");

  useEffect(() => {
    loadHODData();
  }, []);

  async function loadHODData() {
    setLoading(true);
    try {
      const stRes = await fetch("/api/students?dept=BCA");
      if (stRes.ok) {
        const stData = await stRes.json();
        setStudents(stData.students || []);
      }

      const sessRes = await fetch("/api/attendance/session?dept=BCA");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load HOD data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleHODUnlock(sessionId: string) {
    setUnlockingId(sessionId);
    setMessage(null);
    try {
      const res = await fetch("/api/attendance/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reason: "HOD BCA Authorization: Permission granted for attendance record reconciliation.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("HOD Override Granted: Attendance session unlocked! Faculty may now edit records.");
        await loadHODData();
      } else {
        setMessage(data.error || "Failed to unlock session.");
      }
    } catch {
      setMessage("Error sending unlock request.");
    } finally {
      setUnlockingId(null);
    }
  }

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    return s.usn.toLowerCase().includes(term) || fullName.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Clean Solid Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-xl p-6 md:p-8 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider mb-1 border border-slate-700">
              Department Directorate
            </div>
            <h1 className="text-xl font-bold text-white">Department of Computer Applications (BCA)</h1>
            <p className="text-xs text-slate-400">
              Dr. Praveen Gowda, HOD • Autonomous Academic Oversight
            </p>
          </div>
        </div>

        <button
          onClick={loadHODData}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-400" : ""}`} />
          Refresh Status
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              BCA Class Strength (2025)
            </span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {students.length} <span className="text-xs font-normal text-slate-400">Students</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Roster: 1RR25BC001 - 1RR25BC057
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              24-Hour Lockout Status
            </span>
            <Lock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {sessions.filter((s) => s.lockoutStatus?.isLocked && !s.isLockedOverride).length} Locked
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sessions requiring HOD unlock override
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current Semester
            </span>
            <GraduationCap className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            Semester 1 <span className="text-xs font-normal text-slate-400">Section A</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Academic Year: 2025-2026
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "attendance"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          Attendance Sessions & 24h Lockout Engine
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "students"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Student Roll-Call Roster ({students.length})
        </button>

        <button
          onClick={() => setActiveTab("faculty")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "faculty"
              ? "text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Faculty Workload & Subjects
        </button>
      </div>

      {activeTab === "attendance" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                BCA Attendance Sessions & Lockout Controls
              </h2>
              <p className="text-xs text-slate-500">
                Invariant 4: Sessions lock 24 hours after creation. Requires HOD or Principal override to unlock.
              </p>
            </div>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded">
              HOD Authority: Override Allowed
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No attendance sessions created yet.
              </p>
            ) : (
              sessions.map((session) => {
                const isLocked = session.lockoutStatus?.isLocked && !session.isLockedOverride;
                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      session.isLockedOverride
                        ? "bg-emerald-50 border-emerald-200"
                        : isLocked
                        ? "bg-amber-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{session.subject}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              session.isLockedOverride
                                ? "bg-emerald-100 text-emerald-800"
                                : isLocked
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {session.isLockedOverride
                              ? "Unlocked (HOD Override Active)"
                              : isLocked
                              ? "Locked (24-Hour Exceeded)"
                              : "Active (Within 24h Window)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Faculty: Prof. {session.faculty?.firstName} {session.faculty?.lastName} • BCA Sem {session.semester} ({session.section}) • Date: {new Date(session.date).toLocaleDateString("en-GB")}
                        </p>
                      </div>

                      <div>
                        {isLocked ? (
                          <button
                            onClick={() => handleHODUnlock(session.id)}
                            disabled={unlockingId === session.id}
                            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>{unlockingId === session.id ? "Unlocking..." : "HOD Unlock Override"}</span>
                          </button>
                        ) : session.isLockedOverride ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Unlocked for Faculty Edit
                          </span>
                        ) : (
                          <span className="text-xs text-slate-700 font-medium">
                            {session.lockoutStatus?.formattedRemaining || "Within edit window"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                BCA Class 2025 Roster (Ordered by usnSequence ASC)
              </h2>
              <p className="text-xs text-slate-500">
                Official VTU roll-call order from 1RR25BC001 to 1RR25BC057
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search USN or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Roll Seq</th>
                  <th className="py-2.5 px-4">USN</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Quota</th>
                  <th className="py-2.5 px-4">Date of Birth</th>
                  <th className="py-2.5 px-4">Mobile</th>
                  <th className="py-2.5 px-4">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-400">
                      #{String(st.usnSequence).padStart(3, "0")}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {st.usn}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {st.user?.firstName} {st.user?.lastName}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {st.quota}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">
                      {new Date(st.dateOfBirth).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono">
                      {st.user?.phone || "-"}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      Sem {st.currentSemester} (Sec A)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "faculty" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Department Faculty & Subject Allocation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Dr. Praveen Gowda (HOD)</h3>
              <p className="text-slate-500">Professor & Head, BCA Department</p>
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                <p><strong>Subjects Assigned:</strong></p>
                <p className="text-slate-800 font-medium">• Problem Solving with C (25BC102)</p>
                <p className="text-slate-800 font-medium">• C Programming Laboratory (25BCL16)</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Prof. Sunitha Sharma</h3>
              <p className="text-slate-500">Associate Professor, Department of Basic Sciences</p>
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                <p><strong>Subjects Assigned:</strong></p>
                <p className="text-slate-800 font-medium">• Discrete Mathematics (25BC101)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
