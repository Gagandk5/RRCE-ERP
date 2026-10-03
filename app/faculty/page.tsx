"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  CheckSquare,
  Award,
  Users,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Megaphone,
  KeyRound,
  Search,
  ArrowRight,
  Sparkles,
  Bell,
  AlertTriangle,
  Layers,
  CheckCircle2,
  X,
  FileText,
  UserCheck,
  ShieldAlert,
  Loader2,
  LogOut,
  MapPin,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import BottomNav from "@/components/BottomNav";

export default function FacultyPortal() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Timetable Clash Planner State
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
        setStudents(stData.students || []);
      }

      const sessRes = await fetch("/api/attendance/session?dept=BCA");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData.sessions || []);
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
      router.push("/login?portal=faculty");
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

  // 9 Quick-Access Cards Specification
  const quickAccessCards = [
    {
      id: "attendance",
      title: "Roll-Call Marker",
      subtext: "24h edit window active",
      icon: CheckSquare,
      tint: "bg-emerald-50/60 border-emerald-100/80 hover:border-emerald-300 text-emerald-950",
      iconBg: "bg-emerald-100 text-emerald-700",
      badge: "VTU Ledger",
      badgeColor: "bg-emerald-100/80 text-emerald-800",
      href: "/faculty/attendance",
    },
    {
      id: "schedule",
      title: "Schedule Planner",
      subtext: "3-layer clash verified",
      icon: CalendarDays,
      tint: "bg-sky-50/60 border-sky-100/80 hover:border-sky-300 text-sky-950",
      iconBg: "bg-sky-100 text-sky-700",
      badge: "Timetable",
      badgeColor: "bg-sky-100/80 text-sky-800",
      onClick: () => setIsScheduleModalOpen(true),
    },
    {
      id: "marks",
      title: "CIE Marks Ledger",
      subtext: "IA-1, IA-2 & Lab CIE",
      icon: Award,
      tint: "bg-amber-50/60 border-amber-100/80 hover:border-amber-300 text-amber-950",
      iconBg: "bg-amber-100 text-amber-700",
      badge: "50 Marks",
      badgeColor: "bg-amber-100/80 text-amber-800",
      onClick: () => setActiveModal("marks"),
    },
    {
      id: "proctor",
      title: "Proctee Roster",
      subtext: "5 Assigned Mentees",
      icon: Users,
      tint: "bg-indigo-50/60 border-indigo-100/80 hover:border-indigo-300 text-indigo-950",
      iconBg: "bg-indigo-100 text-indigo-700",
      badge: "3 Alerts",
      badgeColor: "bg-rose-100 text-rose-800",
      onClick: () => setActiveModal("proctor"),
    },
    {
      id: "syllabus",
      title: "Course Outcomes",
      subtext: "B25BCA301 (3 Credits)",
      icon: BookOpen,
      tint: "bg-purple-50/60 border-purple-100/80 hover:border-purple-300 text-purple-950",
      iconBg: "bg-purple-100 text-purple-700",
      badge: "VTU 2025",
      badgeColor: "bg-purple-100/80 text-purple-800",
      onClick: () => setActiveModal("syllabus"),
    },
    {
      id: "assignments",
      title: "Evaluator",
      subtext: "Student lab records",
      icon: ClipboardList,
      tint: "bg-orange-50/60 border-orange-100/80 hover:border-orange-300 text-orange-950",
      iconBg: "bg-orange-100 text-orange-700",
      badge: "Labs & Theory",
      badgeColor: "bg-orange-100/80 text-orange-800",
      onClick: () => setActiveModal("assignments"),
    },
    {
      id: "roster",
      title: "Student Directory",
      subtext: "54 BCA Students",
      icon: GraduationCap,
      tint: "bg-blue-50/60 border-blue-100/80 hover:border-blue-300 text-blue-950",
      iconBg: "bg-blue-100 text-blue-700",
      badge: "Sec A",
      badgeColor: "bg-blue-100/80 text-blue-800",
      onClick: () => setActiveModal("roster"),
    },
    {
      id: "notices",
      title: "Circulars",
      subtext: "Exam & academic notices",
      icon: Megaphone,
      tint: "bg-rose-50/60 border-rose-100/80 hover:border-rose-300 text-rose-950",
      iconBg: "bg-rose-100 text-rose-700",
      badge: "Latest",
      badgeColor: "bg-rose-100/80 text-rose-800",
      onClick: () => setActiveModal("notices"),
    },
    {
      id: "security",
      title: "Change Password",
      subtext: "Self-service security",
      icon: KeyRound,
      tint: "bg-slate-100/60 border-slate-200/80 hover:border-slate-300 text-slate-950",
      iconBg: "bg-slate-200 text-slate-700",
      badge: "Auth",
      badgeColor: "bg-slate-200/80 text-slate-800",
      onClick: () => setIsPasswordModalOpen(true),
    },
  ];

  // Filtered Cards based on search query
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

  // Agenda feed: Teaching Schedule for today
  const teachingSchedule = [
    {
      id: "slot-1",
      time: "09:00 AM - 10:00 AM",
      startHour: "09:00 AM",
      courseCode: "B25BCA301",
      courseName: "Digital Principles and Computer Organization",
      room: "LH-201",
      batch: "BCA Sem 3 (Sec A)",
      credits: "3 Credits",
      status: "Active Class",
      statusColor: "bg-sky-50 text-sky-700 border-sky-200/80",
      isNext: true,
      hasDirectAction: true,
    },
    {
      id: "slot-2",
      time: "11:30 AM - 01:30 PM",
      startHour: "11:30 AM",
      courseCode: "B25BCAL308",
      courseName: "Relational Data Base Management System Lab",
      room: "Lab 3 (Systems Hub)",
      batch: "BCA Sem 3 (Batch 1)",
      credits: "2 Credits",
      status: "Scheduled",
      statusColor: "bg-slate-100 text-slate-700 border-slate-200/80",
      isNext: false,
      hasDirectAction: false,
    },
    {
      id: "slot-3",
      time: "02:30 PM - 03:30 PM",
      startHour: "02:30 PM",
      courseCode: "B25BCA301",
      courseName: "Tutorial & Microprocessor Architecture Discussion",
      room: "LH-201",
      batch: "BCA Sem 3 (Sec A)",
      credits: "Tutorial",
      status: "Upcoming",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200/80",
      isNext: false,
      hasDirectAction: false,
    },
  ];

  const lowAttendanceStudents = [
    { name: "Deepika C S", usn: "1RR25BC005", attendance: "68.2%", shortage: "Critical (<75%)" },
    { name: "Shamanth T D", usn: "1RR25BC039", attendance: "70.4%", shortage: "Warning (<75%)" },
    { name: "Srujan S", usn: "1RR25BC046", attendance: "72.0%", shortage: "Warning (<75%)" },
  ];

  const facultyDisplayName = currentUser
    ? `Prof. ${currentUser.firstName} ${currentUser.lastName}`
    : "Prof. Jaishankar M";

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
                  Faculty Workspace
                </span>
                <span className="hidden sm:inline-block font-mono text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  BCA Directorate
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
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">Academic Alerts</span>
                      <span className="text-[10px] text-slate-400 font-mono">2 New</span>
                    </div>
                    <div className="mt-2.5 space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100 text-amber-900">
                        <span className="font-semibold block text-[11px]">Attendance Lockout Watch</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          24h window active for Session #B25BCA301. Finalize roll-call by 05:00 PM.
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 text-rose-900">
                        <span className="font-semibold block text-[11px]">Proctee Attendance Shortage</span>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          3 mentees fallen below 75% threshold in Digital Principles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* USER AVATAR */}
              <div className="flex items-center gap-2.5 pl-1.5 sm:border-l sm:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/80 border border-indigo-400/40 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  JM
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-bold text-xs text-white block leading-tight">
                    {facultyDisplayName}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono block leading-tight">
                    jaishankar.m@rrce.org
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GREETING & ROLE METADATA */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-medium mb-2.5">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              <span>Academic Year 2025–26 • Autonomous VTU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hello, {currentUser?.firstName || "Prof. Jaishankar M"} 👋
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Dept of Computer Applications • BCA Sem 3 (Sec A) · Lecture Hall LH-201
            </p>
          </div>

          {/* QUICK KPI CHIPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Classes Today</span>
              <span className="text-sm font-bold text-white font-mono">2 Scheduled</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Enrolled Roster</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">54 Students</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lockout Status</span>
              <span className="text-sm font-bold text-sky-400 font-mono">24h Open</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mentees</span>
              <span className="text-sm font-bold text-amber-400 font-mono">5 Assigned</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING OVERLAPPING SEARCH BAR */}
      <div className="relative -mt-6 mx-auto max-w-2xl px-4 z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center gap-3 px-4 h-13 transition-all focus-within:ring-2 focus-within:ring-indigo-900/20 focus-within:border-slate-300">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students, attendance sessions, timetable slots, or course codes..."
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
                Quick-Access Operational Desk
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Primary faculty tools, roll-call ledger, and VTU academic services
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredCards.length} shortcuts
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredCards.map((card) => {
              const Icon = card.icon;
              const CardContent = (
                <div
                  className={`rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[115px] sm:min-h-[125px] ${card.tint}`}
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
                </div>
              );

              if (card.href) {
                return (
                  <Link key={card.id} href={card.href} className="block">
                    {CardContent}
                  </Link>
                );
              }

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={card.onClick}
                  className="w-full text-left"
                >
                  {CardContent}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. LOWER TIMELINE / OPERATIONAL AGENDA FEED */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight flex items-center gap-2">
                <span>Today's Teaching Schedule</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Real-time classroom agenda with 1-tap roll-call invocation
              </p>
            </div>
            <Link
              href="/faculty/attendance"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 hover:text-indigo-950 bg-indigo-50 border border-indigo-200/60 px-3 py-1.5 rounded-xl transition-colors shadow-2xs self-start sm:self-auto"
            >
              <span>Open Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {teachingSchedule.map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* LEFT-ANCHORED TIME BADGE & DETAILS */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="px-3 py-2 rounded-xl bg-slate-900 text-white font-mono text-center shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Time</span>
                    <span className="text-xs font-bold">{slot.startHour}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-indigo-950 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {slot.courseCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {slot.courseName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{slot.room}</span>
                      </span>
                      <span>•</span>
                      <span>{slot.batch}</span>
                      <span>•</span>
                      <span className="font-mono">{slot.credits}</span>
                    </div>
                  </div>
                </div>

                {/* STATUS PILL & DIRECT ACTION */}
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border font-mono ${slot.statusColor}`}
                  >
                    {slot.status}
                  </span>

                  {slot.hasDirectAction ? (
                    <Link
                      href="/faculty/attendance"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Take Attendance</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveModal("syllabus")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
                    >
                      <span>Prepare</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. MENTORSHIP & ATTENDANCE SHORTAGE RADAR */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Attendance Shortage Watchlist (&lt;75%)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Autonomous VTU exam eligibility proctoring ledger
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal("proctor")}
              className="text-xs font-semibold text-indigo-900 hover:text-indigo-950"
            >
              View Roster →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lowAttendanceStudents.map((st) => (
              <div
                key={st.usn}
                className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/60 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block">{st.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 block">{st.usn}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-extrabold text-rose-700 block">
                    {st.attendance}
                  </span>
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded block mt-0.5">
                    Shortage
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 6. MODALS */}
      {/* Timetable Clash Planner Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-950">
                  Timetable Clash Engine & Planner
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Day of Week</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, dayOfWeek: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
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
                  <label className="block text-slate-700 font-semibold mb-1">Room / Hall</label>
                  <input
                    value={scheduleForm.roomNumber}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, roomNumber: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, startTime: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) => {
                      const updated = { ...scheduleForm, endTime: e.target.value };
                      setScheduleForm(updated);
                      checkLiveClash(updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* LIVE CLASH ENGINE FEEDBACK */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-900" />
                    <span>3-Layer Clash Engine:</span>
                  </span>
                  {checkingClash && <span className="text-[10px] text-slate-400 font-mono">Checking...</span>}
                </div>
                {clashResult ? (
                  clashResult.valid ? (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Slot clear: No Faculty, Room, or Batch clashes detected.
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {clashResult.clashes?.[0]?.message || "Clash detected!"}
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Slot verification checks Faculty Overload, Room Double-booking & Student Batch.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingSlot || (clashResult && !clashResult.valid)}
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {schedulingSlot ? "Scheduling..." : "Save Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CIE Marks Modal */}
      {activeModal === "marks" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950">Continuous Internal Evaluation (CIE)</h3>
                  <span className="text-[11px] text-slate-500 font-mono">B25BCA301 • Max 50 Marks</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
              <strong>VTU Regulations:</strong> CIE consists of IA-1 (25 Marks), IA-2 (25 Marks), and Assignments/Lab Records (10 Marks). The portal will calculate best of 2 average scaled to 50 Marks.
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-800">IA-1 Examination</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Completed (Avg: 21.4/25)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-800">IA-2 Examination</span>
                <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Scheduled: Nov 14, 2025</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring & Mentorship Modal */}
      {activeModal === "proctor" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950">Assigned Mentees Roster</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Faculty Proctor: Prof. Jaishankar M</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
              {students.slice(0, 5).map((s) => (
                <div key={s.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">{s.user.firstName} {s.user.lastName}</span>
                    <span className="font-mono text-[10px] text-slate-500">{s.usn}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Good Standing
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Syllabus Modal */}
      {activeModal === "syllabus" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950">Official VTU Course Syllabus</h3>
                  <span className="text-[11px] text-slate-500 font-mono">B25BCA301 • 3 Credits (3:0:0)</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <strong className="text-purple-950 block">Module 1: Digital Logic & Combinational Circuits</strong>
                <p className="text-purple-900 text-[11px] mt-0.5">Boolean Algebra, K-Maps, Adders, Multiplexers, and Decoders.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <strong className="text-purple-950 block">Module 2: Sequential Circuits & Flip-Flops</strong>
                <p className="text-purple-900 text-[11px] mt-0.5">SR, JK, D, T Flip-flops, Synchronous Counters, and Registers.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <strong className="text-purple-950 block">Module 3: Basic Computer Organization</strong>
                <p className="text-purple-900 text-[11px] mt-0.5">Instruction codes, Computer registers, Memory-reference instructions.</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Directory & Notices Modals (roster, notices, assignments) */}
      {(activeModal === "roster" || activeModal === "notices" || activeModal === "assignments") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-950 capitalize">
                {activeModal === "roster" ? "BCA Sem 3 Class Roster (54 Students)" : activeModal === "notices" ? "Department Circulars & Gazette" : "Assignments & Lab Evaluations"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {activeModal === "roster"
                ? "Official enrolled batch for Academic Year 2025–26, Department of Computer Applications, Section A."
                : activeModal === "notices"
                ? "Academic calendar, VTU semester examination notifications, and departmental meeting minutes."
                : "Continuous evaluation marks and record submissions verified for 3rd semester students."}
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={currentUser?.email || "jaishankar.m@rrce.org"}
      />

    </div>
  );
}
