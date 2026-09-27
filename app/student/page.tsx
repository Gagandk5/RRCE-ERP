"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, CheckCircle2, Calendar, FileText, Bell } from "lucide-react";
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
      console.error("Failed to load overview:", e);
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
  const isEligible = attendancePercentage >= 75;

  const pendingFee = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 35000;
  const totalBilledFee = invoice?.totalAmount || 85000;
  const totalPaidFee = invoice?.paidAmount || 50000;

  const todaySchedule = [
    { time: "09:00 - 10:00", subject: "Discrete Mathematics (25BC301)", faculty: "Prof. Sunitha Sharma", room: "LH-201", status: "Completed" },
    { time: "10:00 - 11:00", subject: "Data Structures & Algorithms (25BC302)", faculty: "Dr. Praveen Gowda", room: "LH-201", status: "In Progress" },
    { time: "11:15 - 12:15", subject: "Database Management Systems (25BC303)", faculty: "Prof. Kavitha N", room: "Lab-3", status: "Upcoming" },
    { time: "14:00 - 16:00", subject: "Data Structures Practical Lab (25BCL31)", faculty: "Dr. Praveen Gowda", room: "Computer Lab 2", status: "Scheduled" },
  ];

  const notices = [
    { title: "IA-2 Internal Assessment Timetable Published", date: "26 Sep 2025", desc: "Second Internal Assessment for BCA 3rd Sem commences October 12th." },
    { title: "VTU Examination Fee Registration Deadline", date: "05 Oct 2025", desc: "Online exam fee submission portal closes on Oct 10th for Dec 2025 SEE." },
    { title: "Inter-Department Hackathon Registration", date: "22 Sep 2025", desc: "Register 4-member teams at the Department of Computer Applications." },
  ];

  return (
    <div className="space-y-6 text-xs text-zinc-900 font-sans">
      {/* IDENTITY METADATA STRIP */}
      <div className="bg-white border border-zinc-200 rounded-md p-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-600 shadow-xs">
        <div>
          <span className="text-zinc-400">Student Name: </span>
          <strong className="text-zinc-900 font-semibold">{student?.user?.firstName || "Gagan"} {student?.user?.lastName || "D K"}</strong>
        </div>
        <div>
          <span className="text-zinc-400">USN: </span>
          <strong className="font-mono text-zinc-900">{student?.usn || "1RR25BC007"}</strong>
        </div>
        <div>
          <span className="text-zinc-400">Quota: </span>
          <strong className="text-zinc-900 font-medium">{student?.quota || "KCET"}</strong>
        </div>
        <div>
          <span className="text-zinc-400">Roll No: </span>
          <strong className="font-mono text-zinc-900">#{String(student?.usnSequence || 7).padStart(3, "0")}</strong>
        </div>
        <div>
          <span className="text-zinc-400">Date of Birth: </span>
          <strong className="font-mono text-zinc-900">{formatDateOfBirth(student?.dateOfBirth)}</strong>
        </div>
      </div>

      {/* 4-SEGMENT KEY STATUS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-zinc-200 rounded-lg divide-y md:divide-y-0 md:divide-x divide-zinc-200 bg-white shadow-xs">
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Overall Attendance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-zinc-900">{attendancePercentage}%</span>
            <span className="text-xs font-mono text-zinc-500">({attendedClasses}/{totalClasses})</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
            Eligible for Exams
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Tuition Fee Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-amber-700">{formatINR(pendingFee)}</span>
            <span className="text-[10px] text-zinc-400">Pending</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono block">
            Paid {formatINR(totalPaidFee)} of {formatINR(totalBilledFee)}
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Faculty Proctor / Mentor
          </span>
          <div className="text-sm font-bold text-zinc-900">
            Dr. Praveen Gowda
          </div>
          <span className="text-[10px] text-zinc-500 block">
            Dept of Computer Applications
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Next Milestone
          </span>
          <div className="text-sm font-bold text-zinc-900">
            IA-2 Exam Series
          </div>
          <span className="text-[10px] text-zinc-500 block font-mono">
            Commences Oct 12, 2026
          </span>
        </div>
      </div>

      {/* SPLIT GRID: TODAY'S SCHEDULE + NOTICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: TODAY'S CLASSES */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 text-xs">
              Today's Classes (Monday)
            </span>
            <Link href="/student/timetable" className="text-[11px] font-semibold text-blue-600 hover:text-blue-800">
              Full Timetable →
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {todaySchedule.map((c, idx) => (
              <div key={idx} className="p-3 hover:bg-zinc-50/80 transition-colors space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">{c.subject}</span>
                  <span className="font-mono text-[11px] text-zinc-500">{c.time}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                  <span>Faculty: {c.faculty}</span>
                  <span className="font-mono font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                    {c.room}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: OFFICIAL NOTICE BOARD */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 text-xs">
              Campus Deadlines & Notices
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              Official Bulletin
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {notices.map((n, idx) => (
              <div key={idx} className="p-3 space-y-1 hover:bg-zinc-50/80 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">{n.title}</span>
                  <span className="font-mono text-[10px] text-zinc-400">{n.date}</span>
                </div>
                <p className="text-zinc-600 text-[11px] leading-relaxed">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
