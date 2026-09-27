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
} from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
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
    } finally {
      setLoading(false);
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
    { name: "Internal Marks", href: "/student/marks", icon: GraduationCap },
    { name: "Fees & Invoices", href: "/student/fees", icon: Receipt },
  ];

  const studentFirstName = student?.user?.firstName || "Gagan";

  return (
    <div className="h-screen flex bg-[#F9FAFB] overflow-hidden font-sans text-zinc-900 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between shrink-0 p-5 h-screen select-none">
        <div>
          {/* TOP BRAND MARK */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-zinc-200 p-0.5 shadow-sm">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-zinc-900 block leading-tight">
                RRCE ERP
              </span>
              <span className="text-xs text-zinc-400 block leading-tight">
                Student Portal
              </span>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="space-y-1.5 mt-6">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-all ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 font-medium"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-normal"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM IDENTITY BLOCK */}
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mt-auto space-y-1">
          <span className="text-xs font-semibold text-zinc-900 block truncate">
            {student?.user?.firstName || "Gagan"} {student?.user?.lastName || "D K"}
          </span>
          <span className="font-mono text-[11px] text-zinc-400 block">
            {student?.usn || "1RR25BC007"}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-rose-600 flex items-center gap-1.5 mt-3 pt-2 border-t border-zinc-200/50 w-full transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP CONTEXT STRIP */}
        <header className="h-16 px-8 flex items-center justify-between shrink-0 border-b border-zinc-200/60 bg-white/50 backdrop-blur-sm">
          <span className="text-base font-medium text-zinc-900 tracking-tight">
            Good morning, {studentFirstName}
          </span>
          <span className="text-xs text-zinc-500 bg-white border border-zinc-200/80 rounded-full px-4 py-1.5 shadow-sm font-medium">
            BCA • Semester 3 (Section A)
          </span>
        </header>

        {/* CONTENT CANVAS */}
        <main className="flex-1 overflow-y-auto max-w-5xl w-full mx-auto px-8 py-8 pb-12 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
