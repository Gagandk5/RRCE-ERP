"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Download, CheckCircle2, AlertCircle } from "lucide-react";
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
  const isEligibleForExams = attendancePercentage >= 75;

  const pendingFee = invoice ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 35000;
  const totalBilledFee = invoice?.totalAmount || 85000;
  const totalPaidFee = invoice?.paidAmount || 50000;

  const todaySchedule = [
    {
      time: "09:00 - 10:00",
      code: "25BC301",
      subject: "Discrete Mathematics",
      faculty: "Prof. Sunitha Sharma",
      room: "LH-201",
      status: "Completed",
      statusType: "completed",
    },
    {
      time: "10:00 - 11:00",
      code: "25BC302",
      subject: "Data Structures & Algorithms",
      faculty: "Dr. Praveen Gowda",
      room: "LH-201",
      status: "In Progress",
      statusType: "active",
    },
    {
      time: "11:15 - 12:15",
      code: "25BC303",
      subject: "Database Management Systems",
      faculty: "Prof. Kavitha N",
      room: "Lab-3",
      status: "Upcoming",
      statusType: "upcoming",
    },
    {
      time: "14:00 - 16:00",
      code: "25BCL31",
      subject: "Data Structures Practical Lab",
      faculty: "Dr. Praveen Gowda",
      room: "Computer Lab 2",
      status: "Scheduled",
      statusType: "upcoming",
    },
  ];

  const subjectAttendance = [
    {
      code: "25BC301",
      name: "Discrete Mathematics",
      conducted: 20,
      attended: 18,
      percentage: 90.0,
      isShortage: false,
    },
    {
      code: "25BC302",
      name: "Data Structures & Algorithms",
      conducted: 16,
      attended: 14,
      percentage: 87.5,
      isShortage: false,
    },
    {
      code: "25BC303",
      name: "Database Management Systems",
      conducted: 12,
      attended: 8,
      percentage: 66.7,
      isShortage: true,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6 text-xs text-zinc-900 font-sans">
      {/* 2. PAGE HEADER & METADATA STRIP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Academic Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {receipt && (
              <button
                onClick={() => window.print()}
                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded transition-colors flex items-center gap-1.5 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Payment Receipt</span>
              </button>
            )}
          </div>
        </div>

        {/* METADATA STRIP */}
        <div className="bg-zinc-50 border border-zinc-200 rounded p-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-600">
          <div>
            <span className="text-zinc-400">Branch & Term: </span>
            <strong className="text-zinc-900 font-medium">BCA — 3rd Sem (Sec A)</strong>
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
            <span className="text-zinc-400">Roll Sequence: </span>
            <strong className="font-mono text-zinc-900">#{String(student?.usnSequence || 7).padStart(3, "0")}</strong>
          </div>
          <div>
            <span className="text-zinc-400">Date of Birth: </span>
            <strong className="font-mono text-zinc-900">{formatDateOfBirth(student?.dateOfBirth)}</strong>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded border bg-emerald-50 text-emerald-900 border-emerald-200 text-xs flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* 3. RESTRAINED SEGMENTED SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-zinc-200 rounded-lg divide-y md:divide-y-0 md:divide-x divide-zinc-200 bg-white shadow-sm">
        {/* Metric 1: Attendance */}
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Overall Attendance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-zinc-900">{attendedClasses} / {totalClasses}</span>
            <span className="text-xs font-mono font-bold text-zinc-600">({attendancePercentage}%)</span>
          </div>
          <div className="pt-0.5">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                isEligibleForExams
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {isEligibleForExams ? "Eligible for Exams" : "Shortage Alert"}
            </span>
          </div>
        </div>

        {/* Metric 2: Fee Dues */}
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Tuition Fee Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-amber-700">{formatINR(pendingFee)}</span>
            <span className="text-[10px] text-zinc-400 font-mono">Pending</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-zinc-500 font-mono">
              Paid {formatINR(totalPaidFee)} of {formatINR(totalBilledFee)}
            </span>
            {pendingFee > 0 && (
              <button
                onClick={() => setPayModalOpen(true)}
                className="text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-white px-2.5 py-0.5 rounded transition-colors"
              >
                Pay Balance
              </button>
            )}
          </div>
        </div>

        {/* Metric 3: Current Semester */}
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Current Scheme
          </span>
          <div className="text-lg font-bold text-zinc-900">
            Semester 3 (ODD)
          </div>
          <span className="text-[10px] text-zinc-500 block">
            VTU Autonomous Scheme 2025–26
          </span>
        </div>

        {/* Metric 4: Next Exam */}
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Next Examination
          </span>
          <div className="text-lg font-bold text-zinc-900">
            IA-2 Series
          </div>
          <span className="text-[10px] text-zinc-500 block font-mono">
            Starts Oct 12, 2026
          </span>
        </div>
      </div>

      {/* 4. PRIMARY CONTENT: STRUCTURED DATA TABLES */}
      <div className="space-y-6">
        {/* SECTION A: TODAY'S SCHEDULE */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm space-y-0">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 text-xs">
              Today's Class Schedule (Monday)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              4 Sessions Scheduled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Course Code & Subject</th>
                  <th className="py-2.5 px-3">Faculty</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {todaySchedule.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-700">
                      {item.time}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-zinc-900">{item.subject}</span>
                      <span className="font-mono text-zinc-500 ml-2 text-[11px]">({item.code})</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600">
                      {item.faculty}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-700">
                      {item.room}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                          item.statusType === "completed"
                            ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                            : item.statusType === "active"
                            ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION B: SUBJECT-WISE ATTENDANCE BREAKDOWN */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm space-y-0">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 text-xs">
              Subject-wise Attendance Ledger
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Minimum Required: 75%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Name</th>
                  <th className="py-2.5 px-3 text-center">Conducted</th>
                  <th className="py-2.5 px-3 text-center">Attended</th>
                  <th className="py-2.5 px-3 text-center">Percentage</th>
                  <th className="py-2.5 px-3 text-right">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {subjectAttendance.map((sub, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      sub.isShortage ? "bg-rose-50/50 hover:bg-rose-50/80" : "hover:bg-zinc-50/80"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">
                      {sub.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-zinc-900">
                      {sub.name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                      {sub.conducted}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                      {sub.attended}
                    </td>
                    <td className={`py-2.5 px-3 text-center font-mono font-bold ${sub.isShortage ? "text-rose-700" : "text-zinc-900"}`}>
                      {sub.percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                          sub.isShortage
                            ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {sub.isShortage ? "Shortage Warning" : "Eligible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ONLINE PAYMENT MODAL */}
      {payModalOpen && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full shadow-md border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Tuition Fee Online Payment Gateway
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  RRCE Autonomous Cashier
                </p>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div className="p-3 bg-zinc-50 rounded border border-zinc-200 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Invoice:</span>
                  <span className="font-bold text-zinc-800">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Billed:</span>
                  <span className="font-bold text-zinc-800">{formatINR(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Remaining Due:</span>
                  <span className="font-bold text-amber-700">
                    {formatINR(Math.max(0, invoice.totalAmount - invoice.paidAmount))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={Math.max(1000, invoice.totalAmount - invoice.paidAmount)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded text-sm font-mono font-bold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying || payAmount <= 0}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-semibold text-xs disabled:opacity-50 transition-colors flex items-center gap-2"
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
