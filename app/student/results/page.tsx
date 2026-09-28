"use client";

import React, { useState } from "react";
import { Award, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";

export default function StudentResultsPage() {
  const [semesters] = useState([
    { sem: "Semester 3 (Current)", sgpa: "8.75", credits: 24, status: "PASSED WITH DISTINCTION", date: "Sep 2026" },
    { sem: "Semester 2", sgpa: "8.95", credits: 22, status: "PASSED WITH DISTINCTION", date: "Jun 2026" },
    { sem: "Semester 1", sgpa: "8.80", credits: 22, status: "PASSED WITH DISTINCTION", date: "Jan 2026" },
  ]);

  const [subjectGrades] = useState([
    { code: "BCA301", title: "Database Management Systems", cie: 44, see: 88, total: 92, grade: "S", gradePoints: 10, credits: 4, result: "P" },
    { code: "BCA302", title: "Object Oriented Programming with Java", cie: 42, see: 82, total: 86, grade: "A+", gradePoints: 9, credits: 4, result: "P" },
    { code: "BCA303", title: "Data Structures & Algorithms", cie: 45, see: 90, total: 94, grade: "S", gradePoints: 10, credits: 4, result: "P" },
    { code: "BCA304", title: "Operating Systems & Shell Scripting", cie: 38, see: 76, total: 80, grade: "A", gradePoints: 8, credits: 4, result: "P" },
    { code: "BCA305P", title: "Java & DBMS Laboratory", cie: 48, see: 96, total: 97, grade: "S", gradePoints: 10, credits: 4, result: "P" },
    { code: "BCA306", title: "Discrete Mathematics & Logic", cie: 40, see: 78, total: 82, grade: "A", gradePoints: 8, credits: 4, result: "P" },
  ]);

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-lg font-semibold tracking-tight">Examination Results & Performance</h1>
        <p className="mt-0.5 text-xs text-zinc-500">Official VTU semester grade sheets and cumulative performance ledger</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Cumulative GPA (CGPA)</span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 mt-1 block">8.83</span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> Top 5% of Batch
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Latest SGPA (Sem 3)</span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 mt-1 block">8.75</span>
            <span className="text-[11px] text-zinc-500 mt-1 block">24 Credits Earned</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Degree Status</span>
            <span className="text-sm font-semibold tracking-tight text-emerald-700 mt-1 block">PASSED WITH DISTINCTION</span>
            <span className="text-[11px] text-zinc-500 mt-1 block">Zero Backlogs</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Semester Grade Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {semesters.map((s) => (
            <div key={s.sem} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">{s.sem}</span>
                <span className="text-[10px] text-zinc-400">{s.date}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-zinc-900">{s.sgpa} <span className="text-xs font-normal text-zinc-500">SGPA</span></span>
                <span className="text-xs text-zinc-600 font-mono">{s.credits} Credits</span>
              </div>
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Semester 3 Detailed Marksheet</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Breakdown of Internal (CIE) and Semester End (SEE) marks</p>
          </div>
          <span className="text-xs font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded">
            USN: 1RR25BC007
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-600">
              <tr>
                <th className="px-4 py-2.5">Course Code</th>
                <th className="px-4 py-2.5">Course Title</th>
                <th className="px-4 py-2.5 text-center">CIE (50)</th>
                <th className="px-4 py-2.5 text-center">SEE (50)</th>
                <th className="px-4 py-2.5 text-center">Total (100)</th>
                <th className="px-4 py-2.5 text-center">Grade</th>
                <th className="px-4 py-2.5 text-center">Grade Points</th>
                <th className="px-4 py-2.5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
              {subjectGrades.map((subject) => (
                <tr key={subject.code} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900">{subject.code}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{subject.title}</td>
                  <td className="px-4 py-3 text-center font-mono">{subject.cie}</td>
                  <td className="px-4 py-3 text-center font-mono">{subject.see}</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-zinc-900">{subject.total}</td>
                  <td className="px-4 py-3 text-center font-bold text-sky-700">{subject.grade}</td>
                  <td className="px-4 py-3 text-center font-mono">{subject.gradePoints}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2 py-0.5 text-[11px]">
                      Pass
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
