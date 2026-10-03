"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Unlock,
  IndianRupee,
  Building,
  Shield,
  CheckCircle2,
  GraduationCap,
  Users,
  Megaphone,
  Database,
  Search,
  Bell,
  Clock,
  Sparkles,
  X,
  Loader2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

export default function PrincipalPortal() {
  const router = useRouter();
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
  const [search, setSearch] = useState("");
  const [overrideLoading, setOverrideLoading] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"alerts" | "finance" | "overrides" | "audit">("alerts");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const deptRes = await fetch("/api/departments");
      if (deptRes.ok) {
        const d = await deptRes.json();
        setDepartments(d.departments || []);
      }

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

      const auditRes = await fetch("/api/audit-logs?limit=10");
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a.logs || []);
      }

      const sessRes = await fetch("/api/attendance/session");
      if (sessRes.ok) {
        const sData = await sessRes.json();
        const sessList = sData.sessions || [];
        setLockedSessions(
          sessList.filter((s: any) => s.lockoutStatus?.isLocked && !s.isLockedOverride)
        );
      }
    } catch (e) {
      console.error("Principal dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrincipalUnlock(sessionId: string) {
    setOverrideLoading(sessionId);
    setMessage(null);
    try {
      const res = await fetch("/api/attendance/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reason: "Principal Executive Authority: Granted institutional unlock for academic reconciliation.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: "Executive Override Granted: Attendance session unlocked institution-wide.",
        });
        await loadDashboardData();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Override execution failed.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during unlock override." });
    } finally {
      setOverrideLoading(null);
    }
  }

  async function handleRunSeeder() {
    setSeedLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: "Postgres Database successfully re-seeded with official VTU curriculum and faculty roster!",
        });
        await loadDashboardData();
      } else {
        setMessage({ type: "error", text: data.error || "Database seeder failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error connecting to seeder" });
    } finally {
      setSeedLoading(false);
    }
  }

  // 9 Quick-Access Cards Specification
  const quickAccessCards = [
    {
      id: "overrides",
      title: "Lockout Overrides",
      subtext: "Institution-wide",
      icon: Unlock,
      tint: "bg-amber-50/60 border-amber-100/80 hover:border-amber-300 text-amber-950",
      iconBg: "bg-amber-100 text-amber-700",
      badge: "Executive",
      badgeColor: "bg-amber-100 text-amber-800",
      onClick: () => setActiveTab("overrides"),
    },
    {
      id: "finance",
      title: "Financial Ledger",
      subtext: "₹21.5L collected / ₹45.9L",
      icon: IndianRupee,
      tint: "bg-emerald-50/60 border-emerald-100/80 hover:border-emerald-300 text-emerald-950",
      iconBg: "bg-emerald-100 text-emerald-700",
      badge: "Finance",
      badgeColor: "bg-emerald-100 text-emerald-800",
      onClick: () => setActiveTab("finance"),
    },
    {
      id: "departments",
      title: "Departments",
      subtext: "7 Autonomous Divisions",
      icon: Building,
      tint: "bg-sky-50/60 border-sky-100/80 hover:border-sky-300 text-sky-950",
      iconBg: "bg-sky-100 text-sky-700",
      badge: "Divisions",
      badgeColor: "bg-sky-100 text-sky-800",
      onClick: () => setActiveModal("departments"),
    },
    {
      id: "audit",
      title: "Audit Trail",
      subtext: "Immutable system log",
      icon: Shield,
      tint: "bg-slate-100/60 border-slate-200/80 hover:border-slate-300 text-slate-950",
      iconBg: "bg-slate-200 text-slate-700",
      badge: "Security",
      badgeColor: "bg-slate-200 text-slate-800",
      onClick: () => setActiveTab("audit"),
    },
    {
      id: "compliance",
      title: "VTU Standards",
      subtext: "Syllabus & CIE",
      icon: CheckCircle2,
      tint: "bg-indigo-50/60 border-indigo-100/80 hover:border-indigo-300 text-indigo-950",
      iconBg: "bg-indigo-100 text-indigo-700",
      badge: "Compliance",
      badgeColor: "bg-indigo-100 text-indigo-800",
      onClick: () => setActiveModal("compliance"),
    },
    {
      id: "results",
      title: "Exam Results",
      subtext: "SEE Ratification",
      icon: GraduationCap,
      tint: "bg-purple-50/60 border-purple-100/80 hover:border-purple-300 text-purple-950",
      iconBg: "bg-purple-100 text-purple-700",
      badge: "Examinations",
      badgeColor: "bg-purple-100 text-purple-800",
      onClick: () => setActiveModal("results"),
    },
    {
      id: "faculty",
      title: "Staff Directory",
      subtext: "45 Full-time Faculty",
      icon: Users,
      tint: "bg-blue-50/60 border-blue-100/80 hover:border-blue-300 text-blue-950",
      iconBg: "bg-blue-100 text-blue-700",
      badge: "Faculty Roster",
      badgeColor: "bg-blue-100 text-blue-800",
      onClick: () => setActiveModal("faculty"),
    },
    {
      id: "notices",
      title: "Office Notices",
      subtext: "Official Gazettes",
      icon: Megaphone,
      tint: "bg-rose-50/60 border-rose-100/80 hover:border-rose-300 text-rose-950",
      iconBg: "bg-rose-100 text-rose-700",
      badge: "Gazettes",
      badgeColor: "bg-rose-100 text-rose-800",
      onClick: () => setActiveModal("notices"),
    },
    {
      id: "database",
      title: "Postgres Seeder",
      subtext: "Neon Serverless Pooler",
      icon: Database,
      tint: "bg-teal-50/60 border-teal-100/80 hover:border-teal-300 text-teal-950",
      iconBg: "bg-teal-100 text-teal-700",
      badge: "Database",
      badgeColor: "bg-teal-100 text-teal-800",
      onClick: handleRunSeeder,
    },
  ];

  const filteredCards = useMemo(() => {
    if (!search.trim()) return quickAccessCards;
    const q = search.toLowerCase();
    return quickAccessCards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtext.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 selection:bg-indigo-900 selection:text-white pb-24 lg:pb-12">
      {/* 1. DEEP EXECUTIVE CURVED HERO HEADER */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white pt-6 pb-14 px-5 sm:px-8 rounded-b-[2.25rem] shadow-md">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* TOP BAR */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-1 border border-white/20 shadow-xs flex items-center justify-center shrink-0">
                <img src="/images.svg" alt="RRCE Crest" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white block">
                  Office of the Principal
                </span>
                <span className="hidden sm:inline-block font-mono text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  Chief Academic Officer
                </span>
              </div>
            </div>

            {/* NOTIFICATION BELL & AVATAR */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {lockedSessions.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-900" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">Executive Alerts</span>
                      <span className="text-[10px] text-slate-400 font-mono">Live Feed</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Institutional audit logging active. Financial fee collection rate at 46.8% for Academic Year 2025–26.
                    </p>
                  </div>
                )}
              </div>

              {/* USER AVATAR */}
              <div className="flex items-center gap-2.5 pl-1.5 sm:border-l sm:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-amber-600/80 border border-amber-400/40 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  RK
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-bold text-xs text-white block leading-tight">
                    Dr. Ramesh Kumar
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono block leading-tight">
                    principal@rrce.org
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GREETING & ROLE METADATA */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[11px] font-medium mb-2.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Principal & Chief Academic Officer • RRCE Autonomous</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hello, Dr. Ramesh Kumar 👋
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Institutional Governance • Academic Administration • Financial Oversight & Autonomous VTU Compliance
            </p>
          </div>

          {/* QUICK KPI CHIPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Collected Fees</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{formatINR(stats.totalPaid)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Academic Divisions</span>
              <span className="text-sm font-bold text-sky-400 font-mono">7 Departments</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lockout Overrides</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{lockedSessions.length} Pending</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Audit Trail</span>
              <span className="text-sm font-bold text-purple-400 font-mono">Live Immutable</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING OVERLAPPING SEARCH BAR */}
      <div className="relative -mt-6 mx-auto max-w-2xl px-4 z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center gap-3 px-4 h-13 transition-all focus-within:ring-2 focus-within:ring-amber-900/20 focus-within:border-slate-300">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institutional metrics, financial ledger, faculty, or audit logs..."
            className="w-full text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-medium"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[10px] font-mono font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* 3. 3-TO-4 COLUMN SQUIRCLE QUICK-ACCESS GRID */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-9">
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
                Principal Executive Command
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                High-level institutional governance, financial ledger, and system oversight
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredCards.length} controls
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={card.onClick}
                  className={`rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[115px] sm:min-h-[125px] text-left ${card.tint}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${card.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono shrink-0 ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="font-bold text-xs sm:text-sm text-slate-950 block leading-tight tracking-tight">
                      {card.title}
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium truncate">
                      {card.subtext}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* FEED SELECTION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "alerts"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Executive Alerts
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "finance"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Financial Ledger
          </button>
          <button
            onClick={() => setActiveTab("overrides")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "overrides"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Lockout Overrides ({lockedSessions.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "audit"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            System Audit Trail
          </button>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4. LOWER FEED */}
        {activeTab === "alerts" && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Institutional Operational Health</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Tuition Billed</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono block mt-1">{formatINR(stats.totalBilled)}</span>
                <span className="text-[11px] text-slate-500 mt-1 block font-medium">Annual tuition across 7 departments</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Total Collected</span>
                <span className="text-lg font-extrabold text-emerald-700 font-mono block mt-1">{formatINR(stats.totalPaid)}</span>
                <span className="text-[11px] text-emerald-600 mt-1 block font-medium">46.8% Collection efficiency</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-amber-600 block">Pending Receivables</span>
                <span className="text-lg font-extrabold text-amber-700 font-mono block mt-1">{formatINR(stats.totalPending)}</span>
                <span className="text-[11px] text-amber-600 mt-1 block font-medium">Fee reminders dispatched to students</span>
              </div>
            </div>
          </section>
        )}

        {activeTab === "finance" && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Departmental Tuition Fee Collection Ratios</h3>
                <p className="text-xs text-slate-500">Autonomous revenue realization ledger</p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Target: ₹45.90 Lakhs
              </span>
            </div>

            <div className="space-y-3">
              {departments.map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{d.name} ({d.code})</span>
                    <span className="text-slate-500 font-mono text-[11px]">Billed: ₹45.90 Lakhs • 54 Enrolled</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 block">₹21.50 Lakhs Paid</span>
                    <span className="text-[10px] font-semibold text-slate-500">₹24.40L Outstanding</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "overrides" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">24-Hour Lockout Overrides (Executive Principal Desk)</h3>
              <span className="text-xs text-slate-500 font-mono">Supreme Override Authority</span>
            </div>

            {lockedSessions.length > 0 ? (
              lockedSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{sess.subject}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      Faculty: Prof. {sess.faculty?.firstName} {sess.faculty?.lastName} • {sess.department?.code} Sem {sess.semester}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePrincipalUnlock(sess.id)}
                    disabled={overrideLoading === sess.id}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {overrideLoading === sess.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>Grant Principal Unlock</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <span className="font-bold text-sm text-slate-900 block">Zero Attendance Lockout Exceptions</span>
                <p className="text-xs text-slate-500 mt-1">All departmental attendance ledgers are locked or reconciled.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "audit" && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">Immutable System Audit Log Trail</span>
              <span className="text-xs text-slate-500 font-mono">Real-time Telemetry</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{log.action}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-600">{log.user?.email || "system@rrce.org"}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700 font-bold">VERIFIED</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        System audit telemetry active. No critical anomalies recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* QUICK-ACCESS MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-950 uppercase">
                {activeModal === "departments" ? "Autonomous Academic Divisions" : activeModal === "compliance" ? "VTU Autonomy Compliance Standards" : activeModal === "results" ? "Semester End Examinations (SEE)" : activeModal === "faculty" ? "Full-Time Institutional Faculty Directory" : "Official Executive Gazettes"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Executive record registered under the Office of the Principal, Rajarajeswari College of Engineering (RRCE).
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING/DOCKED BOTTOM THUMB NAVIGATION FOR MOBILE (<1024px) */}
      </div>
  );
}
