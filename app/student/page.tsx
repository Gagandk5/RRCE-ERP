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

  const attendancePercentage = 83.3;
  const totalClasses = 48;
  const attendedClasses = 40;

  const pendingFee = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 35000;
  const totalBilledFee = invoice?.totalAmount || 85000;
  const totalPaidFee = invoice?.paidAmount || 50000;

  const todayClasses = [
    { time: "09:00 - 10:00 AM", code: "25BC301", title: "Discrete Mathematics", instructor: "Prof. Sunitha Sharma", room: "LH-201", status: "Completed" },
    { time: "10:00 - 11:00 AM", code: "25BC302", title: "Data Structures & Algorithms", instructor: "Dr. Praveen Gowda", room: "LH-201", status: "In Progress" },
    { time: "11:15 - 12:15 PM", code: "25BC303", title: "Database Management Systems", instructor: "Prof. Kavitha N", room: "Lab-3", status: "Upcoming" },
    { time: "02:00 - 04:00 PM", code: "25BCL31", title: "Data Structures Practical Lab", instructor: "Dr. Praveen Gowda", room: "Computer Lab 2", status: "Scheduled" },
  ];

  return (
    <div className="space-y-8 text-zinc-900 font-sans">
      {/* STUDENT SUMMARY STRIP */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 flex flex-wrap items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-zinc-900">
              {student?.user?.firstName || "Gagan"} {student?.user?.lastName || "D K"}
            </h1>
            <span className="font-mono text-xs font-medium text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200/80">
              {student?.usn || "1RR25BC007"}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Bachelor of Computer Applications • 3rd Semester
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-full px-3.5 py-1 font-medium">
            Quota: {student?.quota || "KCET"}
          </span>
          <span className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-full px-3.5 py-1 font-medium font-mono">
            Roll #{String(student?.usnSequence || 7).padStart(3, "0")}
          </span>
          <span className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-full px-3.5 py-1 font-medium">
            DOB: {formatDateOfBirth(student?.dateOfBirth)}
          </span>
        </div>
      </div>

      {/* QUICK STATS - 3 CARD ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Attendance */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Attendance Health
            </span>
            <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium border border-emerald-100">
              On Track (≥ 75%)
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">
              {attendancePercentage}%
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {attendedClasses} of {totalClasses} sessions attended
            </p>
          </div>
        </div>

        {/* Stat 2: Fee Balance */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Fee Balance
            </span>
            <Link
              href="/student/fees"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Details →
            </Link>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-amber-700 tracking-tight">
              {formatINR(pendingFee)}
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              {formatINR(totalPaidFee)} paid of {formatINR(totalBilledFee)} total
            </p>
          </div>
        </div>

        {/* Stat 3: Next Exam */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Next Assessment
            </span>
            <span className="bg-zinc-100 text-zinc-600 rounded-full px-3 py-1 text-xs font-medium border border-zinc-200/60">
              Internal Exam
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              IA-2 Series
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Starts Monday, Oct 12
            </p>
          </div>
        </div>
      </div>

      {/* TODAY'S CLASSES MODULE */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-7 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Today's Teaching Schedule
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Monday Class Lectures & Practical Labs
            </p>
          </div>
          <Link href="/student/timetable" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
            View Weekly Schedule →
          </Link>
        </div>

        <div className="space-y-4">
          {todayClasses.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-50/60 border border-zinc-100 flex items-center justify-between hover:bg-zinc-50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-900 text-sm">{item.title}</span>
                  <span className="font-mono text-xs text-zinc-400 bg-white px-2 py-0.5 rounded-md border border-zinc-200/60">
                    {item.code}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Instructor: {item.instructor}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-medium text-zinc-600">
                  {item.time}
                </span>
                <span className="font-mono text-xs font-bold text-zinc-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-xs">
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
