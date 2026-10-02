"use client";

import React, { useState } from "react";

export default function StudentTimetablePage() {
  const [activeDay, setActiveDay] = useState<"MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT">("MON");

  const timetableData: Record<string, any[]> = {
    MON: [
      { time: "09:00 - 10:00 AM", code: "B25BCA301", title: "Digital Principles and Computer Organization", type: "Theory", instructor: "Prof. Jaishankar M", room: "LH-201" },
      { time: "10:00 - 11:00 AM", code: "B25BCA302", title: "Object Oriented Programming in C++", type: "Theory", instructor: "Prof. Shreya S", room: "LH-201" },
      { time: "11:15 - 12:15 PM", code: "B25BCA303", title: "Operating System Concepts", type: "Theory", instructor: "Prof. Thilagavallii S", room: "LH-201" },
      { time: "02:00 - 03:00 PM", code: "B25BCA304", title: "Relational Data Base Management System", type: "Theory", instructor: "Prof. Pushpalatha G", room: "LH-201" },
    ],
    TUE: [
      { time: "09:00 - 10:00 AM", code: "B25BCA305", title: "Software Engineering", type: "Theory", instructor: "Prof. Deeraj C", room: "LH-201" },
      { time: "10:00 - 11:00 AM", code: "B25BCA306", title: "Reasoning and Aptitude", type: "Theory", instructor: "Prof. Darshan P", room: "LH-201" },
      { time: "11:15 - 12:15 PM", code: "B25BCA301", title: "Digital Principles and Computer Organization", type: "Theory", instructor: "Prof. Jaishankar M", room: "LH-201" },
      { time: "02:00 - 04:00 PM", code: "B25BCAL307", title: "Object Oriented Programming in C++ Lab", type: "Lab", instructor: "Prof. Shreya S & Dr. Muruganandham S K", room: "Computer Lab 2" },
    ],
    WED: [
      { time: "09:00 - 10:00 AM", code: "B25BCA303", title: "Operating System Concepts", type: "Theory", instructor: "Prof. Thilagavallii S", room: "LH-201" },
      { time: "10:00 - 11:00 AM", code: "B25BCA304", title: "Relational Data Base Management System", type: "Theory", instructor: "Prof. Pushpalatha G", room: "LH-201" },
      { time: "11:15 - 12:15 PM", code: "B25BCA301", title: "Digital Principles and Computer Organization", type: "Theory", instructor: "Prof. Jaishankar M", room: "LH-201" },
      { time: "02:00 - 04:00 PM", code: "B25BCAL308", title: "Relational Data Base Management System Lab", type: "Lab", instructor: "Prof. Pushpalatha G & Prof. Deeraj C", room: "Computer Lab 3" },
    ],
    THU: [
      { time: "09:00 - 10:00 AM", code: "B25BCA302", title: "Object Oriented Programming in C++", type: "Theory", instructor: "Prof. Shreya S", room: "LH-201" },
      { time: "10:00 - 11:00 AM", code: "B25BCA305", title: "Software Engineering", type: "Theory", instructor: "Prof. Deeraj C", room: "LH-201" },
      { time: "11:15 - 12:15 PM", code: "B25BCA303", title: "Operating System Concepts", type: "Theory", instructor: "Prof. Thilagavallii S", room: "LH-201" },
      { time: "02:00 - 03:00 PM", code: "B25BCA306", title: "Reasoning and Aptitude", type: "Theory", instructor: "Prof. Darshan P", room: "LH-201" },
    ],
    FRI: [
      { time: "09:00 - 10:00 AM", code: "B25BCA301", title: "Digital Principles and Computer Organization", type: "Theory", instructor: "Prof. Jaishankar M", room: "LH-201" },
      { time: "10:00 - 11:00 AM", code: "B25BCA304", title: "Relational Data Base Management System", type: "Theory", instructor: "Prof. Pushpalatha G", room: "LH-201" },
      { time: "11:15 - 12:15 PM", code: "B25BCA306", title: "Reasoning and Aptitude", type: "Theory", instructor: "Prof. Darshan P", room: "LH-201" },
    ],
    SAT: [
      { time: "09:00 - 11:00 AM", code: "B25BCA306", title: "Aptitude & Technical Soft Skills", type: "Seminar", instructor: "Prof. Darshan P", room: "Seminar Hall" },
    ],
  };

  const currentSlots = timetableData[activeDay] || [];

  return (
    <div className="space-y-6 sm:space-y-8 text-zinc-900 font-sans max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/60 pb-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
            Academic Timetable
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            BCA 3rd Semester (Sec A) • Primary Lecture Hall: LH-201
          </p>
        </div>

        {/* DAY SELECTOR PILL BAR WITH HORIZONTAL SCROLL ON MOBILE */}
        <div className="flex items-center gap-1 bg-white border border-zinc-200/80 p-1 rounded-full shadow-sm overflow-x-auto max-w-full no-scrollbar">
          {(["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const).map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3.5 sm:px-4 py-1.5 text-xs font-medium rounded-full transition-all shrink-0 ${
                activeDay === day
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* SCHEDULE CARDS */}
      <div className="space-y-3 sm:space-y-4">
        {currentSlots.map((slot, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-300 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-zinc-900 text-sm">{slot.title}</h3>
                <span className="font-mono text-xs text-zinc-400 bg-zinc-50 px-2.5 py-0.5 rounded-full border border-zinc-100">
                  {slot.code}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${
                    slot.type === "Lab"
                      ? "bg-purple-50 text-purple-700 border-purple-100"
                      : slot.type === "Tutorial"
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-zinc-50 text-zinc-600 border-zinc-100"
                  }`}
                >
                  {slot.type}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Instructor: {slot.instructor}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-zinc-100 sm:border-0">
              <span className="font-mono text-xs font-medium text-zinc-600 bg-zinc-50 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded border border-zinc-100 sm:border-0">
                {slot.time}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-700 bg-zinc-50 px-3 py-1 rounded-xl border border-zinc-200/80">
                {slot.room}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
