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
    setExpandedNotificationId((current) => current === notificationId ? null : notificationId);
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
              {currentUser.role === "STUDENT" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((open) => !open)}
                    aria-label="Notifications"
                    aria-expanded={isNotificationsOpen}
                    className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                  >
                    <Bell aria-hidden="true" className="h-5 w-5" />
                    {hasUnreadNotifications && (
                      <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-xl">
                      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-zinc-900">Notifications</h2>
                        <span className="text-[11px] font-medium text-zinc-500">
                          {notifications.filter((notification) => !notification.isRead).length} unread
                        </span>
                      </div>
                      <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
                        {notifications.map((notification) => {
                          const isExpanded = expandedNotificationId === notification.id;
                          return (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleNotificationClick(notification.id)}
                              aria-expanded={isExpanded}
                              className={`block w-full border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-b-0 ${
                                notification.isRead
                                  ? "bg-white hover:bg-zinc-50"
                                  : "bg-zinc-50 hover:bg-zinc-100"
                              }`}
                            >
                              <span className="flex items-start gap-2.5">
                                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-red-500"}`} />
                                <span className="min-w-0 flex-1">
                                  <span className={`block text-xs text-zinc-900 ${notification.isRead ? "font-medium" : "font-semibold"}`}>
                                    {notification.title}
                                  </span>
                                  <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                                    {notification.shortSummary}
                                  </span>
                                  {isExpanded && (
                                    <span className="mt-2 block border-t border-zinc-200 pt-2 text-xs leading-relaxed text-zinc-700">
                                      {notification.fullMessage}
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
              )}
              {currentUser.role === "STUDENT" && <ProfileAvatar sizeClassName="h-10 w-10" />}
              <div className="text-right">
                <span className="text-sm font-medium text-zinc-900 block leading-none">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="font-mono text-xs text-zinc-500 block mt-1 leading-none">
                  {currentUser.studentProfile?.usn || currentUser.usn || currentUser.username}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3 h-3 text-zinc-400" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 px-3 py-1 rounded transition-colors font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
