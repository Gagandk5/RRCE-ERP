"use client";

import React from "react";

export default function StudentAttendancePage() {
  const overallPercentage = 83.3;

  const subjectLedger = [
    {
      code: "25BC301",
      title: "Discrete Mathematics",
      held: 20,
      attended: 18,
      absent: 2,
      percentage: 90.0,
      margin: "3 classes safe to miss",
      isEligible: true,
    },
    {
      code: "25BC302",
      title: "Data Structures & Algorithms",
      held: 16,
      attended: 14,
      absent: 2,
      percentage: 87.5,
      margin: "2 classes safe to miss",
      isEligible: true,
    },
    {
      code: "25BC303",
      title: "Database Management Systems",
      held: 12,
      attended: 8,
      absent: 4,
      percentage: 66.7,
      margin: "Need 4 classes to reach 75%",
      isEligible: false,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 text-zinc-900 font-sans max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 pb-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
            Attendance Ledger & Eligibility
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            VTU Autonomous Minimum 75% Requirement Criteria
          </p>
        </div>
        <span className="self-start sm:self-auto text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 font-mono">
          Aggregate: {overallPercentage}%
        </span>
      </div>

      {/* RELAXED AIRY TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-zinc-200/70 p-4 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Subject-Wise Attendance
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              40 of 48 total sessions attended across all subjects
            </p>
          </div>
        </div>

        {/* RESPONSIVE TABLE WRAPPER */}
        <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="min-w-[640px] w-full text-left border-collapse text-xs">
            <thead className="text-xs font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="pb-4 px-4">Subject & Code</th>
                <th className="pb-4 px-4 text-center">Sessions Attended</th>
                <th className="pb-4 px-4 text-center">Percentage</th>
                <th className="pb-4 px-4 text-center">VTU Status</th>
                <th className="pb-4 px-4 text-right">Margin / Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {subjectLedger.map((sub, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-zinc-900 text-sm">{sub.title}</div>
                    <div className="font-mono text-xs text-zinc-400 mt-0.5">{sub.code}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-zinc-800">
                    {sub.attended} / {sub.held}
                  </td>
                  <td className={`py-4 px-4 text-center font-mono text-sm font-bold ${sub.isEligible ? "text-zinc-900" : "text-rose-600"}`}>
                    {sub.percentage.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium border ${
                        sub.isEligible
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {sub.isEligible ? "On Track" : "Shortage Warning"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-xs text-zinc-500">
                    {sub.margin}
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
