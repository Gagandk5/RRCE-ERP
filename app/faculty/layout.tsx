"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  KeyRound,
  LogOut,
  CalendarDays,
  GraduationCap,
  Users,
} from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [facultyUser, setFacultyUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  useEffect(() => {
    function syncActiveTab() {
      setActiveTab(new URLSearchParams(window.location.search).get("tab") || "overview");
    }

    syncActiveTab();
    window.addEventListener("popstate", syncActiveTab);
    return () => window.removeEventListener("popstate", syncActiveTab);
  }, [pathname]);

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setFacultyUser(data.user);
      }
    } catch {
      // Mock / offline fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login?portal=faculty");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    }
  }

  const navItems = [
    {
      name: "Today's Schedule",
      href: "/faculty",
      icon: LayoutDashboard,
      active: pathname === "/faculty" && activeTab === "overview",
    },
    {
      name: "Roll-Call Attendance",
      href: "/faculty/attendance",
      icon: CheckSquare,
      active: pathname.startsWith("/faculty/attendance"),
    },
    {
      name: "Timetable & Planner",
      href: "/faculty?tab=schedule",
      icon: CalendarDays,
      active: pathname === "/faculty" && (activeTab === "schedule" || activeTab === "calendar"),
    },
    {
      name: "Marks Entry (CIE)",
      href: "/faculty?tab=marks",
      icon: GraduationCap,
      active: pathname === "/faculty" && activeTab === "marks",
    },
    {
      name: "Mentorship & Proctoring",
      href: "/faculty?tab=risk",
      icon: Users,
      active: pathname === "/faculty" && activeTab === "risk",
    },
  ];

  const displayName = facultyUser
    ? `${facultyUser.firstName} ${facultyUser.lastName}`
    : loading ? "Loading faculty profile…" : "Faculty";
  const displayEmail = facultyUser?.email || "";
  const displayDept = facultyUser?.department?.name || facultyUser?.department?.code || "Department not set";

  const initials = displayName
    .split(" ")
    .filter((p) => !p.startsWith("Prof") && !p.startsWith("Dr"))
    .map((n) => n[0])
    .join("")
    .slice(0, 2) || "JM";

  return (
    <div className="min-h-screen bg-slate-50 antialiased text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* 1. FIXED LEFT SIDEBAR (lg:w-64) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-zinc-200/80 fixed inset-y-0 left-0 flex-col justify-between p-5 z-30 select-none">
        <div className="space-y-6">
          {/* SIDEBAR HEADER */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <Link href="/faculty" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-1 border border-zinc-200 shadow-2xs flex items-center justify-center shrink-0">
                <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-semibold text-sm text-zinc-900 tracking-tight block leading-tight">
                  RRCE Faculty
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block leading-tight">
                    {displayDept}
                </span>
              </div>
            </Link>
            <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-semibold border border-zinc-200/80 shrink-0">
              AY 2026–27 • ODD SEM
            </span>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Academic Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setActiveTab(
                    item.name === "Timetable & Planner" ? "schedule" :
                    item.name === "Marks Entry (CIE)" ? "marks" :
                    item.name === "Mentorship & Proctoring" ? "risk" :
                    "overview"
                  )}
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors flex items-center gap-3 ${
                    item.active
                      ? "bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/60 shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.active ? "text-zinc-900" : "text-zinc-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* DOCKED PROFILE BOX */}
        <div className="bg-zinc-50 border border-zinc-200/70 p-3 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-200/80 text-zinc-800 text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs text-zinc-900 truncate block leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono truncate block leading-tight mt-0.5">
                {displayEmail}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-200/60 text-xs font-medium">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-zinc-200/80 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors shadow-2xs text-[11px]"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
              <span>Password</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-zinc-200/80 text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs text-[11px]"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP BAR (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 h-14 flex items-center justify-between">
        <Link href="/faculty" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white p-0.5 border border-zinc-200 shadow-2xs flex items-center justify-center">
            <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm text-zinc-900">
            RRCE Faculty
          </span>
          <span className="max-w-32 truncate text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
            {displayDept}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
            title="Change Password"
            aria-label="Change Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTENT VIEWPORT */}
      <main className="lg:pl-64 min-h-screen bg-slate-50 flex-1 w-full overflow-x-hidden pb-16 lg:pb-8">
        {children}
      </main>

      {/* 4. MOBILE BOTTOM FLOATING NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[60px] min-h-[44px] justify-center text-[10px] font-semibold transition-all touch-manipulation ${
                item.active
                  ? "text-zinc-950 scale-105"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[70px]">{item.name.split(" ")[0]}</span>
              {item.active && (
                <span className="w-1 h-1 rounded-full bg-zinc-950 mt-0.5" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 5. CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={displayEmail}
      />
    </div>
  );
}
