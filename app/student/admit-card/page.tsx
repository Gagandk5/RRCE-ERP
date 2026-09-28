"use client";

import React, { useState } from "react";
import { Download, Printer, ShieldCheck, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function StudentAdmitCardPage() {
  const [examDetails] = useState({
    studentName: "Gagan D K",
    usn: "1RR25BC007",
    branch: "Bachelor of Computer Applications (BCA)",
    semester: "3rd Semester",
    examSession: "Odd Semester VTU Examinations - Nov/Dec 2026",
    examCenter: "RajaRajeswari College of Engineering (Center Code: 1RR)",
    hallNumber: "LH-304 (Main Academic Block, 3rd Floor)",
    status: "APPROVED",
  });

  const [schedule] = useState([
    { code: "BCA301", title: "Database Management Systems", date: "2026-11-16", time: "09:30 AM - 12:30 PM", invigilatorSign: "Verified" },
    { code: "BCA302", title: "Object Oriented Programming with Java", date: "2026-11-18", time: "09:30 AM - 12:30 PM", invigilatorSign: "Verified" },
    { code: "BCA303", title: "Data Structures & Algorithms", date: "2026-11-20", time: "09:30 AM - 12:30 PM", invigilatorSign: "Verified" },
    { code: "BCA304", title: "Operating Systems & Shell Scripting", date: "2026-11-23", time: "09:30 AM - 12:30 PM", invigilatorSign: "Verified" },
    { code: "BCA305P", title: "Java & DBMS Laboratory", date: "2026-11-25", time: "02:00 PM - 05:00 PM", invigilatorSign: "Verified" },
  ]);

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">VTU Hall Ticket / Admit Card</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Official hall ticket for end-semester university examinations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={() => alert("Downloading official hall ticket PDF...")}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-zinc-800"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-base tracking-wider">
              RRCE
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">RajaRajeswari College of Engineering</h2>
              <p className="text-xs text-zinc-500">Autonomous Institute • Affiliated to VTU Belagavi</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            VTU Approved & Validated
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Candidate Name</span>
            <span className="font-semibold text-zinc-900 text-sm">{examDetails.studentName}</span>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">University Seat Number (USN)</span>
            <span className="font-mono font-semibold text-zinc-900 text-sm">{examDetails.usn}</span>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Program / Branch</span>
            <span className="font-medium text-zinc-800">{examDetails.branch}</span>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Exam Session</span>
            <span className="font-medium text-zinc-800">{examDetails.examSession}</span>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Examination Center</span>
            <span className="font-medium text-zinc-800">{examDetails.examCenter}</span>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Allocated Hall & Seat</span>
            <span className="font-semibold text-zinc-900">{examDetails.hallNumber}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-500" />
            Registered Examination Schedule
          </h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-600">
                <tr>
                  <th className="px-4 py-2.5">Course Code</th>
                  <th className="px-4 py-2.5">Course Title</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Time Slot</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
                {schedule.map((item) => (
                  <tr key={item.code} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-900">{item.code}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{item.title}</td>
                    <td className="px-4 py-3">
                      {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${item.date}T00:00:00`))}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600">{item.time}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2 py-0.5 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" /> Eligible
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50/60 border border-amber-200/80 p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            Important Examination Guidelines
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
            <li>Students must carry this printed Admit Card along with their official College ID Card to the examination hall.</li>
            <li>Entry to the hall is prohibited after 15 minutes from the scheduled commencement of the examination.</li>
            <li>Mobile phones, smartwatches, and programmable electronic devices are strictly prohibited inside the hall.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
