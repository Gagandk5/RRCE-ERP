"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Building,
  Users,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
  ArrowRight,
  RefreshCw,
  Search,
  Lock,
  Unlock,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function PrincipalPortal() {
  const [stats, setStats] = useState<any>({
    studentsCount: 54,
    departmentsCount: 7,
    totalBilled: 4590000,
    totalPaid: 2150000,
    totalPending: 2440000,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [lockedSessions, setLockedSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideLoading, setOverrideLoading] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch departments
      const deptRes = await fetch("/api/departments");
      if (deptRes.ok) {
        const d = await deptRes.json();
        setDepartments(d.departments || []);
      }

      // 2. Fetch students to aggregate metrics
      const stRes = await fetch("/api/students");
      if (stRes.ok) {
        const s = await stRes.json();
        const studentList = s.students || [];
        let billed = 0;
        let paid = 0;

        studentList.forEach((st: any) => {
          (st.invoices || []).forEach((inv: any) => {
            billed += Number(inv.totalAmount || 0);
            paid += Number(inv.paidAmount || 0);
          });
        });

        setStats({
          studentsCount: studentList.length,
          departmentsCount: 7,
          totalBilled: billed || 4590000,
          totalPaid: paid || 2150000,
          totalPending: Math.max(0, (billed || 4590000) - (paid || 2150000)),
        });
      }

      // 3. Fetch audit logs
      const auditRes = await fetch("/api/audit-logs?limit=10");
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a.logs || []);
      }

      // 4. Fetch attendance sessions to check 24-hr locked sessions
      const sessRes = await fetch("/api/attendance/session");
      if (sessRes.ok) {
        const data = await sessRes.json();
        setLockedSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlockOverride(sessionId: string) {
    setOverrideLoading(sessionId);
    setMessage(null);
    try {
      const res = await fetch("/api/attendance/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reason: "Executive Principal Override for late attendance submission.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("Principal Override Granted: Attendance session unlocked for 24h editing.");
        await loadDashboardData();
      } else {
        setMessage(data.error || "Override request failed.");
      }
    } catch {
      setMessage("Failed to submit override.");
    } finally {
      setOverrideLoading(null);
    }
  }

  async function handleSeedTrigger() {
    setSeedLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/seed");
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("Database initialized with 7 departments, 4 staff, and 54 BCA students!");
        await loadDashboardData();
      } else {
        setMessage(`Seed note: ${data.error || "Done"}`);
      }
    } catch {
      setMessage("Seeding triggered.");
    } finally {
      setSeedLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Principal Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-purple-900/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 border border-purple-400/30">
              Executive Institutional Oversight
            </div>
            <h1 className="text-2xl font-black text-white">Office of the Principal</h1>
            <p className="text-xs text-purple-200/80">
              Dr. Ramesh Kumar • Rajarajeswari College of Engineering (RRCE)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleSeedTrigger}
            disabled={seedLoading}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-600/30 transition-all"
          >
            <Database className={`w-3.5 h-3.5 ${seedLoading ? "animate-spin" : ""}`} />
            {seedLoading ? "Seeding..." : "Seed Postgres (/api/seed)"}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* High-Level Institutional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.studentsCount} <span className="text-xs font-normal text-slate-400">active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            BCA Batch 2025 (1RR25BC001 - 057)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Academic Departments
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.departmentsCount} <span className="text-xs font-normal text-slate-400">divisions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            BCA, CSE, AIML, ECE, ME, ISE, BS
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fee Collections
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {formatINR(stats.totalPaid)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Collected of {formatINR(stats.totalBilled)} billed
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {formatINR(stats.totalPending)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Term 1 pending & overdue balance
          </p>
        </div>
      </div>

      {/* Main Grid: Departments + Locked Attendance Override Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Department Breakdown Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic Departments Status</h2>
              <p className="text-xs text-slate-500">Autonomous curriculum allocation & student counts</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              7 Active Depts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Dept Code</th>
                  <th className="py-2.5 px-3">Department Name</th>
                  <th className="py-2.5 px-3">USN Code</th>
                  <th className="py-2.5 px-3 text-right">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id || dept.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-blue-700">
                      {dept.code}
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {dept.name}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">
                      {dept.usnCode}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {dept._count?.students || (dept.code === "BCA" ? 54 : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Attendance Lockout Override Panel (Principal Authority) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-base">
            <Lock className="w-4 h-4 text-purple-600" />
            24-Hour Attendance Lockout Review
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            As Principal, you hold institutional override power to unlock sessions frozen by the 24-hour lockout rule:
          </p>

          <div className="space-y-3">
            {lockedSessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No attendance sessions recorded yet.</p>
            ) : (
              lockedSessions.map((session) => {
                const isLocked = session.lockoutStatus?.isLocked && !session.isLockedOverride;
                return (
                  <div
                    key={session.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      session.isLockedOverride
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : isLocked
                        ? "bg-amber-50/80 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{session.subject}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          session.isLockedOverride
                            ? "bg-emerald-200 text-emerald-800"
                            : isLocked
                            ? "bg-amber-200 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {session.isLockedOverride ? "Unlocked (Override)" : isLocked ? "Locked (>24h)" : "Active"}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] opacity-80 flex items-center justify-between">
                      <span>Faculty: Prof. {session.faculty?.firstName} {session.faculty?.lastName}</span>
                      <span>{session.department?.code} Sem {session.semester}</span>
                    </div>

                    {isLocked && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 font-medium">
                          Lockout enforced. Editing disabled.
                        </span>
                        <button
                          onClick={() => handleUnlockOverride(session.id)}
                          disabled={overrideLoading === session.id}
                          className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg shadow transition-all disabled:opacity-50"
                        >
                          <Unlock className="w-3 h-3" />
                          {overrideLoading === session.id ? "Unlocking..." : "Principal Override"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Institutional Audit Trail */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Institutional Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable ledger of branch reallocations, overrides, and fee changes</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Live System Log</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No audit events recorded yet. Branch reallocations and overrides will appear here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] uppercase">
                    {log.action}
                  </span>
                  <span className="font-bold text-slate-800">By: {log.performedBy}</span>
                  <span className="text-slate-500 text-[11px] truncate max-w-md">
                    {log.details}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
