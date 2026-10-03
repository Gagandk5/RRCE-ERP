"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Unlock,
  Users,
  UserCheck,
  Layers,
  Award,
  AlertTriangle,
  FileText,
  Megaphone,
  BarChart3,
  Search,
  Bell,
  Clock,
  CheckCircle2,
  CalendarDays,
  Lock,
  ArrowRight,
  Shield,
  X,
  Loader2,
  MapPin,
  Sparkles,
  RefreshCw,
  LogOut,
  GraduationCap,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function HODPortal() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"overrides" | "students" | "faculty" | "alerts">("overrides");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

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
        setMessage({
          text: "HOD Override Granted: Attendance session unlocked! Faculty may now edit records.",
          type: "success",
        });
        await loadHODData();
      } else {
        setMessage({
          text: data.error || "Failed to unlock attendance session.",
          type: "error",
        });
      }
    } catch {
      setMessage({
        text: "Network error occurred while processing unlock.",
        type: "error",
      });
    } finally {
      setUnlockingId(null);
    }
  }

  // Official BCA Faculty workload mapping
  const bcaFaculty = [
    { name: "Prof. Jaishankar M", role: "Assistant Professor", subject: "Digital Principles (B25BCA301)", credits: "3 Credits", hours: "4 hrs/wk", email: "jaishankar.m@rrce.org" },
    { name: "Prof. Shreya S", role: "Assistant Professor", subject: "OOP with C++ (B25BCA302 & Lab B25BCAL307)", credits: "5 Credits", hours: "6 hrs/wk", email: "shreya.s@rrce.org" },
    { name: "Prof. Thilagavallii S", role: "Assistant Professor", subject: "Operating System Concepts (B25BCA303)", credits: "3 Credits", hours: "4 hrs/wk", email: "thilagavallii.s@rrce.org" },
    { name: "Prof. Pushpalatha G", role: "Assistant Professor", subject: "RDBMS (B25BCA304 & Lab B25BCAL308)", credits: "5 Credits", hours: "6 hrs/wk", email: "pushpalatha.g@rrce.org" },
    { name: "Prof. Deeraj C", role: "Assistant Professor", subject: "Software Engineering (B25BCA305)", credits: "2 Credits", hours: "3 hrs/wk", email: "deeraj.c@rrce.org" },
    { name: "Prof. Darshan P", role: "Assistant Professor", subject: "Reasoning and Aptitude (B25BCA306)", credits: "2 Credits", hours: "2 hrs/wk", email: "darshan.p@rrce.org" },
    { name: "Dr. Muruganandham S K", role: "Associate Professor", subject: "C++ Lab Co-Lead (B25BCAL307)", credits: "2 Credits", hours: "3 hrs/wk", email: "muruganandham.sk@rrce.org" },
  ];

  // 9 Quick-Access Cards Specification
  const quickAccessCards = [
    {
      id: "overrides",
      title: "Lockout Overrides",
      subtext: "Review locked sessions",
      icon: Unlock,
      tint: "bg-rose-50/60 border-rose-100/80 hover:border-rose-300 text-rose-950",
      iconBg: "bg-rose-100 text-rose-700",
      badge: "Action Needed",
      badgeColor: "bg-rose-100 text-rose-800",
      onClick: () => setActiveTab("overrides"),
    },
    {
      id: "students",
      title: "BCA Class Roster",
      subtext: "54 Enrolled Students",
      icon: Users,
      tint: "bg-blue-50/60 border-blue-100/80 hover:border-blue-300 text-blue-950",
      iconBg: "bg-blue-100 text-blue-700",
      badge: "3rd Sem",
      badgeColor: "bg-blue-100 text-blue-800",
      onClick: () => setActiveTab("students"),
    },
    {
      id: "workload",
      title: "Faculty Allocation",
      subtext: "7 Assigned Professors",
      icon: UserCheck,
      tint: "bg-purple-50/60 border-purple-100/80 hover:border-purple-300 text-purple-950",
      iconBg: "bg-purple-100 text-purple-700",
      badge: "Workload",
      badgeColor: "bg-purple-100 text-purple-800",
      onClick: () => setActiveTab("faculty"),
    },
    {
      id: "clash",
      title: "Master Timetable",
      subtext: "BCA Sem 3 Schedule",
      icon: Layers,
      tint: "bg-sky-50/60 border-sky-100/80 hover:border-sky-300 text-sky-950",
      iconBg: "bg-sky-100 text-sky-700",
      badge: "LH-201",
      badgeColor: "bg-sky-100 text-sky-800",
      onClick: () => setActiveModal("timetable"),
    },
    {
      id: "cie",
      title: "CIE Oversight",
      subtext: "IA-1 & IA-2 Verification",
      icon: Award,
      tint: "bg-amber-50/60 border-amber-100/80 hover:border-amber-300 text-amber-950",
      iconBg: "bg-amber-100 text-amber-700",
      badge: "CIE Audit",
      badgeColor: "bg-amber-100 text-amber-800",
      onClick: () => setActiveModal("cie"),
    },
    {
      id: "alerts",
      title: "Shortage Watch",
      subtext: "3 Mentees < 75%",
      icon: AlertTriangle,
      tint: "bg-red-50/60 border-red-100/80 hover:border-red-300 text-red-950",
      iconBg: "bg-red-100 text-red-700",
      badge: "Shortage",
      badgeColor: "bg-red-100 text-red-800",
      onClick: () => setActiveTab("alerts"),
    },
    {
      id: "proctor",
      title: "Mentorship Logs",
      subtext: "Monthly counseling",
      icon: FileText,
      tint: "bg-indigo-50/60 border-indigo-100/80 hover:border-indigo-300 text-indigo-950",
      iconBg: "bg-indigo-100 text-indigo-700",
      badge: "Proctor",
      badgeColor: "bg-indigo-100 text-indigo-800",
      onClick: () => setActiveModal("proctor"),
    },
    {
      id: "notices",
      title: "Dept Notices",
      subtext: "Meeting minutes & alerts",
      icon: Megaphone,
      tint: "bg-teal-50/60 border-teal-100/80 hover:border-teal-300 text-teal-950",
      iconBg: "bg-teal-100 text-teal-700",
      badge: "Circulars",
      badgeColor: "bg-teal-100 text-teal-800",
      onClick: () => setActiveModal("notices"),
    },
    {
      id: "kpis",
      title: "Academic KPIs",
      subtext: "Odd Sem 2025-26",
      icon: BarChart3,
      tint: "bg-emerald-50/60 border-emerald-100/80 hover:border-emerald-300 text-emerald-950",
      iconBg: "bg-emerald-100 text-emerald-700",
      badge: "Analytics",
      badgeColor: "bg-emerald-100 text-emerald-800",
      onClick: () => setActiveModal("kpis"),
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

  // Locked sessions requiring HOD override
  const lockedSessions = useMemo(() => {
    return sessions.filter((s) => s.lockoutStatus?.isLocked && !s.isLockedOverride);
  }, [sessions]);

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
                  HOD Directorate
                </span>
                <span className="hidden sm:inline-block font-mono text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  Department of BCA
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
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">Directorate Alerts</span>
                      <span className="text-[10px] text-slate-400 font-mono">{lockedSessions.length} Pending</span>
                    </div>
                    <div className="mt-2.5 space-y-2 text-xs">
                      {lockedSessions.length > 0 ? (
                        <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
                          <span className="font-semibold block text-[11px]">24-Hour Lockout Active</span>
                          <p className="text-[11px] text-rose-800 mt-0.5">
                            {lockedSessions.length} class attendance session(s) pending administrative unlock.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 py-2 text-center">
                          All attendance sessions are in compliance with VTU 24h rules.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* USER AVATAR */}
              <div className="flex items-center gap-2.5 pl-1.5 sm:border-l sm:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-purple-600/80 border border-purple-400/40 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  PG
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-bold text-xs text-white block leading-tight">
                    Dr. Praveen Gowda
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono block leading-tight">
                    hod.bca@rrce.org
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GREETING & ROLE METADATA */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[11px] font-medium mb-2.5">
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span>Department Head • Full Administrative Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hello, Dr. Praveen Gowda 👋
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Professor & Head • Dept of Computer Applications (BCA) · Autonomous VTU
            </p>
          </div>

          {/* QUICK KPI CHIPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faculty Assigned</span>
              <span className="text-sm font-bold text-white font-mono">7 Professors</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Students Enrolled</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">54 BCA Sem 3</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lockout Overrides</span>
              <span className="text-sm font-bold text-rose-400 font-mono">{lockedSessions.length} Pending</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Shortage Alerts</span>
              <span className="text-sm font-bold text-amber-400 font-mono">3 Flagged (&lt;75%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING OVERLAPPING SEARCH BAR */}
      <div className="relative -mt-6 mx-auto max-w-2xl px-4 z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center gap-3 px-4 h-13 transition-all focus-within:ring-2 focus-within:ring-purple-900/20 focus-within:border-slate-300">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search BCA roster, faculty workload, attendance overrides, or slots..."
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
                Department Executive Controls
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Autonomous BCA academic oversight, 24h lockout unlocker, and faculty management
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredCards.length} shortcuts
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
            onClick={() => setActiveTab("overrides")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "overrides"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Pending Overrides ({lockedSessions.length})
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "students"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            BCA Roster (54)
          </button>
          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "faculty"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Faculty Workload (7)
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "alerts"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Shortage Watch (3)
          </button>
        </div>

        {/* NOTIFICATION FEEDBACK */}
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

        {/* 4. LOWER TIMELINE / OPERATIONAL AGENDA FEED */}
        {activeTab === "overrides" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                24-Hour Attendance Lockout Overrides
              </h3>
              <span className="text-xs text-slate-500 font-mono">VTU Compliance Guard</span>
            </div>

            {lockedSessions.length > 0 ? (
              lockedSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="px-3 py-2 rounded-xl bg-rose-950 text-white font-mono text-center shrink-0">
                      <span className="text-[10px] text-rose-300 block uppercase font-medium">Locked</span>
                      <span className="text-xs font-bold">&gt;24h</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-rose-950 font-mono bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          {sess.subject}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Prof. {sess.faculty?.firstName} {sess.faculty?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>Created: {new Date(sess.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{sess.department?.code} Sem {sess.semester}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                      Locked by Rule
                    </span>
                    <button
                      type="button"
                      onClick={() => handleHODUnlock(sess.id)}
                      disabled={unlockingId === sess.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {unlockingId === sess.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                      <span>Grant HOD Override</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <span className="font-bold text-sm text-slate-900 block">No Pending Lockout Overrides</span>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  All BCA classroom roll-call sessions are either finalized within the 24-hour limit or already unlocked.
                </p>
              </div>
            )}
          </section>
        )}

        {/* STUDENTS TAB */}
        {activeTab === "students" && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">BCA 3rd Semester Class Roster (54 Students)</span>
              <span className="text-xs text-slate-500 font-mono">Sec A • AY 2025–26</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">SEQ</th>
                    <th className="px-4 py-3">USN</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Quota</th>
                    <th className="px-4 py-3 text-right">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.slice(0, 15).map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono text-slate-400">#{String(st.usnSequence).padStart(3, "0")}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{st.usn}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{st.user?.firstName} {st.user?.lastName}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-600">{st.quota || "KCET"}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-500">{st.user?.phone || "+91 9845000000"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* FACULTY TAB */}
        {activeTab === "faculty" && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">BCA Department Faculty Workload & Course Allocations</h3>
              <span className="text-xs text-slate-500 font-mono">Odd Sem 2025-26</span>
            </div>
            {bcaFaculty.map((f) => (
              <div
                key={f.email}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{f.name}</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold border border-purple-100">
                      {f.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{f.subject}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    {f.hours}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    {f.credits}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ALERTS TAB */}
        {activeTab === "alerts" && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">VTU Attendance Shortage Oversight (&lt;75%)</h3>
                <p className="text-xs text-slate-500">Mentees requiring mandatory parental notification & remedial classes</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Deepika C S (1RR25BC005)</span>
                  <span className="text-slate-600">Digital Principles: 68.2% • Shortage: 6 classes</span>
                </div>
                <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">Shortage Alert</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Shamanth T D (1RR25BC039)</span>
                  <span className="text-slate-600">Operating System Concepts: 70.4% • Shortage: 4 classes</span>
                </div>
                <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">Shortage Alert</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Srujan S (1RR25BC046)</span>
                  <span className="text-slate-600">RDBMS Lab: 72.0% • Shortage: 2 lab sessions</span>
                </div>
                <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">Warning</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL POPUPS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-950 uppercase">
                {activeModal === "timetable" ? "Master Timetable (BCA Sem 3)" : activeModal === "cie" ? "CIE IA-1 & IA-2 Oversight" : activeModal === "proctor" ? "Mentorship & Counseling Roster" : activeModal === "notices" ? "Department Circulars" : "Academic KPIs & Metrics"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official institutional record managed by the Directorate of Computer Applications (BCA), Rajarajeswari College of Engineering.
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING/DOCKED BOTTOM THUMB NAVIGATION FOR MOBILE (<1024px) */}
      </div>
  );
}
