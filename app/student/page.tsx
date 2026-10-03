"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquare,
  CalendarDays,
  Award,
  Receipt,
  GraduationCap,
  ClipboardList,
  Trophy,
  Megaphone,
  User,
  Search,
  Bell,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  X,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

export default function StudentOverviewPage() {
  const [student, setStudent] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState({ totalHeld: 24, totalAttended: 21 });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    loadStudentData();
    async function loadAttendanceSummary() {
      try {
        const response = await fetch("/api/student/attendance", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setAttendanceSummary({
          totalHeld: data.totalHeld || 24,
          totalAttended: data.totalAttended || 21,
        });
      } catch (error) {
        console.error("Failed to load attendance summary:", error);
      }
    }
    void loadAttendanceSummary();
  }, []);

  async function loadStudentData() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      let currentUser: any = null;
      if (meRes.ok) {
        const d = await meRes.json();
        currentUser = d.user;
      }

      if (currentUser?.studentProfile) {
        const profile = {
          ...currentUser.studentProfile,
          user: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            phone: currentUser.phone,
            email: currentUser.email,
          },
        };
        setStudent(profile);
        if (profile.invoices?.length > 0) {
          setInvoice(profile.invoices[0]);
        }
        setLoading(false);
        return;
      }

      const stRes = await fetch("/api/students?dept=BCA");
      if (stRes.ok) {
        const sData = await stRes.json();
        const roster = sData.students || [];

        const targetUsn = (currentUser?.usn || currentUser?.username || "").toLowerCase().trim();
        const match = roster.find((s: any) => (s.usn || "").toLowerCase().trim() === targetUsn) || roster[0];
        setStudent(match);
        if (match?.invoices?.length > 0) {
          setInvoice(match.invoices[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load overview data:", e);
    } finally {
      setLoading(false);
    }
  }

  const attendanceRate = attendanceSummary.totalHeld
    ? ((attendanceSummary.totalAttended / attendanceSummary.totalHeld) * 100).toFixed(1)
    : "87.5";

  const pendingFee = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 35000;

  const quickAccessCards = [
    {
      id: "attendance",
      title: "Attendance Ledger",
      subtext: attendanceRate + "% Overall",
      icon: CheckSquare,
      tint: "bg-emerald-50/60 border-emerald-100/80 hover:border-emerald-300 text-emerald-950",
      iconBg: "bg-emerald-100 text-emerald-700",
      badge: "Eligible",
      badgeColor: "bg-emerald-100 text-emerald-800",
      href: "/student/attendance",
    },
    {
      id: "timetable",
      title: "Class Timetable",
      subtext: "4 lectures today",
      icon: CalendarDays,
      tint: "bg-sky-50/60 border-sky-100/80 hover:border-sky-300 text-sky-950",
      iconBg: "bg-sky-100 text-sky-700",
      badge: "LH-201",
      badgeColor: "bg-sky-100 text-sky-800",
      href: "/student/timetable",
    },
    {
      id: "marks",
      title: "CIE Marks Ledger",
      subtext: "IA-1 & IA-2 scores",
      icon: Award,
      tint: "bg-amber-50/60 border-amber-100/80 hover:border-amber-300 text-amber-950",
      iconBg: "bg-amber-100 text-amber-700",
      badge: "IA-1 Verified",
      badgeColor: "bg-amber-100 text-amber-800",
      href: "/student/marks",
    },
    {
      id: "fees",
      title: "Tuition Fees",
      subtext: "Pending: " + formatINR(pendingFee),
      icon: Receipt,
      tint: "bg-indigo-50/60 border-indigo-100/80 hover:border-indigo-300 text-indigo-950",
      iconBg: "bg-indigo-100 text-indigo-700",
      badge: "Receipts",
      badgeColor: "bg-indigo-100 text-indigo-800",
      href: "/student/fees",
    },
    {
      id: "admit-card",
      title: "VTU Admit Card",
      subtext: "Hall Ticket ready",
      icon: GraduationCap,
      tint: "bg-purple-50/60 border-purple-100/80 hover:border-purple-300 text-purple-950",
      iconBg: "bg-purple-100 text-purple-700",
      badge: "VTU 2025",
      badgeColor: "bg-purple-100 text-purple-800",
      href: "/student/admit-card",
    },
    {
      id: "assignments",
      title: "Lab Assignments",
      subtext: "3 submissions pending",
      icon: ClipboardList,
      tint: "bg-orange-50/60 border-orange-100/80 hover:border-orange-300 text-orange-950",
      iconBg: "bg-orange-100 text-orange-700",
      badge: "Due Friday",
      badgeColor: "bg-orange-100 text-orange-800",
      href: "/student/assignments",
    },
    {
      id: "results",
      title: "Semester Results",
      subtext: "SGPA & Grade Cards",
      icon: Trophy,
      tint: "bg-teal-50/60 border-teal-100/80 hover:border-teal-300 text-teal-950",
      iconBg: "bg-teal-100 text-teal-700",
      badge: "8.42 SGPA",
      badgeColor: "bg-teal-100 text-teal-800",
      href: "/student/results",
    },
    {
      id: "notices",
      title: "Campus Notices",
      subtext: "VTU & Dept Circulars",
      icon: Megaphone,
      tint: "bg-rose-50/60 border-rose-100/80 hover:border-rose-300 text-rose-950",
      iconBg: "bg-rose-100 text-rose-700",
      badge: "Circulars",
      badgeColor: "bg-rose-100 text-rose-800",
      href: "/student/notices",
    },
    {
      id: "profile",
      title: "KYC & Profile",
      subtext: "Academic Bio & Proctor",
      icon: User,
      tint: "bg-slate-100/60 border-slate-200/80 hover:border-slate-300 text-slate-950",
      iconBg: "bg-slate-200 text-slate-700",
      badge: "Profile",
      badgeColor: "bg-slate-200 text-slate-800",
      href: "/student/profile",
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
  }, [search, quickAccessCards]);

  const todayClasses = [
    {
      time: "09:00 - 10:00 AM",
      startHour: "09:00 AM",
      code: "B25BCA301",
      title: "Digital Principles & Computer Organization",
      instructor: "Prof. Jaishankar M",
      room: "LH-201",
      status: "Active Now",
      statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      time: "10:00 - 11:00 AM",
      startHour: "10:00 AM",
      code: "B25BCA302",
      title: "Object Oriented Programming in C++",
      instructor: "Prof. Shreya S",
      room: "LH-201",
      status: "Next Class",
      statusColor: "bg-sky-50 text-sky-800 border-sky-200",
    },
    {
      time: "11:15 - 12:15 PM",
      startHour: "11:15 AM",
      code: "B25BCA303",
      title: "Operating System Concepts",
      instructor: "Prof. Thilagavallii S",
      room: "LH-201",
      status: "Upcoming",
      statusColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      time: "02:00 - 03:00 PM",
      startHour: "02:00 PM",
      code: "B25BCA304",
      title: "Relational Data Base Management System",
      instructor: "Prof. Pushpalatha G",
      room: "LH-201",
      status: "Upcoming",
      statusColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];

  const studentName = student && student.user && student.user.firstName
    ? student.user.firstName + " " + (student.user.lastName || "")
    : "Gagan D K";

  const studentUsn = (student && student.usn) || "1RR25BC007";

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
                  Student Workspace
                </span>
                <span className="hidden sm:inline-block font-mono text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  BCA Directorate
                </span>
              </div>
            </div>

            {/* NOTIFICATIONS & AVATAR */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">Student Notifications</span>
                      <span className="text-[10px] text-slate-400 font-mono">1 New</span>
                    </div>
                    <div className="mt-2.5 space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                        <span className="font-semibold block text-[11px]">Admit Card Released</span>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          VTU 3rd Semester Examination admit card is ready for download in the Admit Card portal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* USER AVATAR */}
              <div className="flex items-center gap-2.5 pl-1.5 sm:border-l sm:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/80 border border-emerald-400/40 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {studentName.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-bold text-xs text-white block leading-tight">
                    {studentName}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono block leading-tight">
                    {studentUsn}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GREETING & ROLE METADATA */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-medium mb-2.5">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>Academic Year 2025–26 • Autonomous VTU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Good morning, {(student && student.user && student.user.firstName) || "Gagan"} 👋
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              BCA • 3rd Semester (Sec A) · USN: {studentUsn} • Autonomous Curriculum
            </p>
          </div>

          {/* QUICK KPI CHIPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attendance</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{attendanceRate}% Eligible</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Classes Today</span>
              <span className="text-sm font-bold text-white font-mono">4 Lectures</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tuition Status</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {pendingFee > 0 ? formatINR(pendingFee) + " Due" : "Paid"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">VTU Admit Card</span>
              <span className="text-sm font-bold text-purple-400 font-mono">Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING OVERLAPPING SEARCH BAR */}
      <div className="relative -mt-6 mx-auto max-w-2xl px-4 z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center gap-3 px-4 h-13 transition-all focus-within:ring-2 focus-within:ring-emerald-900/20 focus-within:border-slate-300">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects, faculty, attendance, marks, receipts, or notices..."
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
                Quick-Access Student Desk
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Academic schedules, attendance records, CIE scores, and fee payments
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
                <Link
                  key={card.id}
                  href={card.href}
                  className={"rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[115px] sm:min-h-[125px] " + card.tint}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={"w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs " + card.iconBg}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono shrink-0 " + card.badgeColor}>
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
                </Link>
              );
            })}
          </div>
        </section>

        {/* 4. LOWER TIMELINE / OPERATIONAL AGENDA FEED */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight flex items-center gap-2">
                <span>Today's Lecture Schedule</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Classroom lectures and laboratory practicals for BCA Sem 3 (Sec A)
              </p>
            </div>
            <Link
              href="/student/timetable"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 hover:text-indigo-950 bg-indigo-50 border border-indigo-200/60 px-3 py-1.5 rounded-xl transition-colors shadow-2xs self-start sm:self-auto"
            >
              <span>Weekly Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {todayClasses.map((lecture) => (
              <div
                key={lecture.code}
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="px-3 py-2 rounded-xl bg-slate-900 text-white font-mono text-center shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Time</span>
                    <span className="text-xs font-bold">{lecture.startHour}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-indigo-950 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {lecture.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {lecture.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lecture.room}</span>
                      </span>
                      <span>•</span>
                      <span>{lecture.instructor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span
                    className={"text-[11px] font-semibold px-2.5 py-1 rounded-xl border font-mono " + lecture.statusColor}
                  >
                    {lecture.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

    </div>
  );
}
