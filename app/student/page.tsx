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

  const todayClasses = [
    { time: "09:00 - 10:00 AM", code: "B25BCA301", title: "Digital Principles & Computer Organization", instructor: "Prof. Jaishankar M", room: "LH-201" },
    { time: "10:00 - 11:00 AM", code: "B25BCA302", title: "Object Oriented Programming in C++", instructor: "Prof. Shreya S", room: "LH-201" },
    { time: "11:15 - 12:15 PM", code: "B25BCA303", title: "Operating System Concepts", instructor: "Prof. Thilagavallii S", room: "LH-201" },
    { time: "02:00 - 03:00 PM", code: "B25BCA304", title: "Relational Data Base Management System", instructor: "Prof. Pushpalatha G", room: "LH-201" },
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

      {/* 2. STATUS CARDS (RESPONSIVE GRID: 1 COL MOBILE, 2 COL TABLET, 3 COL DESKTOP) */}
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

      {/* 3. TODAY'S CLASSES SECTION */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Today's Classes
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monday Class Schedule & Lecture Halls
          </p>
        </div>

        <div className="space-y-3">
          {todayClasses.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-zinc-200/70 p-4 hover:border-zinc-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-900 text-sm">{item.title}</span>
                  <span className="font-mono text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                    {item.code}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Instructor: {item.instructor}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-zinc-100 sm:border-0">
                <span className="font-mono text-xs text-zinc-600 bg-zinc-50 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded border border-zinc-100 sm:border-0">
                  {item.time}
                </span>
                <span className="font-mono bg-zinc-100 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-800">
                  {item.room}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
