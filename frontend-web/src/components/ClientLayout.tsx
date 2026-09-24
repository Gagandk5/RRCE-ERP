"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PasswordResetDialog from "@/components/PasswordResetDialog";
import { getStoredUser, clearSession, UserSession } from "@/lib/api";
import { GraduationCap, LogOut, KeyRound } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const checkUser = () => {
      const u = getStoredUser();
      setUser(u);
      if (u?.isPasswordResetRequired && u.role === "STUDENT") {
        setShowResetDialog(true);
      }
    };
    checkUser();

    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, [pathname]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    router.push("/login");
  };

  const isLoginPage = pathname === "/login";

  return (
    <>
      {/* Clean 56px Enterprise White Top Navigation Bar (Hidden on /login) */}
      {!isLoginPage && (
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 px-6 flex items-center justify-between shadow-sm">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
            {/* Left Branding & Department Indicator */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => {
                if (user?.role === "PRINCIPAL") router.push("/principal");
                else if (user?.role === "ADMISSION_OFFICE") router.push("/admissions");
                else if (user?.role === "HOD") router.push("/hod");
                else if (user?.role === "FACULTY") router.push("/faculty");
                else router.push("/student");
              }}
            >
              <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  RRCE ERP
                </span>
                <span className="text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
                  RajaRajeswari College of Engineering
                </span>
                {user?.departmentName && (
                  <span className="hidden md:inline-flex text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {user.departmentName}
                  </span>
                )}
              </div>
            </div>

            {/* Right User Meta & Explicit Sign Out */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {user.firstName ? user.firstName[0] : "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-semibold text-slate-900 block leading-none">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
              )}

              {user?.isPasswordResetRequired && (
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-medium"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Reset Password</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 border border-slate-200 bg-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mandatory Password Reset Modal */}
      <PasswordResetDialog
        isOpen={showResetDialog}
        onSuccess={() => {
          setShowResetDialog(false);
          const u = getStoredUser();
          if (u) {
            u.isPasswordResetRequired = false;
            setUser({ ...u });
          }
        }}
        onClose={() => setShowResetDialog(false)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">RRCE ERP System</span> • RajaRajeswari College of Engineering (Autonomous, VTU Belagavi)
          </div>
          <div className="text-slate-400">
            Institutional Standards: usnSequence ASC Roll-Call • 3-Layer Timetable Clash Engine • 24h Lockout
          </div>
        </div>
      </footer>
    </>
  );
}
