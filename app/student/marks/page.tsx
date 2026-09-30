"use client";

import React from "react";

export default function StudentMarksPage() {
  const cieLedger = [
    {
      code: "25BC301",
      title: "Discrete Mathematics",
      ia1: 22,
      ia2: 21,
      ia3: "-",
      assignment: 23,
      totalCie: 44.5,
      maxCie: 50,
      isEligible: true,
    },
    {
      code: "25BC302",
      title: "Data Structures & Algorithms",
      ia1: 20,
      ia2: 23,
      ia3: "-",
      assignment: 24,
      totalCie: 45.5,
      maxCie: 50,
      isEligible: true,
    },
    {
      code: "25BC303",
      title: "Database Management Systems",
      ia1: 18,
      ia2: 19,
      ia3: "-",
      assignment: 20,
      totalCie: 38.5,
      maxCie: 50,
      isEligible: true,
    },
    {
      code: "25BCL31",
      title: "Data Structures Practical Lab",
      ia1: 24,
      ia2: 24,
      ia3: "-",
      assignment: 25,
      totalCie: 48.5,
      maxCie: 50,
      isEligible: true,
    },
  ];

  return (
    <div className="space-y-6 text-xs text-zinc-900 font-sans max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-zinc-900 tracking-tight">
            Internal Marks & Continuous Internal Evaluation (CIE)
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            VTU Autonomous Scheme 2025-26 • Minimum 40% (20/50) CIE Cutoff for SEE
          </p>
        </div>
        <span className="self-start sm:self-auto font-mono text-xs font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded">
          Overall CIE Standing: Pass
        </span>
      </div>

      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-zinc-900 text-xs">
            Course-Wise CIE Breakdown (Internal Assessment Series)
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Max CIE Score: 50 Marks
          </span>
        </div>

        <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="min-w-[640px] w-full text-left border-collapse">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3">Course Code</th>
                <th className="py-2.5 px-3">Course Title</th>
                <th className="py-2.5 px-3 text-center">IA-1 (25)</th>
                <th className="py-2.5 px-3 text-center">IA-2 (25)</th>
                <th className="py-2.5 px-3 text-center">IA-3 (25)</th>
                <th className="py-2.5 px-3 text-center">Lab/Assignment (25)</th>
                <th className="py-2.5 px-3 text-center">CIE Total (50)</th>
                <th className="py-2.5 px-3 text-right">SEE Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {cieLedger.map((c, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">
                    {c.code}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900">
                    {c.title}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                    {c.ia1}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                    {c.ia2}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-400">
                    {c.ia3}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-700">
                    {c.assignment}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900">
                    {c.totalCie} / {c.maxCie}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        c.isEligible
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {c.isEligible ? "Qualified" : "Not Qualified"}
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
