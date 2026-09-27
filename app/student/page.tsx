"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Download,
  QrCode,
  User,
  LogOut,
  Bell,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function StudentPortal() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(35000);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

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
          const pending = Math.max(0, profile.invoices[0].totalAmount - profile.invoices[0].paidAmount);
          setPayAmount(pending > 0 ? pending : 0);
        }
        setLoading(false);
        return;
      }

      const stRes = await fetch("/api/students?dept=BCA");
      if (stRes.ok) {
        const sData = await stRes.json();
        const roster = sData.students || [];

        const targetUsn = (currentUser?.usn || currentUser?.username || "").toLowerCase().trim();
        const targetId = (currentUser?.studentId || currentUser?.userId || "").toLowerCase().trim();
        const targetName = (currentUser?.firstName || "").toLowerCase().trim();

        const match =
          roster.find((s: any) => {
            const sUsn = (s.usn || "").toLowerCase().trim();
            const sUsername = (s.user?.username || "").toLowerCase().trim();
            const sId = (s.id || "").toLowerCase().trim();
            const sUserId = (s.userId || "").toLowerCase().trim();
            const sName = (s.user?.firstName || "").toLowerCase().trim();

            return (
              (targetUsn && (sUsn === targetUsn || sUsername === targetUsn)) ||
              (targetId && (sId === targetId || sUserId === targetId)) ||
              (targetName && sName === targetName)
            );
          }) || roster[0];

        setStudent(match);
        if (match?.invoices?.length > 0) {
          setInvoice(match.invoices[0]);
          const pending = Math.max(0, match.invoices[0].totalAmount - match.invoices[0].paidAmount);
          setPayAmount(pending > 0 ? pending : 0);
        }
      }
    } catch (e) {
      console.error("Failed to load student portal:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  async function handleSimulatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    setPaying(true);
    setMessage(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: payAmount,
          paymentMethod: "UPI_GATEWAY",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Payment of ₹${payAmount.toLocaleString("en-IN")} processed successfully.`);
        setInvoice(data.invoice);
        setReceipt({
          receiptNumber: `REC-2025-${Math.floor(100000 + Math.random() * 900000)}`,
          paidAmount: payAmount,
          date: new Date().toLocaleDateString("en-IN"),
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          usn: student.usn,
          invoiceNumber: invoice.invoiceNumber,
        });
        setPayModalOpen(false);
      } else {
        setMessage(data.error || "Payment processing failed.");
      }
    } catch {
      setMessage("Failed to reach payment gateway.");
    } finally {
      setPaying(false);
    }
  }

  const attendancePercentage = 84;
  const totalClasses = 48;
  const attendedClasses = 40;
  const isBelowVTUThreshold = attendancePercentage < 75;

  const todayClasses = [
    {
      time: "09:00 AM - 10:00 AM",
      subject: "Discrete Mathematics",
      code: "25BC301",
      faculty: "Prof. Sunitha Sharma",
      room: "LH-201",
      status: "COMPLETED",
    },
    {
      time: "10:00 AM - 11:00 AM",
      subject: "Data Structures & Algorithms",
      code: "25BC302",
      faculty: "Dr. Praveen Gowda",
      room: "LH-201",
      status: "UPCOMING",
    },
    {
      time: "11:15 AM - 12:15 PM",
      subject: "Database Management Systems",
      code: "25BC303",
      faculty: "Prof. Kavitha N",
      room: "Lab-3",
      status: "SCHEDULED",
    },
    {
      time: "02:00 PM - 04:00 PM",
      subject: "Data Structures Practical Lab",
      code: "25BCL31",
      faculty: "Dr. Praveen Gowda",
      room: "Computer Lab 2",
      status: "SCHEDULED",
    },
  ];

  const announcements = [
    {
      id: "1",
      title: "IA-2 Test Timetable Published",
      date: "26 Sep 2025",
      category: "Exams",
      content: "The Second Internal Assessment for BCA 3rd Semester will commence on October 12th.",
    },
    {
      id: "2",
      title: "Tuition Fee Installment Reminder",
      date: "24 Sep 2025",
      category: "Accounts",
      content: "Students with pending fee balance are advised to pay online before Oct 31.",
    },
    {
      id: "3",
      title: "Inter-College Hackathon Registration",
      date: "22 Sep 2025",
      category: "Events",
      content: "Register 4-member teams at Department of Computer Applications by Friday.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 text-xs">
      {/* GROUNDED HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center shrink-0 border border-slate-700">
            <img src="/images.svg" alt="RRCE Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Student Portal • {student?.user?.firstName || "Student"} {student?.user?.lastName || ""}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              USN: {student?.usn || "1RR25BC007"} • BCA Semester 3 (Section A) • RRCE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-md border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ID Card</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-semibold px-3 py-2 rounded-md border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Attendance Rate</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${isBelowVTUThreshold ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
              {attendancePercentage}%
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {attendedClasses} <span className="text-xs font-normal text-slate-400">/ {totalClasses} Sessions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            VTU Criteria: Minimum 75% Required
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Fee Status</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
              {invoice?.status || "PENDING"}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatINR(invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 35000)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Paid {formatINR(invoice?.paidAmount || 50000)} of {formatINR(invoice?.totalAmount || 85000)}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Academic Term</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
              Active
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            BCA Sem 3
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Academic Year 2025-2026
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Next Exam</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px]">
              Oct 12
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            IA-2 Series
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Internal Assessment Examination
          </p>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: TIMETABLE & SUBJECT ATTENDANCE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Today's Class Schedule</h2>
                <p className="text-xs text-slate-500">Monday Timetable</p>
              </div>
              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                4 Sessions
              </span>
            </div>

            <div className="space-y-2.5">
              {todayClasses.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border ${
                    c.status === "UPCOMING"
                      ? "bg-blue-50/80 border-blue-200"
                      : c.status === "COMPLETED"
                      ? "bg-slate-50 border-slate-200 opacity-80"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{c.subject}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {c.code}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        c.status === "UPCOMING"
                          ? "bg-blue-600 text-white"
                          : c.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.status === "UPCOMING" ? "Next Class" : c.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1 font-medium font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {c.time}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {c.faculty}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {c.room}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Attendance Breakdown by Subject</h2>
                <p className="text-xs text-slate-500">VTU Exam Eligibility Requirement: 75%</p>
              </div>
              <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono">
                Overall: {attendancePercentage}%
              </span>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md">
              <strong className="block font-bold mb-0.5">VTU Eligibility Status: Compliant</strong>
              Current attendance rate is 84%. Allowable absence quota remaining: 2 sessions.
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Discrete Mathematics (25BC301)</span>
                  <span className="text-emerald-700 font-mono">18/20 (90%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "90%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Data Structures & Algorithms (25BC302)</span>
                  <span className="text-emerald-700 font-mono">14/16 (87.5%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "87.5%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>Database Management Systems (25BC303)</span>
                  <span className="text-amber-700 font-mono">8/12 (66.7%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: "66.7%" }}></div>
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Requires 2 additional attended sessions to reach 75%.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: IDENTITY CARD + NOTICES + FEE BILLING */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-lg p-5 shadow-sm border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <img src="/images.svg" alt="RRCE Emblem" className="w-7 h-7 object-contain bg-white p-1 rounded shrink-0" />
                <div>
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                    Rajarajeswari College of Engg.
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Autonomous Institution • VTU</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                2025-26
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
                <User className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {student?.user?.firstName} {student?.user?.lastName}
                </h2>
                <div className="inline-block font-mono text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 mt-0.5">
                  {student?.usn}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  BCA Semester {student?.currentSemester || 3} (Sec A)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/60 p-2.5 rounded border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Date of Birth:</span>
                <span className="font-semibold text-white font-mono">
                  {student?.dateOfBirth ? (typeof student.dateOfBirth === "string" && student.dateOfBirth.includes("-") ? student.dateOfBirth.split("-").reverse().join("/") : new Date(student.dateOfBirth).toLocaleDateString("en-GB")) : "14/12/2007"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Quota:</span>
                <span className="font-semibold text-white">{student?.quota || "KCET"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Roll Sequence:</span>
                <span className="font-mono font-bold text-slate-200">
                  #{String(student?.usnSequence || 7).padStart(3, "0")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Contact:</span>
                <span className="font-mono text-white">{student?.user?.phone || "+91 8971115212"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Valid through 2028-2029</span>
              <div className="flex items-center gap-1 font-mono text-white">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                <span>VTU-VERIFIED</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Campus Notices</h2>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Official
              </span>
            </div>

            <div className="space-y-2.5">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{a.title}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {a.category}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{a.content}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">{a.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Tuition Fee Statement</h2>
              </div>
              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                2025-26
              </span>
            </div>

            {invoice && (
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-bold text-slate-900">{formatINR(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid:</span>
                  <span className="font-bold text-emerald-700">{formatINR(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Remaining Balance:</span>
                  <span className="text-amber-700">
                    {formatINR(Math.max(0, invoice.totalAmount - invoice.paidAmount))}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setPayModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Tuition Fee Online</span>
            </button>

            {receipt && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <strong className="block font-bold">Receipt #{receipt.receiptNumber}</strong>
                  <span className="text-[11px] text-emerald-700 font-mono">Paid: {formatINR(receipt.paidAmount)}</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[11px] font-bold"
                >
                  Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {payModalOpen && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tuition Fee Online Payment Gateway
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    RRCE Autonomous Cashier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-bold text-slate-800">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-bold text-slate-800">{formatINR(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Due:</span>
                  <span className="font-bold text-amber-700">
                    {formatINR(Math.max(0, invoice.totalAmount - invoice.paidAmount))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={Math.max(1000, invoice.totalAmount - invoice.paidAmount)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying || payAmount <= 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {paying ? "Processing..." : `Pay ₹${payAmount.toLocaleString("en-IN")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
