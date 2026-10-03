"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Award,
  User,
  Users,
  Unlock,
  UserCheck,
  Megaphone,
  UserPlus,
  ArrowRightLeft,
  Receipt,
  Search,
  IndianRupee,
  Shield,
  Building,
} from "lucide-react";

interface BottomNavProps {
  role?: "FACULTY" | "HOD" | "ADMISSIONS" | "PRINCIPAL" | "STUDENT";
  onAction?: (action: string) => void;
}

export default function BottomNav({ role: propRole, onAction }: BottomNavProps) {
  const pathname = usePathname();

  // Determine role if not explicitly passed
  const activeRole: "FACULTY" | "HOD" | "ADMISSIONS" | "PRINCIPAL" | "STUDENT" =
    propRole ||
    (pathname.startsWith("/faculty")
      ? "FACULTY"
      : pathname.startsWith("/hod")
      ? "HOD"
      : pathname.startsWith("/admissions")
      ? "ADMISSIONS"
      : pathname.startsWith("/principal")
      ? "PRINCIPAL"
      : "STUDENT");

  const navConfigs: Record<
    string,
    Array<{
      label: string;
      href: string;
      icon: React.ElementType;
      actionKey?: string;
      exact?: boolean;
    }>
  > = {
    FACULTY: [
      { label: "Home", href: "/faculty", icon: LayoutDashboard, exact: true },
      { label: "Roll-Call", href: "/faculty/attendance", icon: CheckSquare },
      { label: "Planner", href: "/faculty?tab=schedule", icon: CalendarDays, actionKey: "schedule" },
      { label: "CIE Marks", href: "/faculty?tab=marks", icon: Award, actionKey: "marks" },
      { label: "Mentees", href: "/faculty?tab=risk", icon: Users, actionKey: "risk" },
    ],
    HOD: [
      { label: "Desk", href: "/hod", icon: LayoutDashboard, exact: true },
      { label: "Overrides", href: "/hod?tab=attendance", icon: Unlock, actionKey: "attendance" },
      { label: "Roster", href: "/hod?tab=students", icon: Users, actionKey: "students" },
      { label: "Workload", href: "/hod?tab=faculty", icon: UserCheck, actionKey: "faculty" },
      { label: "Alerts", href: "/hod?tab=alerts", icon: Megaphone, actionKey: "alerts" },
    ],
    ADMISSIONS: [
      { label: "Registry", href: "/admissions", icon: LayoutDashboard, exact: true },
      { label: "New Intake", href: "#new-intake", icon: UserPlus, actionKey: "new-intake" },
      { label: "Transfer", href: "#realloc", icon: ArrowRightLeft, actionKey: "realloc" },
      { label: "Billing", href: "#invoices", icon: Receipt, actionKey: "invoices" },
      { label: "Search", href: "#search", icon: Search, actionKey: "search" },
    ],
    PRINCIPAL: [
      { label: "Executive", href: "/principal", icon: LayoutDashboard, exact: true },
      { label: "Overrides", href: "#overrides", icon: Unlock, actionKey: "overrides" },
      { label: "Finances", href: "#finance", icon: IndianRupee, actionKey: "finance" },
      { label: "Audit", href: "#audit", icon: Shield, actionKey: "audit" },
      { label: "Depts", href: "#departments", icon: Building, actionKey: "departments" },
    ],
    STUDENT: [
      { label: "Overview", href: "/student", icon: LayoutDashboard, exact: true },
      { label: "Attendance", href: "/student/attendance", icon: CheckSquare },
      { label: "Schedule", href: "/student/timetable", icon: CalendarDays },
      { label: "CIE Marks", href: "/student/marks", icon: Award },
      { label: "Fees", href: "/student/fees", icon: Receipt },
    ],
  };

  const items = navConfigs[activeRole] || navConfigs.STUDENT;

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] flex justify-around items-center select-none"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || (item.href !== "#" && !item.href.startsWith("#") && pathname.startsWith(item.href));

        const handleClick = (e: React.MouseEvent) => {
          if (item.actionKey && onAction) {
            e.preventDefault();
            onAction(item.actionKey);
          } else if (item.href.startsWith("#")) {
            e.preventDefault();
            const el = document.getElementById(item.href.slice(1));
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }
        };

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl px-1.5 py-1 text-[10px] font-semibold transition-all touch-manipulation ${
              isActive
                ? "text-slate-950 font-bold scale-105"
                : "text-slate-400 hover:text-slate-700 active:scale-95"
            }`}
          >
            <div className="relative">
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-indigo-900" : "text-slate-400"}`} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-900 rounded-full" />
              )}
            </div>
            <span className="truncate max-w-[64px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
