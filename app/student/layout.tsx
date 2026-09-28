"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  GraduationCap,
  Receipt,
  LogOut,
  ChevronDown,
  Trophy,
  Megaphone,
} from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const examLinks = [
    { name: "Internal Marks", href: "/student/marks" },
    { name: "Semester Exams", href: "/student/semester-exams" },
    { name: "Admit Card", href: "/student/admit-card" },
    { name: "Results", href: "/student/results" },
  ];
  const isExamRoute = examLinks.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const [isExamsOpen, setIsExamsOpen] = useState(isExamRoute);

  useEffect(() => {
    if (isExamRoute) setIsExamsOpen(true);
  }, [isExamRoute]);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const meRes = await fetch("/api/auth/me");
      let currentUser: any = null;
      if (meRes.ok) {
        const d = await meRes.json();
        currentUser = d.user;
      }

      if (currentUser?.studentProfile) {
        setStudent({
          ...currentUser.studentProfile,
          user: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            phone: currentUser.phone,
            email: currentUser.email,
          },
        });
        return;
      }

      const stRes = await fetch("/api/students?dept=BCA");
      if (stRes.ok) {
        const sData = await stRes.json();
        const roster = sData.students || [];

        const targetUsn = (currentUser?.usn || currentUser?.username || "").toLowerCase().trim();
        const match = roster.find((s: any) => (s.usn || "").toLowerCase().trim() === targetUsn) || roster[0];
        setStudent(match);
      }
    } catch (e) {
      console.error("Failed to load layout student session:", e);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  const navItems = [
    { name: "Overview", href: "/student", icon: LayoutDashboard, exact: true },
    { name: "Timetable", href: "/student/timetable", icon: CalendarDays },
    { name: "Attendance", href: "/student/attendance", icon: UserCheck },
    { name: "Exams & Results", href: "/student/marks", icon: GraduationCap, children: examLinks },
    { name: "Achievements", href: "/student/achievements", icon: Trophy },
    { name: "Notices", href: "/student/notices", icon: Megaphone },
    { name: "Fees & Invoices", href: "/student/fees", icon: Receipt },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-zinc-900 antialiased">
      {/* FULL-HEIGHT FIXED LEFT SIDEBAR */}
      <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 bg-white border-r border-zinc-200/80 flex flex-col justify-between z-30 select-none">
        <div>
          {/* BRAND HEADER */}
          <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-zinc-200 p-0.5 shadow-xs">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-zinc-900 block leading-tight">
                RRCE ERP
              </span>
              <span className="text-xs text-zinc-400 block leading-tight mt-0.5">
                Student Workspace
              </span>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = item.children
                ? isExamRoute
                : item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              if (item.children) {
                return (
                  <div key={item.href}>
                    <button
                      type="button"
                      onClick={() => setIsExamsOpen((open) => !open)}
                      aria-expanded={isExamsOpen}
                      aria-controls="student-exams-submenu"
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-xl transition-all ${
                        isActive
                          ? "bg-zinc-100 text-zinc-900 font-semibold"
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${isExamsOpen ? "rotate-180" : "rotate-0"}`} />
                    </button>
                    <div
                      id="student-exams-submenu"
                      inert={!isExamsOpen}
                      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExamsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="ml-5 mt-1 space-y-1 border-l border-zinc-200 pl-2">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center rounded-xl px-3 py-2.5 text-xs transition-all ${
                                  isChildActive
                                    ? "bg-zinc-100 text-zinc-900 font-semibold"
                                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
                                }`}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-xl transition-all ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* DOCKED PROFILE FOOTER */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 mt-auto">
          <span className="text-xs font-semibold text-zinc-900 truncate block">
            {student?.user?.firstName || "Gagan"} {student?.user?.lastName || "D K"}
          </span>
          <span className="font-mono text-[11px] text-zinc-400 block mt-0.5">
            {student?.usn || "1RR25BC007"}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-rose-600 flex items-center gap-1.5 mt-2 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT WITH LEFT MARGIN FOR SIDEBAR */}
      <div className="min-h-screen min-w-0 flex-1 bg-[#F9FAFB] p-8 max-w-6xl">
        {children}
      </div>
    </div>
  );
}
