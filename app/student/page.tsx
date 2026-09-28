"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

export default function StudentOverviewPage() {
  const [student, setStudent] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
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

  const attendanceRate = 83.33333333333333;
  const totalClasses = 48;
  const attendedClasses = 40;

  const pendingFee = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 35000;
  const totalBilledFee = invoice?.totalAmount || 85000;
  const totalPaidFee = invoice?.paidAmount || 50000;

  const todayClasses = [
    { time: "09:00 - 10:00 AM", code: "25BC301", title: "Discrete Mathematics", instructor: "Prof. Sunitha Sharma", room: "LH-201" },
    { time: "10:00 - 11:00 AM", code: "25BC302", title: "Data Structures & Algorithms", instructor: "Dr. Praveen Gowda", room: "LH-201" },
    { time: "11:15 - 12:15 PM", code: "25BC303", title: "Database Management Systems", instructor: "Prof. Kavitha N", room: "Lab-3" },
    { time: "02:00 - 04:00 PM", code: "25BCL31", title: "Data Structures Practical Lab", instructor: "Dr. Praveen Gowda", room: "Computer Lab 2" },
  ];

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      {/* 2. UNIFIED HEADER CARD */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Good morning, {student?.user?.firstName || "Gagan"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            BCA • 3rd Semester (Sec A) · Batch of 2025–26
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
            {student?.usn || "1RR25BC007"}
          </span>
          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
            Quota: {student?.quota || "KCET"}
          </span>
          <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
            Roll: #{String(student?.usnSequence || 7).padStart(3, "0")}
          </span>
          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
            DOB: {formatDateOfBirth(student?.dateOfBirth)}
          </span>
        </div>
      </div>

      {/* 3. STATUS CARDS (UNIFORM GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Attendance Health */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              ATTENDANCE HEALTH
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full px-2.5 py-0.5 text-xs font-medium">
              On Track (≥ 75%)
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">
              {attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              40 of 48 sessions attended
            </p>
          </div>
        </div>

        {/* Card 2: Fee Status */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              FEE BALANCE
            </span>
            <Link
              href="/student/fees"
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
            >
              Statement →
            </Link>
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
              {formatINR(pendingFee)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              {formatINR(totalPaidFee)} paid of {formatINR(totalBilledFee)} annual tuition
            </p>
          </div>
        </div>

        {/* Card 3: Next Assessment */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              NEXT ASSESSMENT
            </span>
            <span className="bg-zinc-100 text-zinc-600 rounded-full px-2.5 py-0.5 text-xs font-medium">
              Internal Exam
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              IA-2 Series
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Starts Monday, Oct 12 · Autonomous Scheme
            </p>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S CLASSES SECTION */}
      <div className="space-y-4">
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
              className="bg-white rounded-xl border border-zinc-200/70 p-4 hover:border-zinc-300 transition-colors flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-zinc-900 text-sm">{item.title}</span>
                  <span className="font-mono text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                    {item.code}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Instructor: {item.instructor}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-zinc-600">
                  {item.time}
                </span>
                <span className="font-mono bg-zinc-100 px-2 py-1 rounded-md text-xs font-medium text-zinc-800">
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
