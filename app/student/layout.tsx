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
    { name: "Internal Marks", href: "/student/marks", icon: GraduationCap },
    { name: "Fees & Invoices", href: "/student/fees", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-zinc-900 antialiased">
      {/* FULL-HEIGHT FIXED LEFT SIDEBAR */}
      <aside className="h-screen w-64 fixed left-0 top-0 bottom-0 bg-white border-r border-zinc-200/80 flex flex-col justify-between z-30 select-none">
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
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

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
      <div className="ml-64 min-h-screen bg-[#F9FAFB] p-8 max-w-6xl">
        {children}
      </div>
    </div>
  );
}
