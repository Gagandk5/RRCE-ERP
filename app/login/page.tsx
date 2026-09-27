"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Send,
  Shield,
  UserPlus,
  BookOpen,
  Calendar,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password / SMS Dispatch Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotUsn, setForgotUsn] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{
    success: boolean;
    message: string;
    phone?: string;
  } | null>(null);

  async function executeLogin(loginId: string, loginPwd: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPwd }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(data.redirectUrl || "/student");
        router.refresh();
      } else {
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch {
      setError("Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    executeLogin(identifier, password);
  }

  function handleQuickDemoSelect(demoId: string, demoPwd: string) {
    setIdentifier(demoId);
    setPassword(demoPwd);
    executeLogin(demoId, demoPwd);
  }

  async function handleSendSmsCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSmsSending(true);
    setSmsResult(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn: forgotUsn }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSmsResult({
          success: true,
          message: data.message,
          phone: data.recipientPhone,
        });
      } else {
        setSmsResult({
          success: false,
          message: data.error || "Failed to dispatch SMS credentials.",
        });
      }
    } catch {
      setSmsResult({
        success: false,
        message: "Failed to connect to SMS Gateway server.",
      });
    } finally {
      setSmsSending(false);
    }
  }

  const DEMO_ACCOUNTS = [
    {
      roleName: "Principal",
      username: "principal",
      password: "rrce2025",
      subtitle: "Executive Oversight & Institution KPI Dashboard",
      icon: Shield,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
      roleName: "Admissions Directorate",
      username: "admissions",
      password: "rrce2025",
      subtitle: "USN Registry, Student Intake & Profile Edits",
      icon: UserPlus,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      roleName: "HOD (BCA Dept)",
      username: "hod_bca",
      password: "rrce2025",
      subtitle: "Department Oversight & 24h Lockout Overrides",
      icon: BookOpen,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      roleName: "Teaching Faculty",
      username: "faculty_math",
      password: "rrce2025",
      subtitle: "Daily Roll-Call & 3-Layer Clash Engine",
      icon: Calendar,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      roleName: "Student (Gagan D K)",
      username: "1RR25BC007",
      password: "GAG141207",
      subtitle: "USN: 1RR25BC007 • Digital VTU Card & Fee Invoices",
      icon: GraduationCap,
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* FORGOT PASSWORD SMS DISPATCH MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 p-1">
                  <img src="/images.svg" alt="RRCE Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Send Credentials via SMS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automated Student USN Credentials Dispatch
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setSmsResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {smsResult ? (
              <div className="space-y-4 text-xs">
                {smsResult.success ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      SMS Dispatched Successfully!
                    </div>
                    <p className="text-emerald-700 leading-relaxed">
                      Login credentials have been sent via SMS to your registered mobile number:
                      <strong className="block text-slate-900 font-mono text-sm mt-1">
                        {smsResult.phone}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Please check your mobile handset SMS inbox for your username and password.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{smsResult.message}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setSmsResult(null);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendSmsCredentials} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Enter Student USN
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1RR25BC007"
                      value={forgotUsn}
                      onChange={(e) => setForgotUsn(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none uppercase font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                  <strong>Automated SMS Dispatch:</strong> Credentials will be dispatched directly to your registered mobile handset via SMS. Credentials will not be displayed on screen.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={smsSending || !forgotUsn.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{smsSending ? "Dispatching SMS..." : "Send SMS Credentials"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTAINER: LOGIN FORM + DEMO ACCOUNTS PANEL */}
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: LOGIN CARD */}
        <div className="lg:col-span-6 bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-sm">
              <img src="/images.svg" alt="RRCE Official Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              RRCE ERP Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Rajarajeswari College of Engineering • Single Sign-On
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username / Email / USN
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. principal, hod_bca, 1RR25BC007"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Forgot Password? Send via SMS</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center flex items-center justify-between text-[11px] text-slate-500">
            <span>Autonomous College under VTU</span>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-slate-700 font-semibold hover:underline"
            >
              USN SMS Dispatch
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 1-CLICK DEMO ACCOUNTS PANEL */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-white mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>1-Click Demo Accounts</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click any role card below to instantly sign in with pre-configured institutional credentials.
            </p>
          </div>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const IconComponent = acc.icon;
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickDemoSelect(acc.username, acc.password)}
                  className="w-full text-left bg-white hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-white text-slate-800 flex items-center justify-center border border-slate-200 shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                          {acc.roleName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${acc.badgeColor}`}>
                          {acc.username}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {acc.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
