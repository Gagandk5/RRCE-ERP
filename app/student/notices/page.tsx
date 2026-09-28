"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Megaphone } from "lucide-react";

type NoticeCategory = "Academic" | "General" | "Extracurricular";

type Notice = {
  id: number;
  title: string;
  date: string;
  category: NoticeCategory;
  description: string;
  actionLink?: string;
  actionText?: string;
};

const categoryStyles: Record<NoticeCategory, string> = {
  Academic: "bg-sky-50 text-sky-700 border-sky-200",
  General: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Extracurricular: "bg-amber-50 text-amber-800 border-amber-200",
};

export default function StudentNoticesPage() {
  const [notices] = useState<Notice[]>([
    {
      id: 1,
      title: "VTU Examination Registration Open",
      date: "2026-09-27",
      category: "Academic",
      description: "Registration for the upcoming VTU examinations is now open. Review your examination details and complete registration before the university deadline.",
      actionLink: "/student/semester-exams",
      actionText: "Apply Now",
    },
    {
      id: 2,
      title: "Semester 3 Results Published",
      date: "2026-09-24",
      category: "Academic",
      description: "Semester 3 results have been published. Students can review their marks and contact the examination office regarding any discrepancies.",
    },
    {
      id: 3,
      title: "Upcoming Public Holidays Information",
      date: "2026-09-20",
      category: "General",
      description: "The college will remain closed on notified public holidays. Please check the academic calendar for the full list of dates and any schedule changes.",
    },
    {
      id: 4,
      title: "NCC Annual Camp Registrations",
      date: "2026-09-16",
      category: "Extracurricular",
      description: "Registrations are open for the NCC annual camp. Interested cadets should contact the NCC office with their details before seats are filled.",
    },
  ]);

  const sortedNotices = [...notices].sort(
    (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()
  );

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      <div className="border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <Megaphone aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Notices</h1>
            <p className="mt-0.5 text-xs text-zinc-500">Official announcements from RRCE</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-3">
        {sortedNotices.map((notice) => (
          <article key={notice.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${categoryStyles[notice.category]}`}>
                {notice.category}
              </span>
              <time dateTime={notice.date} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${notice.date}T00:00:00`))}
              </time>
            </div>
            <h2 className="mt-3 text-sm font-semibold leading-snug text-zinc-900">{notice.title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">{notice.description}</p>
            {notice.actionLink && notice.actionText && (
              <Link
                href={notice.actionLink}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
              >
                {notice.actionText}
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}