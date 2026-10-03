"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  ClipboardList,
  GraduationCap,
  Receipt,
  LogOut,
  ChevronDown,
  Trophy,
  Megaphone,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileContext";
import BottomNav from "@/components/BottomNav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Bus Route Update",
      shortSummary: "Route 4 pickup time has changed.",
      fullMessage: "Starting Monday, the Route 4 bus will arrive at your usual stop 10 minutes earlier. Please check the updated transport schedule before your next trip.",
      isRead: false,
    },
    {
      id: 2,
      title: "Semester 3 Results Out",
      shortSummary: "Your semester results are ready to view.",
      fullMessage: "Semester 3 examination results are now available in the Results section of your student dashboard. Contact the examination office if you notice any discrepancy.",
      isRead: false,
    },
    {
      id: 3,
      title: "Download Admit Card",
      shortSummary: "Your upcoming exam admit card is available.",
      fullMessage: "The admit card for your upcoming examination is ready. Visit the Admit Card section, verify your details, and download it before exam day.",
      isRead: true,
    },
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState<number | null>(null);
  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

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

  function handleNotificationClick(id: number) {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setExpandedNotificationId((current) => (current === id ? null : id));
  }

  const navItems = [
    { name: "Overview", href: "/student", icon: LayoutDashboard, exact: true },
    { name: "Timetable", href: "/student/timetable", icon: CalendarDays },
    { name: "Attendance", href: "/student/attendance", icon: UserCheck },
    { name: "Assignments & Practicals", href: "/student/assignments", icon: ClipboardList },
    { name: "Exams & Results", href: "/student/marks", icon: GraduationCap, children: examLinks },
    { name: "Achievements", href: "/student/achievements", icon: Trophy },
    { name: "Notices", href: "/student/notices", icon: Megaphone },
    { name: "Fees & Invoices", href: "/student/fees", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-zinc-900 antialiased flex flex-col">
      {/* SINGLE UNIFIED TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* SIDEBAR RETRACT / TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            title={isSidebarOpen ? "Retract side panel" : "Expand side panel"}
            aria-label="Toggle side panel"
            className="p-2 -ml-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-zinc-700" />
          </button>

          {/* BRAND EMBLEM & LOGO */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center shrink-0 border border-zinc-200 p-0.5 shadow-xs">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-zinc-900 text-sm tracking-tight">
              RRCE ERP
            </span>
            <span className="bg-red-50 text-red-600 border border-red-200 font-bold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ml-1">
              STUDENT
            </span>
          </div>
        </div>

        {/* RIGHT TOP NAVBAR CONTROLS */}
        <div className="flex items-center gap-3">
          {/* NOTIFICATION BELL DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((open) => !open)}
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
              className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none"
            >
              <Bell aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
              {hasUnreadNotifications && (
                <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-zinc-900">Notifications</h2>
                  <span className="text-[11px] font-medium text-zinc-500">
                    {notifications.filter((n) => !n.isRead).length} unread
                  </span>
                </div>
                <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
                  {notifications.map((n) => {
                    const isExpanded = expandedNotificationId === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationClick(n.id)}
                        aria-expanded={isExpanded}
                        className={`block w-full border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-b-0 ${
                          n.isRead ? "bg-white hover:bg-zinc-50" : "bg-zinc-50 hover:bg-zinc-100"
                        }`}
                      >
                        <span className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-red-500"}`} />
                          <span className="min-w-0 flex-1">
                            <span className={`block text-xs text-zinc-900 ${n.isRead ? "font-medium" : "font-semibold"}`}>
                              {n.title}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                              {n.shortSummary}
                            </span>
                            {isExpanded && (
                              <span className="mt-2 block border-t border-zinc-200 pt-2 text-xs leading-relaxed text-zinc-700">
                                {n.fullMessage}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* STUDENT PROFILE IDENTITY */}
          <div className="flex items-center gap-2.5">
            <ProfileAvatar sizeClassName="h-8 w-8 sm:h-9 sm:w-9" />
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-zinc-900 block leading-tight">
                {student?.user?.firstName || "Gagan"} {student?.user?.lastName || "D K"}
              </span>
              <span className="text-[11px] text-zinc-400 block leading-tight mt-0.5 font-mono">
                Student • {student?.usn || "1RR25BC007"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* BACKDROP OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* RETRACTABLE SIDE PANEL */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col justify-between transition-transform duration-300 ease-in-out select-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* SIDEBAR HEADER WITH BRAND & RETRACT CLOSE BUTTON */}
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white flex items-center justify-center shrink-0 border border-zinc-200 p-0.5 shadow-xs">
                <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-zinc-900 text-sm tracking-tight">
                RRCE ERP
              </span>
              <span className="bg-red-50 text-red-600 border border-red-200 font-bold text-[9px] px-1 py-0.5 rounded uppercase tracking-wider">
                STUDENT
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Close side panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="p-2 space-y-1 mt-2">
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
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-lg transition-all ${
                        isActive
                          ? "bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600 rounded-r-lg"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sky-700" : "text-zinc-400"}`} />
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
                                className={`flex items-center rounded-lg px-3 py-2 text-xs transition-all ${
                                  isChildActive
                                    ? "bg-sky-50 text-sky-700 font-semibold"
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-lg transition-all ${
                    isActive
                      ? "bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600 rounded-r-lg"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sky-700" : "text-zinc-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RED LOGOUT ACTION BUTTON AT SIDEBAR BOTTOM */}
        <div className="border-t border-zinc-100 p-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER WITH DYNAMIC SIDEBAR MARGIN */}
      <div
        className={`min-h-screen min-w-0 flex-1 bg-[#F9FAFB] flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <main className={`flex-1 w-full mx-auto ${pathname === "/student" ? "p-0" : "p-4 sm:p-6 lg:p-8 max-w-7xl space-y-5 sm:space-y-6"}`}>
          {children}
        </main>
        <BottomNav role="STUDENT" />
      </div>
    </div>
  );
}
