"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
