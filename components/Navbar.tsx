"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
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
  const [expandedNotificationId, setExpandedNotificationId] = useState<number | null>(null);
  const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);

  useEffect(() => {
    checkSession();
  }, [pathname]);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
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
    setExpandedNotificationId((current) => current === notificationId ? null : notificationId);
  }

  // Hide global navbar on root gateway, login page, student workspace, and faculty portal (which owns its own sidebar)
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/student") || pathname.startsWith("/faculty")) {
    return null;
  }

  const roleTitleMap: Record<string, string> = {
    STUDENT: "Student Portal",
    FACULTY: "Faculty Portal",
    HOD: "HOD Directorate",
    ADMISSIONS: "Admissions Registry",
    PRINCIPAL: "Principal Desk",
  };

  const portalTitle = currentUser?.role
    ? roleTitleMap[currentUser.role] || "Portal"
    : "Portal";

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 text-xs">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* LEFT: EMBLEM + BRAND + VERTICAL DIVIDER + PORTAL NAME */}
        <div className="flex items-center">
          <Link href="/login" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center shrink-0 border border-zinc-200">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-zinc-900 text-sm tracking-tight">
              RRCE ERP
            </span>
          </Link>
          <div className="h-4 w-px bg-zinc-200 mx-3 shrink-0" />
          <span className="text-zinc-500 text-sm font-medium">
            {portalTitle}
          </span>
        </div>

        {/* RIGHT: PROFILE INDICATOR & SIGN OUT BUTTON */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm font-medium text-zinc-900 block leading-none">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="text-[11px] text-zinc-500 block leading-none mt-1">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-zinc-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-zinc-900 text-white font-medium text-xs px-3.5 py-1.5 rounded hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
