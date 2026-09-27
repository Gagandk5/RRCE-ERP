"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Download,
  QrCode,
  ShieldCheck,
  User,
  LogOut,
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

      // 1. If currentUser has direct DB studentProfile attached from /api/auth/me
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

      // 2. Otherwise fetch BCA roster and match logged-in student robustly
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
        setMessage(`Payment of ₹${payAmount.toLocaleString("en-IN")} processed successfully!`);
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Clean Header with Sign Out */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-xl p-6 md:p-8 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider mb-1 border border-slate-700">
              VTU Autonomous Student Portal
            </div>
            <h1 className="text-xl font-bold text-white">
              Welcome, {student?.user?.firstName || "Student"} {student?.user?.lastName || ""}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              USN: {student?.usn || "1RR25BC007"} • Bachelor of Computer Applications (BCA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-400 block">Academic Standing:</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5" />
              Regular Enrolled
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Main Grid: Digital ID Card + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Clean Solid Student Identity Card */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white tracking-wide">
                  RAJARAJESWARI COLLEGE OF ENGG.
                </h3>
                <p className="text-[10px] text-slate-400">Autonomous Institution • VTU Belagavi</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                2025-26
              </span>
            </div>

            <div className="flex items-center gap-4 my-4">
              <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
                <User className="w-7 h-7 text-slate-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {student?.user?.firstName} {student?.user?.lastName}
                </h2>
                <div className="inline-block mt-0.5 font-mono text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {student?.usn}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  BCA • Semester {student?.currentSemester || 3} (Sec A)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/60 p-3 rounded-lg border border-slate-800 mt-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Date of Birth:</span>
                <span className="font-semibold text-white">
                  {student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-GB") : "14/12/2007"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Admission Quota:</span>
                <span className="font-semibold text-white">{student?.quota || "KCET"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Roll Sequence:</span>
                <span className="font-mono font-bold text-slate-200">
                  #{String(student?.usnSequence || 7).padStart(3, "0")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Emergency Contact:</span>
                <span className="font-mono text-white">{student?.user?.phone || "+91 8971115212"}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Valid through 2028-2029</span>
            <div className="flex items-center gap-1 font-mono text-white">
              <QrCode className="w-4 h-4 text-slate-400" />
              <span>VTU-VERIFIED</span>
            </div>
          </div>
        </div>

        {/* RIGHT: ATTENDANCE ANALYTICS */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attendance Compliance</h3>
                <p className="text-xs text-slate-500">Autonomous VTU requirement: Minimum 75% attendance</p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded border ${
                  isBelowVTUThreshold
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {attendancePercentage}% Overall
              </span>
            </div>

            {isBelowVTUThreshold ? (
              <div className="p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs flex items-start gap-2.5 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">NSAR / Exam Hall Ticket Warning!</strong>
                  Your attendance is below the mandatory 75% autonomous threshold. Immediate condonation or makeup classes required.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2 mb-4 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Eligibility Good: Above VTU 75% Exam Criterion.</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-700 pb-1 border-b border-slate-100">
                <span>Discrete Mathematics (25BC301)</span>
                <span className="font-bold text-slate-900">18 / 20 (90%)</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-slate-700 pb-1 border-b border-slate-100">
                <span>Data Structures & Algorithms (25BC302)</span>
                <span className="font-bold text-slate-900">14 / 16 (87.5%)</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-slate-700 pb-1 border-b border-slate-100">
                <span>Database Management Systems (25BC303)</span>
                <span className="font-bold text-slate-900">8 / 12 (66.7% - Warning)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Sessions Attended: {attendedClasses} of {totalClasses}</span>
            <span className="text-slate-600 font-semibold">Updated Today</span>
          </div>
        </div>
      </div>

      {/* FEE INVOICE SECTION */}
      <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded mb-1 border border-slate-200">
              <CreditCard className="w-3.5 h-3.5" />
              Annual Tuition Fee Billing
            </div>
            <h2 className="text-lg font-bold text-slate-900">Fee Invoices & Payment Portal</h2>
            <p className="text-xs text-slate-500">
              Standard VTU BCA Annual Fee: ₹85,000 for Academic Year 2025-26
            </p>
          </div>

          <button
            onClick={() => setPayModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Tuition Fee Online</span>
          </button>
        </div>

        {invoice && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Invoice Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Billed</span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(invoice.totalAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Paid Amount</span>
              <span className="font-bold text-emerald-700 text-sm">{formatINR(invoice.paidAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Outstanding Balance</span>
              <span className="font-bold text-amber-700 text-sm">
                {formatINR(Math.max(0, invoice.totalAmount - invoice.paidAmount))}
              </span>
            </div>
          </div>
        )}

        {receipt && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-xs text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Official RRCE Payment Receipt Generated
              </div>
              <p className="text-[11px] text-emerald-700">
                Receipt #{receipt.receiptNumber} • Paid: {formatINR(receipt.paidAmount)} on {receipt.date} for USN {receipt.usn}.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print Fee Receipt</span>
            </button>
          </div>
        )}
      </div>

      {payModalOpen && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tuition Fee Payment Gateway
                  </h3>
                  <p className="text-xs text-slate-500">
                    RRCE Autonomous Online Cashier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</span>
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
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying || payAmount <= 0}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {paying ? "Processing UPI..." : `Pay ₹${payAmount.toLocaleString("en-IN")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
