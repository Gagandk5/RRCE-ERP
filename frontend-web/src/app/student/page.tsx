"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Clock,
  CheckCircle2,
  CreditCard,
  BookOpen,
} from "lucide-react";

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "attendance" | "fees" | "materials">("dashboard");

  const [attendance, setAttendance] = useState({
    percentage: 100.0,
    totalConducted: 24,
    attended: 24,
    excused: 0,
    absent: 0,
    isEligible: true,
  });

  const [simulateLowAttendance, setSimulateLowAttendance] = useState(false);

  const displayPercentage = simulateLowAttendance ? 62.5 : attendance.percentage;
  const isEligible = displayPercentage >= 75.0;

  const [schedule, setSchedule] = useState([
    {
      time: "09:00 - 10:00",
      code: "25BC101",
      title: "Discrete Mathematical Structures",
      faculty: "Prof. Ananya Sharma",
      room: "LH-204",
    },
    {
      time: "10:00 - 11:00",
      code: "25BC102",
      title: "Data Structures & Algorithms",
      faculty: "Prof. Chethan Kumar",
      room: "LH-204",
    },
    {
      time: "11:15 - 12:15",
      code: "25BC103",
      title: "Web Programming Lab",
      faculty: "Prof. Chethan Kumar",
      room: "Lab-3",
    },
  ]);

  const [invoices, setInvoices] = useState([
    {
      id: "inv-1",
      invoiceNumber: "INV-2026-BC-007",
      title: "BCA Semester 1 Tuition & VTU Registration",
      total: 85000,
      paid: 85000,
      status: "PAID",
      dueDate: "2026-10-31",
    },
  ]);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(15000);
  const [paySuccess, setPaySuccess] = useState(false);

  const materials = [
    {
      title: "Unit 1: Propositional Logic & Truth Tables",
      course: "Discrete Mathematics",
      unit: 1,
      size: "2.4 MB PDF",
      date: "Sep 20, 2026",
    },
    {
      title: "Unit 2: Linear Data Structures & Stack Implementations",
      course: "Data Structures",
      unit: 2,
      size: "4.1 MB PDF",
      date: "Sep 22, 2026",
    },
  ];

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    const attRes = await apiRequest("/student/my-attendance");
    if (attRes.data) {
      setAttendance({
        percentage: attRes.data.percentage ?? 100.0,
        totalConducted: attRes.data.totalConducted ?? 24,
        attended: attRes.data.attended ?? 24,
        excused: attRes.data.excused ?? 0,
        absent: attRes.data.absent ?? 0,
        isEligible: attRes.data.isEligible ?? true,
      });
    }

    const dashRes = await apiRequest("/student/dashboard");
    if (dashRes.data?.todaySchedule && dashRes.data.todaySchedule.length > 0) {
      setSchedule(
        dashRes.data.todaySchedule.map((s: any) => ({
          time: s.time,
          code: s.courseCode,
          title: s.courseName,
          faculty: s.facultyName,
          room: s.roomNumber,
        }))
      );
    }
  };

  const handleSimulatePayment = () => {
    setPaySuccess(true);
    setTimeout(() => {
      setShowPayModal(false);
      setPaySuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-md bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
            GR
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gagan R</h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                1RR25BC007
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              BCA • Semester 1 • Section A • CET Govt Quota
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "dashboard"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "attendance"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Subject Attendance
          </button>
          <button
            onClick={() => setActiveTab("fees")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "fees"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Fee Ledger
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "materials"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Study Materials
          </button>
        </div>
      </div>

      {/* Main Tab: Dashboard */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Circular Attendance Gauge Card */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm flex flex-col items-center justify-between text-center relative">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                VTU Attendance Status
              </span>
              <button
                onClick={() => setSimulateLowAttendance(!simulateLowAttendance)}
                className="text-[10px] text-slate-600 hover:text-slate-900 font-medium"
              >
                Test {simulateLowAttendance ? ">=75% Green" : "<75% Red"}
              </button>
            </div>

            {/* Clean SVG Circular Gauge Ring */}
            <div className="relative my-3 flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-100"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 64}
                  strokeDashoffset={2 * Math.PI * 64 * (1 - displayPercentage / 100)}
                  strokeLinecap="round"
                  className={`transition-all duration-500 ${
                    isEligible ? "text-emerald-600" : "text-rose-600"
                  }`}
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tabular-nums text-slate-900">
                  {displayPercentage}%
                </span>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider mt-1 px-2 py-0.5 rounded border ${
                    isEligible
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {isEligible ? "Exam Eligible" : "Shortage Warning"}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Conducted</span>
                <div className="text-xs font-bold tabular-nums text-slate-900 mt-0.5">{attendance.totalConducted}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Attended</span>
                <div className="text-xs font-bold tabular-nums text-emerald-700 mt-0.5">
                  {simulateLowAttendance ? "15" : attendance.attended}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Excused (OD)</span>
                <div className="text-xs font-bold tabular-nums text-slate-700 mt-0.5">{attendance.excused}</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Formula: <code className="text-slate-800 font-mono">(Attended + Excused) / Total * 100</code>. Minimum VTU threshold: 75.0%.
            </p>
          </div>

          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Today's Class Schedule</h3>
                <p className="text-xs text-slate-500">Chronological timetable for BCA Semester 1 Section A</p>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Semester 1
              </span>
            </div>

            <div className="space-y-2.5">
              {schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="p-2 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-900">{item.code}</span>
                        <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{item.faculty}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-700">{item.time}</span>
                    <span className="px-2 py-0.5 rounded bg-white text-slate-800 font-mono font-bold text-xs border border-slate-200">
                      {item.room}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Credits Registered:</span>
                <span className="font-bold text-slate-900">22 VTU Credits</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subject Attendance Breakdown */}
      {activeTab === "attendance" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Course-Wise Attendance Breakdown</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Course Code</th>
                  <th className="px-4 py-2.5">Course Title</th>
                  <th className="px-4 py-2.5">Faculty</th>
                  <th className="px-4 py-2.5">Conducted</th>
                  <th className="px-4 py-2.5">Attended</th>
                  <th className="px-4 py-2.5">Attendance %</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">25BC101</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">Discrete Mathematical Structures</td>
                  <td className="px-4 py-2.5 text-slate-600">Prof. Ananya Sharma</td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono">14</td>
                  <td className="px-4 py-2.5 text-emerald-700 font-mono font-bold">14</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">100.0%</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                      Eligible (&gt;=75%)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">25BC102</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">Data Structures and Algorithms</td>
                  <td className="px-4 py-2.5 text-slate-600">Prof. Chethan Kumar</td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono">10</td>
                  <td className="px-4 py-2.5 text-emerald-700 font-mono font-bold">10</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">100.0%</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                      Eligible (&gt;=75%)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fees & Ledger */}
      {activeTab === "fees" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Institutional Fee Invoices &amp; Ledger</h3>
              <p className="text-xs text-slate-500">Official tuition bills and online payment receipts</p>
            </div>
            <button
              onClick={() => setShowPayModal(true)}
              className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm"
            >
              Simulate Payment
            </button>
          </div>

          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">{inv.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Due Date: {inv.dueDate}</div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums text-slate-900">₹{inv.total.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Paid in full via Net Banking</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Study Materials */}
      {activeTab === "materials" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Course Notes &amp; LMS Materials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m, idx) => (
              <div key={idx} className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-900 font-bold">{m.course}</span>
                  <span className="text-slate-500">{m.size}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">{m.title}</div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-500">
                  <span>Uploaded: {m.date}</span>
                  <button className="text-slate-900 hover:underline font-semibold">Download PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-900">
              <CreditCard className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-bold text-slate-900">Digital Payment Gateway Simulation</h3>
            </div>

            {paySuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Payment Successful</h4>
                <p className="text-xs text-slate-500">Transaction Ref: RRCE-UPI-{Date.now().toString().slice(-6)}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Invoice Reference</label>
                  <div className="font-mono font-bold text-slate-900 text-xs bg-slate-50 p-2 rounded border border-slate-200">
                    INV-2026-BC-007
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Amount to Pay (INR)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleSimulatePayment}
                    className="py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm"
                  >
                    Pay via UPI (GPay / PhonePe)
                  </button>
                  <button
                    onClick={handleSimulatePayment}
                    className="py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shadow-sm"
                  >
                    Pay via Debit / Credit Card
                  </button>
                </div>

                <button
                  onClick={() => setShowPayModal(false)}
                  className="w-full py-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
