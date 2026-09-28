"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";

export default function StudentSemesterExamsPage() {
  const [examSchedule] = useState([
    {
      code: "BCA301",
      title: "Database Management Systems",
      date: "2026-11-16",
      time: "09:30 AM - 12:30 PM",
      hall: "LH-304",
      block: "Main Academic Block (3rd Floor)",
      seatNo: "C-14",
      status: "Scheduled",
    },
    {
      code: "BCA302",
      title: "Object Oriented Programming with Java",
      date: "2026-11-18",
      time: "09:30 AM - 12:30 PM",
      hall: "LH-304",
      block: "Main Academic Block (3rd Floor)",
      seatNo: "C-14",
      status: "Scheduled",
    },
    {
      code: "BCA303",
      title: "Data Structures & Algorithms",
      date: "2026-11-20",
      time: "09:30 AM - 12:30 PM",
      hall: "LH-304",
      block: "Main Academic Block (3rd Floor)",
      seatNo: "C-14",
      status: "Scheduled",
    },
    {
      code: "BCA304",
      title: "Operating Systems & Shell Scripting",
      date: "2026-11-23",
      time: "09:30 AM - 12:30 PM",
      hall: "LH-304",
      block: "Main Academic Block (3rd Floor)",
      seatNo: "C-14",
      status: "Scheduled",
    },
    {
      code: "BCA305P",
      title: "Java & DBMS Laboratory",
      date: "2026-11-25",
      time: "02:00 PM - 05:00 PM",
      hall: "Lab 2 (CS Block)",
      block: "Computer Science Wing (1st Floor)",
      seatNo: "PC-08",
      status: "Scheduled",
    },
  ]);

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-lg font-semibold tracking-tight">Semester Examination Schedule</h1>
        <p className="mt-0.5 text-xs text-zinc-500">VTU end-semester exam timetable, hall seating allocation, and guidelines</p>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sky-950">Odd Semester Examinations - Nov/Dec 2026</h2>
            <p className="text-xs text-sky-800 mt-0.5">Hall Tickets are issued. Ensure your attendance eligibility meets VTU 75% margin.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-900">
          <CheckCircle2 className="h-4 w-4 text-sky-600" /> Exam Form Submitted
        </span>
      </div>

      <div className="space-y-3">
        {examSchedule.map((exam) => (
          <div key={exam.code} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <span className="inline-block font-mono text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded">
                  {exam.code}
                </span>
                <h3 className="text-sm font-semibold text-zinc-900 mt-1.5">{exam.title}</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {exam.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>
                  <strong className="text-zinc-900 font-medium">
                    {new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${exam.date}T00:00:00`))}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="font-mono text-zinc-800">{exam.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>
                  <strong className="text-zinc-900 font-medium">{exam.hall}</strong> ({exam.seatNo})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
          <AlertCircle className="h-4 w-4 text-zinc-600" />
          Examination Hall Rules & Code of Conduct
        </div>
        <ul className="list-disc list-inside space-y-1 text-zinc-600 leading-relaxed">
          <li>Arrive at the allocated examination hall at least 20 minutes prior to the commencement of the exam.</li>
          <li>Carry your physical College Identity Card and printed VTU Admit Card for identity verification.</li>
          <li>No calculators with communication features, smart devices, or written reference materials are allowed.</li>
          <li>Ensure answer sheets are signed by the hall invigilator before handing them over at the end of the session.</li>
        </ul>
      </div>
    </div>
  );
}
