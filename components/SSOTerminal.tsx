"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Building2,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  MapPin,
  LifeBuoy,
  CheckCircle2,
} from "lucide-react";

type RoleType = "student" | "faculty" | "admin";

function SSOTerminalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = (searchParams.get("portal") || "").toLowerCase().trim();

  // Determine initial role from query params if provided
  const initialRole: RoleType = React.useMemo(() => {
    if (portalParam === "faculty") return "faculty";
    if (portalParam === "student") return "student";
    if (["hod", "admissions", "principal", "admin"].includes(portalParam)) return "admin";
    return "student";
  }, [portalParam]);

  const [role, setRole] = useState<RoleType>(initialRole);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);

  // Sync role if portal parameter changes
  useEffect(() => {
    if (portalParam === "faculty") setRole("faculty");
    else if (portalParam === "student") setRole("student");
    else if (["hod", "admissions", "principal", "admin"].includes(portalParam)) setRole("admin");
  }, [portalParam]);

  function handleRoleChange(newRole: RoleType) {
    setRole(newRole);
    setError(null);
  }

  function handleQuickFill(testRole: RoleType, testId: string, testPass: string) {
    setRole(testRole);
    setIdentifier(testId);
    setPassword(testPass);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter both your identifier and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        let destination = data.redirectUrl || "/student";
        if (role === "faculty" && data.user?.role === "FACULTY") {
          destination = "/faculty";
        } else if (role === "student" && data.user?.role === "STUDENT") {
          destination = "/student";
        } else if (role === "admin" && (data.user?.role === "HOD" || data.user?.role === "FACULTY")) {
          destination = data.user?.role === "HOD" ? "/hod" : "/faculty";
        } else if (role === "admin" && data.user?.role === "ADMISSIONS") {
          destination = "/admissions";
        } else if (role === "admin" && data.user?.role === "PRINCIPAL") {
          destination = "/principal";
        }

        router.push(destination);
        router.refresh();
      } else {
        setError(data.error || "Authentication failed. Please verify your credentials.");
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Dynamic configuration per active role
  const roleConfig = {
    student: {
      label: "University Seat Number (USN) or Roll No",
      placeholder: "e.g. 1RR25BC007 or 7",
      microcopy: "Default password: rrce2025 (or formula [NAME_3_UPPER][DDMMYY])",
      icon: GraduationCap,
    },
    faculty: {
      label: "Official Faculty Email",
      placeholder: "e.g. jaishankar.m@rrce.org or shreya.s@rrce.org",
      microcopy: "Default password for faculty accounts: rrce2025",
      icon: BookOpen,
    },
    admin: {
      label: "Administrative Email",
      placeholder: "e.g. hod.bca@rrce.org, admissions@rrce.org, or principal@rrce.org",
      microcopy: "Default password: rrce2025",
      icon: Building2,
    },
  }[role];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* 1. SINGLE MINIMAL INSTITUTIONAL TOP-BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: RRCE Emblem + College Name + Divider + Academic Year */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white p-0.5 border border-slate-200 flex items-center justify-center shrink-0">
              <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-sm text-slate-900 tracking-tight">
              Rajarajeswari College of Engineering
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Academic Portal 2025–26
            </span>
          </div>

          {/* Right: Campus Location & Technical Support */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Bengaluru, KA</span>
            </div>
            <div className="h-3.5 w-px bg-slate-200 hidden xs:block" />
            <a
              href="mailto:support@rrce.org?subject=RRCE%20SSO%20Terminal%20Support"
              className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors hidden xs:inline"
            >
              Technical Support
            </a>
          </div>
        </div>
      </header>

      {/* 2. CENTRAL AUTHENTICATION CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-7 sm:p-8 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-11 h-11 mx-auto rounded-xl bg-slate-50 border border-slate-200/80 p-1.5 flex items-center justify-center shadow-xs">
              <img src="/images.svg" alt="RRCE Crest" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Single Sign-On (SSO)
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Autonomous Institution under VTU Belagavi
              </p>
            </div>
          </div>

          {/* In-Place Role Segmented Switcher */}
          <div className="grid grid-cols-3 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => handleRoleChange("student")}
              className={`py-2 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                role === "student"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("faculty")}
              className={`py-2 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                role === "faculty"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`py-2 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                role === "admin"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Admin / HOD</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Context-Adaptive Identifier Input */}
            <div className="space-y-1.5">
              <label htmlFor="sso-identifier" className="block text-xs font-semibold text-slate-700">
                {roleConfig.label}
              </label>
              <div className="relative">
                <input
                  id="sso-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleConfig.placeholder}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {roleConfig.microcopy}
              </p>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <label htmlFor="sso-password">Password</label>
                <Link
                  href="/login?forgot=1"
                  onClick={(e) => {
                    e.preventDefault();
                    setError("To reset your password, contact your department HOD or use default initial password: rrce2025");
                  }}
                  tabIndex={-1}
                  className="text-slate-500 hover:text-slate-900 font-normal hover:underline text-[11px]"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="sso-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your institutional password"
                  className="w-full h-11 pl-3.5 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Drawer */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDemoDrawerOpen(!isDemoDrawerOpen)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
            >
              <span>Quick Test Accounts (BCA 3rd Sem)</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isDemoDrawerOpen ? "rotate-180 text-slate-700" : "text-slate-400"
                }`}
              />
            </button>

            {isDemoDrawerOpen && (
              <div className="mt-2.5 space-y-2 pt-1 text-xs">
                {/* 1. Prof. Jaishankar M */}
                <button
                  type="button"
                  onClick={() => handleQuickFill("faculty", "jaishankar.m@rrce.org", "rrce2025")}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700">Prof. Jaishankar M</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200/60 rounded font-semibold">
                        Faculty
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      jaishankar.m@rrce.org • DPCO (B25BCA301)
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-700">
                    Fill →
                  </span>
                </button>

                {/* 2. Student Gagan D K */}
                <button
                  type="button"
                  onClick={() => handleQuickFill("student", "1RR25BC007", "rrce2025")}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-700">Student Gagan D K</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded font-semibold">
                        Student
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      1RR25BC007 • BCA 3rd Sem (Roll #7)
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-700">
                    Fill →
                  </span>
                </button>

                {/* 3. HOD BCA Dr. Praveen Gowda */}
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin", "hod.bca@rrce.org", "rrce2025")}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 group-hover:text-purple-700">Dr. Praveen Gowda</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200/60 rounded font-semibold">
                        HOD / Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      hod.bca@rrce.org • Head, Dept of BCA
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-700">
                    Fill →
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. MINIMAL INSTITUTIONAL FOOTER */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 font-mono">
        Rajarajeswari College of Engineering • Autonomous Institution under VTU Belagavi • SSO Gateway 2025–26
      </footer>
    </div>
  );
}

export default function SSOTerminal() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
          Loading Institutional SSO Terminal...
        </div>
      }
    >
      <SSOTerminalContent />
    </Suspense>
  );
}
