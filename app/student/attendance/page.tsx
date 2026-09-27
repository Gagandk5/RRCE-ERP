"use client";

import React from "react";
import { ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function StudentAttendancePage() {
  const overallPercentage = 83.3;
  const totalHeld = 48;
  const totalAttended = 40;

  const subjectLedger = [
    {
      code: "25BC301",
      title: "Discrete Mathematics",
      held: 20,
      attended: 18,
      absent: 2,
      percentage: 90.0,
      margin: "+3 classes safe to miss",
      isEligible: true,
    },
    {
      code: "25BC302",
      title: "Data Structures & Algorithms",
      held: 16,
      attended: 14,
      absent: 2,
      percentage: 87.5,
      margin: "+2 classes safe to miss",
      isEligible: true,
    },
    {
      code: "25BC303",
      title: "Database Management Systems",
      held: 12,
      attended: 8,
      absent: 4,
      percentage: 66.7,
      margin: "Need 4 consecutive classes to reach 75%",
      isEligible: false,
    },
  ];

  return (
    <div className="space-y-6 text-xs text-zinc-900 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-zinc-900 tracking-tight">
            Attendance & VTU Eligibility Engine
          </h1>
          <p className="text-xs text-zinc-500 font-mono">
            Autonomous Minimum Criteria Compliance Ledger
          </p>
        </div>
        <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
          Overall Aggregate: {overallPercentage}%
        </div>
      </div>

      {/* OVERALL VTU METRIC BANNER */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>VTU Belagavi Autonomous Invariant</span>
          </div>
          <span className="font-mono text-xs font-bold text-zinc-700">
            {totalAttended} / {totalHeld} Total Sessions
          </span>
        </div>
        <p className="text-zinc-600 text-xs leading-relaxed">
          Minimum <strong>75% aggregate and subject-wise attendance</strong> is strictly mandated by VTU regulations to qualify for the Semester End Examination (SEE) hall ticket issuance.
        </p>
      </div>

      {/* SUBJECT-WISE ATTENDANCE LEDGER TABLE */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <span className="font-semibold text-zinc-900 text-xs">
            Subject-Wise Attendance & Margin Calculator
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Real-time VTU Eligibility Engine
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3">Course Code</th>
                <th className="py-2.5 px-3">Course Title</th>
                <th className="py-2.5 px-3 text-center">Held</th>
                <th className="py-2.5 px-3 text-center">Attended</th>
                <th className="py-2.5 px-3 text-center">Absent</th>
                <th className="py-2.5 px-3 text-center">Percentage</th>
                <th className="py-2.5 px-3">Safety Margin / Bunk Calculator</th>
                <th className="py-2.5 px-3 text-right">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {subjectLedger.map((sub, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    !sub.isEligible ? "bg-rose-50/50 hover:bg-rose-50/80" : "hover:bg-zinc-50/80"
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">
                    {sub.code}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900">
                    {sub.title}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                    {sub.held}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                    {sub.attended}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-500">
                    {sub.absent}
                  </td>
                  <td className={`py-2.5 px-3 text-center font-mono font-bold ${!sub.isEligible ? "text-rose-700" : "text-zinc-900"}`}>
                    {sub.percentage.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`font-mono text-xs font-semibold ${!sub.isEligible ? "text-rose-700" : "text-emerald-700"}`}>
                      {sub.margin}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        sub.isEligible
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {sub.isEligible ? "Eligible" : "Shortage Warning"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
