"use client";

import React, { useState } from "react";
import { Award, Code2, Medal } from "lucide-react";

type AchievementCategory = "Academic" | "Technical" | "Sports";

type Achievement = {
  id: number;
  category: AchievementCategory;
  title: string;
  date: string;
};

const categoryStyles = {
  Academic: {
    icon: Award,
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconBackground: "bg-emerald-100 text-emerald-700",
  },
  Technical: {
    icon: Code2,
    accent: "border-sky-200 bg-sky-50 text-sky-700",
    iconBackground: "bg-sky-100 text-sky-700",
  },
  Sports: {
    icon: Medal,
    accent: "border-rose-200 bg-rose-50 text-rose-700",
    iconBackground: "bg-rose-100 text-rose-700",
  },
} satisfies Record<AchievementCategory, {
  icon: typeof Award;
  accent: string;
  iconBackground: string;
}>;

const categories: AchievementCategory[] = ["Academic", "Technical", "Sports"];

export default function StudentAchievementsPage() {
  const [achievements] = useState<Achievement[]>([
    { id: 1, category: "Academic", title: "Class Topper - Semester 2", date: "2026-06-18" },
    { id: 2, category: "Technical", title: "Winner - BLR AI Hack 2026", date: "2026-08-22" },
    { id: 3, category: "Sports", title: "Inter-college Badminton Champion", date: "2026-04-12" },
  ]);

  if (achievements.length === 0) return null;

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-lg font-semibold tracking-tight">Achievements</h1>
        <p className="mt-1 text-xs text-zinc-500">Recognition earned across academics, technology, and sports.</p>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryAchievements = achievements.filter((achievement) => achievement.category === category);
          if (categoryAchievements.length === 0) return null;

          const style = categoryStyles[category];
          const Icon = style.icon;

          return (
            <section key={category} aria-labelledby={`achievement-${category.toLowerCase()}`}>
              <div className="mb-3 flex items-center gap-2">
                <h2 id={`achievement-${category.toLowerCase()}`} className="text-sm font-semibold text-zinc-800">
                  {category}
                </h2>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.accent}`}>
                  {categoryAchievements.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {categoryAchievements.map((achievement) => (
                  <article key={achievement.id} className="flex min-h-28 items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconBackground}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.accent}`}>
                        {category}
                      </span>
                      <h3 className="mt-2 text-sm font-semibold leading-snug text-zinc-900">
                        {achievement.title}
                      </h3>
                      <time dateTime={achievement.date} className="mt-2 block text-xs text-zinc-500">
                        {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${achievement.date}T00:00:00`))}
                      </time>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}