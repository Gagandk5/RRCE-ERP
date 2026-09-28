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
  Menu,
  X,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileContext";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Notification state for top header
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
    setIsMobileOpen(false);
  }, [pathname]);

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
    { name: "Exams & Results", href: "/student/marks", icon: GraduationCap, children: examLinks },
    { name: "Achievements", href: "/student/achievements", icon: Trophy },
    { name: "Notices", href: "/student/notices", icon: Megaphone },
    { name: "Fees & Invoices", href: "/student/fees", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-zinc-900 antialiased flex flex-col">
      {/* ADJUSTABLE TOP NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200/80 px-4 sm:px-6 h-14 flex items-center justify-between transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* SIDEBAR RETRACT / EXPAND TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileOpen((open) => !open);
              } else {
                setIsSidebarCollapsed((collapsed) => !collapsed);
              }
            }}
            title={isSidebarCollapsed ? "Expand side panel" : "Retract side panel"}
            aria-label="Toggle side panel"
            className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-zinc-700" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-zinc-700" />
            )}
          </button>

          {/* BRANDING & PORTAL TITLE */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center shrink-0 border border-zinc-200 p-0.5 shadow-xs">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-zinc-900 text-sm tracking-tight">
              RRCE ERP
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-200 mx-1 hidden sm:block shrink-0" />

          <span className="text-zinc-500 text-xs sm:text-sm font-medium hidden sm:inline-block">
            Student Portal
          </span>
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
              className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <Bell aria-hidden="true" className="h-4 h-4 sm:h-5 sm:w-5" />
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

          {/* STUDENT USN TAG */}
          <span className="font-mono text-xs text-zinc-600 bg-zinc-100 border border-zinc-200/80 px-2.5 py-1 rounded-md hidden sm:inline-block">
            {student?.usn || "1RR25BC007"}
          </span>

          {/* STUDENT PROFILE AVATAR */}
          <ProfileAvatar sizeClassName="h-8 w-8 sm:h-9 sm:w-9" />
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY BACKDROP */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* RETRACTABLE SIDE PANEL (SIDEBAR) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-zinc-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out select-none lg:fixed lg:top-0 lg:left-0 lg:bottom-0 lg:z-30 ${
          isSidebarCollapsed ? "lg:w-16" : "lg:w-64"
        } ${
          isMobileOpen ? "w-72 translate-x-0 shadow-2xl" : "w-72 -translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* BRAND / HEADER SECTION OF SIDE PANEL */}
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between h-14">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3">
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
            ) : (
              <div className="mx-auto flex items-center justify-center">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-zinc-200 p-0.5 shadow-xs">
                  <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* RETRACT TOGGLE BUTTON INSIDE SIDEBAR */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileOpen(false);
                } else {
                  setIsSidebarCollapsed((collapsed) => !collapsed);
                }
              }}
              title={isSidebarCollapsed ? "Expand panel" : "Retract panel"}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 hidden lg:block" />
              ) : (
                <PanelLeftClose className="w-4 h-4 hidden lg:block" />
              )}
              <X className="w-4 h-4 lg:hidden" />
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
                    {!isSidebarCollapsed ? (
                      <>
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
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`flex items-center rounded-xl px-3 py-2 text-xs transition-all ${
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
                      </>
                    ) : (
                      /* Collapsed Mode Icon Link for Exams */
                      <Link
                        href="/student/marks"
                        onClick={() => setIsMobileOpen(false)}
                        title="Exams & Results"
                        className={`flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all ${
                          isActive
                            ? "bg-zinc-100 text-zinc-900 font-semibold"
                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                      </Link>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={`flex items-center ${
                    isSidebarCollapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5"
                  } text-xs rounded-xl transition-all ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
                  }`}
                >
                  <Icon className={`${isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4"} shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* DOCKED PROFILE FOOTER */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 mt-auto shrink-0">
          {!isSidebarCollapsed ? (
            <div>
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
          ) : (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-zinc-400" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER WITH DYNAMIC SIDEBAR MARGIN */}
      <div
        className={`min-h-screen min-w-0 flex-1 bg-[#F9FAFB] flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        } ml-0`}
      >
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
