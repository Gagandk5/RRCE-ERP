"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { ProfileAvatar } from "@/components/ProfileContext";

export default function StudentOverviewPage() {
  const [student, setStudent] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState({ totalHeld: 0, totalAttended: 0 });

  useEffect(() => {
    loadStudentData();
    async function loadAttendanceSummary() {
      try {
        const response = await fetch("/api/student/attendance", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setAttendanceSummary({
          totalHeld: data.totalHeld || 0,
          totalAttended: data.totalAttended || 0,
        });
      } catch (error) {
        console.error("Failed to load attendance summary:", error);
      }
    }
    void loadAttendanceSummary();
    const refreshTimer = window.setInterval(() => void loadAttendanceSummary(), 10000);
    return () => window.clearInterval(refreshTimer);
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

  function formatDateOfBirth(rawDob: any): string {
    if (!rawDob) return "14 Dec 2007";
    try {
      const date = typeof rawDob === "string" ? new Date(rawDob) : rawDob;
      if (isNaN(date.getTime())) return "14 Dec 2007";
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "14 Dec 2007";
    }
  }

  const attendanceRate = attendanceSummary.totalHeld
    ? (attendanceSummary.totalAttended / attendanceSummary.totalHeld) * 100
    : 0;

  const pendingFee = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 35000;
  const totalBilledFee = invoice?.totalAmount || 85000;
  const totalPaidFee = invoice?.paidAmount || 50000;
  const safeBunks = attendanceRate >= 75
    ? Math.max(0, Math.floor(attendanceSummary.totalAttended / 0.75 - attendanceSummary.totalHeld))
    : 0;
  const attendanceLedger = [
    { code: "25BC301", name: "Discrete Mathematics", attended: 18, held: 20 },
    { code: "25BC302", name: "Data Structures & Algorithms", attended: 16, held: 20 },
    { code: "25BC303", name: "Database Management Systems", attended: 19, held: 21 },
  ];

  const todayClasses = [
    { time: "09:00 - 10:00 AM", code: "25BC301", title: "Discrete Mathematics", instructor: "Prof. Sunitha Sharma", room: "LH-201" },
    { time: "10:00 - 11:00 AM", code: "25BC302", title: "Data Structures & Algorithms", instructor: "Dr. Praveen Gowda", room: "LH-201" },
    { time: "11:15 - 12:15 PM", code: "25BC303", title: "Database Management Systems", instructor: "Prof. Kavitha N", room: "Lab-3" },
    { time: "02:00 - 04:00 PM", code: "25BCL31", title: "Data Structures Practical Lab", instructor: "Dr. Praveen Gowda", room: "Computer Lab 2" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 text-zinc-900 font-sans max-w-full overflow-hidden">
      {/* 1. UNIFIED HEADER CARD */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <ProfileAvatar sizeClassName="h-12 w-12 sm:h-16 sm:w-16 shrink-0" />
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 tracking-tight">
              Good morning, {student?.user?.firstName || "Gagan"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              BCA • 3rd Semester (Sec A) · Batch of 2025–26
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="font-mono text-[11px] sm:text-xs bg-zinc-100 text-zinc-700 px-2.5 sm:px-3 py-1 rounded-full">
            {student?.usn || "1RR25BC007"}
          </span>
          <span className="text-[11px] sm:text-xs bg-zinc-100 text-zinc-700 px-2.5 sm:px-3 py-1 rounded-full">
            Quota: {student?.quota || "KCET"}
          </span>
          <span className="font-mono text-[11px] sm:text-xs bg-zinc-100 text-zinc-700 px-2.5 sm:px-3 py-1 rounded-full">
            Roll: #{String(student?.usnSequence || 7).padStart(3, "0")}
          </span>
          <span className="text-[11px] sm:text-xs bg-zinc-100 text-zinc-700 px-2.5 sm:px-3 py-1 rounded-full">
            DOB: {formatDateOfBirth(student?.dateOfBirth)}
          </span>
        </div>
      </div>

      {/* 2. ACTION QUEUE */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h2 className="text-sm font-semibold text-slate-900">My Action Items &amp; Alerts</h2><p className="mt-0.5 text-xs text-slate-500">Institutional tasks requiring your attention</p></div><span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">3 active</span></div>
        <div className="divide-y divide-slate-100">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Financial review</span><p className="mt-1 text-xs font-medium text-slate-800">Tuition Balance Pending: {formatINR(pendingFee)} <span className="font-normal text-slate-500">(Due: 31 Oct 2025)</span></p></div><Link href="/student/fees" className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700">Pay Online</Link></div>
          <div className="px-4 py-3"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Examination notice</span><p className="mt-1 text-xs font-medium text-slate-800">IA-2 Assessment Series starts Oct 12, 2026.</p></div>
          <div className="flex items-center justify-between gap-3 px-4 py-3"><div><span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Attendance eligibility</span><p className="mt-1 text-xs font-medium text-slate-800">{attendanceRate.toFixed(1)}% compliance</p></div><span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Eligible for SEE Examinations</span></div>
        </div>
      </section>

      {/* 3. STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Attendance Health */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 sm:p-6 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              ATTENDANCE HEALTH
            </span>
            <span className={`${attendanceRate >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"} rounded-full border px-2.5 py-0.5 text-xs font-medium`}>
              {attendanceRate >= 75 ? "On Track (≥ 75%)" : "Below 75%"}
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight">
              {attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {attendanceSummary.totalAttended} of {attendanceSummary.totalHeld} sessions attended
            </p>
          </div>
        </div>

        {/* Card 2: Fee Status */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 sm:p-6 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              FEE BALANCE
            </span>
            <Link
              href="/student/fees"
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium shrink-0"
            >
              Statement →
            </Link>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight font-mono">
              {formatINR(pendingFee)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              {formatINR(totalPaidFee)} paid of {formatINR(totalBilledFee)} annual tuition
            </p>
          </div>
        </div>

        {/* Card 3: Next Assessment */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 sm:p-6 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              NEXT ASSESSMENT
            </span>
            <span className="bg-zinc-100 text-zinc-600 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0">
              Internal Exam
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              IA-2 Series
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Starts Monday, Oct 12 · Autonomous Scheme
            </p>
          </div>
        </div>
      </div>

      {/* 4. ACADEMIC WORKSPACE */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[3fr_2fr]">
        <section className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Today&apos;s Schedule &amp; Lecture Halls
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Monday agenda · 4 scheduled periods</p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="hidden grid-cols-[110px_100px_minmax(0,1fr)_150px_110px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:grid"><span>Period</span><span>Code</span><span>Subject</span><span>Faculty</span><span>Hall</span></div>
            {todayClasses.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2 border-b border-slate-100 p-4 last:border-0 sm:grid-cols-[110px_100px_minmax(0,1fr)_150px_110px] sm:items-center sm:gap-3"
              >
                <span className="font-mono text-xs text-slate-500">{item.time}</span><span className="font-mono text-xs font-semibold text-slate-600">{item.code}</span><span className="text-sm font-semibold text-slate-900">{item.title}</span><span className="text-xs text-slate-500">{item.instructor}</span><span className="font-mono text-xs font-semibold text-slate-700">{item.room}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">VTU Attendance Compliance Summary</h2><p className="mt-0.5 text-xs text-slate-500">75% minimum threshold · safe bunk margin: {safeBunks} class{safeBunks === 1 ? "" : "es"}</p></div>
          <div className="divide-y divide-slate-100">{attendanceLedger.map((subject) => { const rate = (subject.attended / subject.held) * 100; const margin = rate >= 75 ? Math.max(0, Math.floor(subject.attended / 0.75 - subject.held)) : 0; return <div key={subject.code} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-800">{subject.name}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{subject.code} · {subject.attended}/{subject.held} attended</p></div><span className={`rounded-md border px-2 py-1 font-mono text-xs font-semibold ${rate >= 75 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{rate.toFixed(1)}%</span></div><p className={`mt-2 text-[10px] font-medium ${rate >= 75 ? "text-emerald-700" : "text-rose-700"}`}>{rate >= 75 ? `${margin} safe bunk${margin === 1 ? "" : "s"} remaining` : "Attendance shortage: immediate recovery required"}</p></div>; })}</div>
        </section>
      </div>
    </div>
  );
}
