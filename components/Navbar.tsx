"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpen, CalendarDays, ClipboardList, Command, FileText, Home, LayoutGrid, LogOut, Menu, Search, Settings2, Wallet, X } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);

  useEffect(() => {
    checkSession();
  }, [pathname]);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || null);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  function handleNotificationClick(notificationId: number) {
    setNotifications((current) => current.map((notification) =>
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    ));
  }

  if (pathname === "/login") {
    return null;
  }

  const roleTitleMap: Record<string, string> = {
    STUDENT: "Student Portal",
    FACULTY: "Faculty Portal",
    HOD: "HOD Directorate",
    ADMISSIONS: "Admissions Registry",
    PRINCIPAL: "Principal Desk",
  };

  const portalTitle = currentUser?.role ? roleTitleMap[currentUser.role] || "Portal" : "Portal";
  const isStudent = currentUser?.role === "STUDENT" || pathname.startsWith("/student");
  const navGroups = [
    {
      title: "Academic Workspace", items: [
        { label: "Dashboard / Overview", href: isStudent ? "/student" : "/", icon: Home },
        { label: "Class Timetable", href: isStudent ? "/student/timetable" : "/faculty", icon: CalendarDays },
        { label: "Attendance Ledger", href: isStudent ? "/student/attendance" : "/faculty/attendance", icon: ClipboardList },
        { label: "Coursework & Labs", href: isStudent ? "/student/assignments" : "/faculty", icon: BookOpen },
      ]
    },
    {
      title: "Examination & Evaluation", items: [
        { label: "Internal Marks (CIE)", href: "/student/marks", icon: FileText },
        { label: "Hall Ticket / Admit Card", href: "/student/admit-card", icon: FileText },
        { label: "University Results & Grade Cards", href: "/student/results", icon: LayoutGrid },
      ]
    },
    {
      title: "Financials & Administration", items: [
        { label: "Fee Invoices & Receipts", href: "/student/fees", icon: Wallet },
        { label: "Proctor & Student Dossier", href: "/student/profile", icon: Settings2 },
      ]
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white text-xs">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setIsSidebarOpen((open) => !open)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Toggle navigation"><Menu className="h-5 w-5" /></button>
            <Link href="/login" className="flex shrink-0 items-center gap-2 hover:opacity-90">
              <div className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white">
                <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900">RRCE ERP</span>
            </Link>
            <span className="hidden border-l border-slate-200 pl-3 font-mono text-[10px] uppercase text-slate-400 md:block">Autonomous Institution under VTU</span>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 lg:flex">AY 2025–26 · Odd Semester (Sem 3)</div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-400 md:flex"><Search className="h-3.5 w-3.5" /><span>Search USN, course, or service...</span><kbd className="ml-3 border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">Ctrl+K</kbd></div>
            <button type="button" onClick={() => setIsNotificationsOpen((open) => !open)} className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="h-4 w-4" />{hasUnreadNotifications && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}</button>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <span className="block text-sm font-medium leading-none text-slate-900">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold tracking-wide text-slate-400">{currentUser.role}</span>
                </div>
                <ProfileAvatar sizeClassName="h-8 w-8" />
                <button onClick={handleLogout} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" title="Sign out"><LogOut className="h-4 w-4" /></button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
        {isNotificationsOpen && <div className="absolute right-4 top-14 z-50 w-80 border border-slate-200 bg-white p-4 shadow-lg"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><strong className="text-sm text-slate-900">Notifications</strong><span className="text-[11px] text-slate-500">{notifications.filter((n) => !n.isRead).length} unread</span></div>{notifications.map((n) => <button key={n.id} type="button" onClick={() => handleNotificationClick(n.id)} className="block w-full border-b border-slate-100 py-3 text-left last:border-0"><span className="block text-xs font-semibold text-slate-800">{n.title}</span><span className="mt-1 block text-xs text-slate-500">{n.shortSummary}</span></button>)}</div>}
      </header>
      <aside className={`fixed bottom-0 left-0 top-14 z-50 w-64 overflow-y-auto border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden"><span className="text-xs font-semibold text-slate-700">Workspace navigation</span><button type="button" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation"><X className="h-4 w-4" /></button></div>
        <nav className="space-y-6 p-3">{navGroups.map((group) => <div key={group.title}><h2 className="px-3 pb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</h2><div className="space-y-0.5">{group.items.map((item) => { const Icon = item.icon; const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)); return <Link key={item.label} href={item.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-xs font-medium ${active ? "border-slate-900 bg-slate-100 text-slate-900" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{item.label}</Link>; })}</div></div>)}</nav>
        {currentUser && <div className="border-t border-slate-100 p-3"><button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" />Sign out</button></div>}
      </aside>
    </>
  );
}
