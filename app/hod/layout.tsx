"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Unlock,
  Users,
  UserCheck,
  AlertTriangle,
  LogOut,
  Building2,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function HODLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login?portal=hod");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    }
  }

  const navItems = [
    { name: "Executive Desk", href: "/hod", icon: LayoutDashboard, exact: true },
    { name: "Lockout Overrides", href: "/hod?tab=attendance", icon: Unlock },
    { name: "BCA Class Roster", href: "/hod?tab=students", icon: Users },
    { name: "Faculty Workload", href: "/hod?tab=faculty", icon: UserCheck },
    { name: "Shortage Alerts", href: "/hod?tab=alerts", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] antialiased text-slate-900 selection:bg-indigo-900 selection:text-white">
      {/* 1. FIXED LEFT SIDEBAR (lg:w-64) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 fixed inset-y-0 left-0 flex-col justify-between p-5 z-30 select-none">
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <Link href="/hod" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-1 border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-semibold text-sm text-slate-900 tracking-tight block leading-tight">
                  HOD Directorate
                </span>
                <span className="text-[10px] text-slate-500 font-mono block leading-tight">
                  Dept of BCA
                </span>
              </div>
            </Link>
            <span className="font-mono text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-semibold border border-purple-200/80 shrink-0">
              Sem 3
            </span>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Department Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors flex items-center gap-3 ${
                    isActive
                      ? "bg-slate-100 text-slate-950 font-semibold border border-slate-200/60 shadow-2xs"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* DOCKED PROFILE BOX */}
        <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center shrink-0">
              PG
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs text-slate-900 truncate block leading-tight">
                Dr. Praveen Gowda
              </span>
              <span className="text-[11px] text-slate-500 font-mono truncate block leading-tight mt-0.5">
                hod.bca@rrce.org
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-slate-200/80 text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs text-[11px] font-semibold"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT VIEWPORT */}
      <main className="lg:pl-64 min-h-screen bg-[#F8F9FA] flex-1 w-full overflow-x-hidden pb-16 lg:pb-8">
        {children}
      </main>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <BottomNav role="HOD" />
    </div>
  );
}
