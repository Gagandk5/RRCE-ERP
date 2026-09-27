"use client";

import React, { useState } from "react";
import { Clock, MapPin, User, BookOpen } from "lucide-react";

export default function StudentTimetablePage() {
  const [activeDay, setActiveDay] = useState<"MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT">("MON");

  const timetableData: Record<string, any[]> = {
    MON: [
      { time: "09:00 - 10:00", code: "25BC301", title: "Discrete Mathematics", type: "Theory", faculty: "Prof. Sunitha Sharma", room: "LH-201", isCurrent: true },
      { time: "10:00 - 11:00", code: "25BC302", title: "Data Structures & Algorithms", type: "Theory", faculty: "Dr. Praveen Gowda", room: "LH-201", isCurrent: false },
      { time: "11:15 - 12:15", code: "25BC303", title: "Database Management Systems", type: "Theory", faculty: "Prof. Kavitha N", room: "Lab-3", isCurrent: false },
      { time: "14:00 - 16:00", code: "25BCL31", title: "Data Structures Practical Lab", type: "Lab", faculty: "Dr. Praveen Gowda", room: "Computer Lab 2", isCurrent: false },
    ],
    TUE: [
      { time: "09:00 - 10:00", code: "25BC303", title: "Database Management Systems", type: "Theory", faculty: "Prof. Kavitha N", room: "LH-201", isCurrent: false },
      { time: "10:00 - 11:00", code: "25BC301", title: "Discrete Mathematics", type: "Theory", faculty: "Prof. Sunitha Sharma", room: "LH-201", isCurrent: false },
      { time: "11:15 - 12:15", code: "25BC304", title: "Software Engineering & Agile", type: "Theory", faculty: "Prof. Rajesh Kumar", room: "LH-201", isCurrent: false },
      { time: "14:00 - 16:00", code: "25BCL32", title: "DBMS SQL Practical Lab", type: "Lab", faculty: "Prof. Kavitha N", room: "Lab-3", isCurrent: false },
    ],
    WED: [
      { time: "09:00 - 10:00", code: "25BC302", title: "Data Structures & Algorithms", type: "Theory", faculty: "Dr. Praveen Gowda", room: "LH-201", isCurrent: false },
      { time: "10:00 - 11:00", code: "25BC304", title: "Software Engineering & Agile", type: "Theory", faculty: "Prof. Rajesh Kumar", room: "LH-201", isCurrent: false },
      { time: "11:15 - 12:15", code: "25BC301", title: "Discrete Mathematics", type: "Theory", faculty: "Prof. Sunitha Sharma", room: "LH-201", isCurrent: false },
    ],
    THU: [
      { time: "09:00 - 10:00", code: "25BC304", title: "Software Engineering & Agile", type: "Theory", faculty: "Prof. Rajesh Kumar", room: "LH-201", isCurrent: false },
      { time: "10:00 - 11:00", code: "25BC303", title: "Database Management Systems", type: "Theory", faculty: "Prof. Kavitha N", room: "LH-201", isCurrent: false },
      { time: "11:15 - 12:15", code: "25BC302", title: "Data Structures & Algorithms", type: "Theory", faculty: "Dr. Praveen Gowda", room: "LH-201", isCurrent: false },
      { time: "14:00 - 15:00", code: "25BC301", title: "Discrete Mathematics Tutorial", type: "Tutorial", faculty: "Prof. Sunitha Sharma", room: "LH-201", isCurrent: false },
    ],
    FRI: [
      { time: "09:00 - 10:00", code: "25BC301", title: "Discrete Mathematics", type: "Theory", faculty: "Prof. Sunitha Sharma", room: "LH-201", isCurrent: false },
      { time: "10:00 - 11:00", code: "25BC302", title: "Data Structures & Algorithms", type: "Theory", faculty: "Dr. Praveen Gowda", room: "LH-201", isCurrent: false },
      { time: "11:15 - 12:15", code: "25BC303", title: "Database Management Systems", type: "Theory", faculty: "Prof. Kavitha N", room: "LH-201", isCurrent: false },
    ],
    SAT: [
      { time: "09:00 - 11:00", code: "25BC305", title: "Aptitude & Technical Soft Skills", type: "Seminar", faculty: "Placement Directorate", room: "Auditorium", isCurrent: false },
    ],
  };

  const currentSlots = timetableData[activeDay] || [];

  return (
    <div className="space-y-6 text-xs text-zinc-900 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-zinc-900 tracking-tight">
            Academic Timetable
          </h1>
          <p className="text-xs text-zinc-500 font-mono">
            BCA 3rd Semester (Sec A) • 2025 Autonomous Scheme
          </p>
        </div>
        <span className="font-mono text-xs text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded">
          Classroom: LH-201
        </span>
      </div>

      {/* DAY SWITCHER TABS */}
      <div className="flex border-b border-zinc-200 gap-1 font-mono text-xs">
        {(["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const).map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 font-bold rounded-t-md transition-colors ${
              activeDay === day
                ? "bg-white border-t-2 border-x border-zinc-200 border-b-white -mb-px text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* HIGH-DENSITY SCHEDULE TABLE */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3">Time Window</th>
                <th className="py-2.5 px-3">Course Code</th>
                <th className="py-2.5 px-3">Course Title</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Faculty Instructor</th>
                <th className="py-2.5 px-3 text-right">Hall / Lab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {currentSlots.map((slot, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    slot.isCurrent
                      ? "border-l-2 border-l-slate-900 bg-zinc-50/80 font-medium"
                      : "hover:bg-zinc-50/80"
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-800">
                    {slot.time}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">
                    {slot.code}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900">
                    {slot.title}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        slot.type === "Lab"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : slot.type === "Tutorial"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      {slot.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-700">
                    {slot.faculty}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                    {slot.room}
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
