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
  ShieldCheck,
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
        const targetId = (currentUser?.studentId || currentUser?.userId || "").toLowerCase().trim();
        const targetName = (currentUser?.firstName || "").toLowerCase().trim();

        const match =
          roster.find((s: any) => {
            const sUsn = (s.usn || "").toLowerCase().trim();
            const sUsername = (s.user?.username || "").toLowerCase().trim();
            const sId = (s.id || "").toLowerCase().trim();
            const sUserId = (s.userId || "").toLowerCase().trim();
            const sName = (s.user?.firstName || "").toLowerCase().trim();

            return (
              (targetUsn && (sUsn === targetUsn || sUsername === targetUsn)) ||
              (targetId && (sId === targetId || sUserId === targetId)) ||
              (targetName && sName === targetName)
            );
          }) || roster[0];

        setStudent(match);
      }
    } catch (e) {
      console.error("Failed to load student layout profile:", e);
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
    { name: "Internal Marks (CIE)", href: "/student/marks", icon: GraduationCap },
    { name: "Fee Invoices", href: "/student/fees", icon: Receipt },
    { name: "Proctor & Profile", href: "/student/profile", icon: ShieldCheck },
  ];

  const getBreadcrumbTitle = () => {
    if (pathname === "/student") return "Student / Academic Overview";
    if (pathname === "/student/timetable") return "Student / Day & Weekly Timetable";
    if (pathname === "/student/attendance") return "Student / Attendance & VTU Eligibility Engine";
    if (pathname === "/student/marks") return "Student / Continuous Internal Evaluation (CIE)";
    if (pathname === "/student/fees") return "Student / Fee Invoices & Payment Ledger";
    if (pathname === "/student/profile") return "Student / Proctor Assignment & VTU Dossier";
    return "Student / Academic Workspace";
  };

  return (
    <div className="h-screen flex bg-zinc-50 overflow-hidden font-sans text-zinc-900 text-xs">
      {/* LEFT FIXED SIDEBAR */}
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col justify-between shrink-0 h-screen select-none">
        {/* HEADER SECTION */}
        <div>
          <div className="p-4 border-b border-zinc-100 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center shrink-0 border border-zinc-200 p-0.5">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-zinc-900 block leading-none">
                RRCE ERP
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mt-1 leading-none">
                Autonomous • VTU
              </span>
            </div>
          </div>

          {/* NAVIGATION LIST */}
          <nav className="px-2 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
        <div className="p-3 border-t border-zinc-200 bg-zinc-50/60">
          <span className="text-xs font-semibold text-zinc-900 truncate block">
            {student?.user?.firstName || "Student"} {student?.user?.lastName || ""}
          </span>
          <span className="font-mono text-[11px] text-zinc-500 block mt-0.5">
            {student?.usn || "1RR25BC007"}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-rose-600 flex items-center gap-1.5 mt-2 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-400 hover:text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* TOP CONTEXT STRIP & MAIN BODY */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* UNIFIED SUB-HEADER */}
        <header className="h-12 border-b border-zinc-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-zinc-700 font-mono">
            {getBreadcrumbTitle()}
          </div>
          <div className="font-mono text-xs text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded">
            BCA Sem 3 • Sec A | Academic Year 2025–26
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 max-w-6xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
