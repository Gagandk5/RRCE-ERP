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
  Bell,
  Menu,
  X,
  User,
  ShieldCheck,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setFacultyUser(data.user);
      }
    } catch {
      // Offline or mock fallback
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
      name: "Today",
      href: "/faculty",
      icon: LayoutDashboard,
      active: pathname === "/faculty",
    },
    {
      name: "Roll-Call",
      href: "/faculty/attendance",
      icon: CheckSquare,
      active: pathname.startsWith("/faculty/attendance"),
    },
  ];

  const displayName = facultyUser
    ? `${facultyUser.firstName} ${facultyUser.lastName}`
    : "Prof. Jaishankar M";
  const displayEmail = facultyUser?.email || "jaishankar.m@rrce.org";
  const displayDept = facultyUser?.departmentCode || "BCA";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* 1. DESKTOP FIXED SIDEBAR (lg:w-64) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-zinc-200/90 flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div>
          {/* SIDEBAR HEADER */}
          <div className="h-16 px-5 border-b border-zinc-200/80 flex items-center justify-between">
            <Link href="/faculty" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-1 border border-zinc-200 shadow-xs flex items-center justify-center shrink-0">
                <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-sm text-zinc-950 tracking-tight block leading-tight">
                  RRCE Faculty
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block leading-tight">
                  Teacher Desk
                </span>
              </div>
            </Link>
            <span className="font-mono text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-semibold border border-zinc-200">
              Sem 3
            </span>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Academic Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                    item.active
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM PROFILE & SECURITY TILE */}
        <div className="p-3 border-t border-zinc-200/80 space-y-2 bg-zinc-50/60">
          {/* USER INFO */}
          <div className="p-3 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
              {displayName
                .split(" ")
                .filter((p) => !p.startsWith("Prof") && !p.startsWith("Dr"))
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "JM"}
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

          {/* ACTION BUTTONS: CHANGE PASSWORD & SIGN OUT */}
          <div className="space-y-1">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors border border-transparent hover:border-zinc-200 touch-manipulation"
            >
              <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
              <span>Change Password</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 touch-manipulation"
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
          <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
            BCA Sem 3
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
      <main className="flex-1 w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] pb-20 lg:pb-8">
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
              className={`flex flex-col items-center gap-1 min-w-[64px] min-h-[44px] justify-center text-[11px] font-semibold transition-all touch-manipulation ${
                item.active
                  ? "text-zinc-950 scale-105"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
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
