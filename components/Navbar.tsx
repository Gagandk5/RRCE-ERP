"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, Shield, BookOpen, UserPlus, GraduationCap, LayoutDashboard } from "lucide-react";

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
    return null; // Keep login screen focused without top nav duplicate
  }

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 text-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* BRAND & EMBLEM */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded bg-white p-0.5 flex items-center justify-center shrink-0 border border-slate-700">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm block">
                RRCE ERP
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 font-mono">
                VTU Autonomous Institution
              </span>
            </div>
          </Link>
        </div>

        {/* ROLE NAVIGATION LINKS */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1 font-medium">
            {currentUser.role === "PRINCIPAL" && (
              <Link
                href="/principal"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  pathname === "/principal" ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Principal Desk</span>
              </Link>
            )}

            {["ADMISSIONS", "PRINCIPAL"].includes(currentUser.role) && (
              <Link
                href="/admissions"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  pathname === "/admissions" ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                <span>Admissions Registry</span>
              </Link>
            )}

            {["HOD", "PRINCIPAL"].includes(currentUser.role) && (
              <Link
                href="/hod"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  pathname === "/hod" ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>HOD Directorate</span>
              </Link>
            )}

            {["FACULTY", "HOD", "PRINCIPAL"].includes(currentUser.role) && (
              <Link
                href="/faculty"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  pathname === "/faculty" ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Faculty Attendance</span>
              </Link>
            )}

            {currentUser.role === "STUDENT" && (
              <Link
                href="/student"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  pathname === "/student" ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Student Portal</span>
              </Link>
            )}
          </nav>
        )}

        {/* USER PROFILE & LOGOUT TRIGGER */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="font-bold text-white block">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="text-[10px] font-mono font-semibold text-slate-400 block uppercase">
                  {currentUser.role} {currentUser.studentProfile?.usn ? `• ${currentUser.studentProfile.usn}` : ""}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-600/90 text-slate-200 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-md border border-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
