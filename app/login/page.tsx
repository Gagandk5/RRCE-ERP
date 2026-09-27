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
  Building2,
  ShieldCheck,
} from "lucide-react";
import RRCELogo from "@/components/RRCELogo";
import RRCECampusBanner from "@/components/RRCECampusBanner";

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* FORGOT PASSWORD SMS DISPATCH MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Send Credentials via SMS
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Automated Student USN Mobile Dispatch
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setSmsResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-base font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {smsResult ? (
              <div className="space-y-4 text-xs">
                {smsResult.success ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      SMS Dispatched Successfully!
                    </div>
                    <p className="text-emerald-800 leading-relaxed text-xs">
                      Login credentials have been sent via SMS to your registered mobile number:
                      <strong className="block text-slate-900 font-mono text-sm mt-1.5 p-2 bg-white rounded border border-emerald-200">
                        {smsResult.phone}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Please check your mobile handset SMS inbox for your username and password.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2.5 text-xs">
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
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
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
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1RR25BC007"
                      value={forgotUsn}
                      onChange={(e) => setForgotUsn(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  <strong className="block font-bold mb-0.5">Automated SMS Dispatch:</strong> Credentials will be dispatched directly to your registered mobile handset via SMS. Credentials will not be displayed on screen.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={smsSending || !forgotUsn.trim()}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
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

      {/* TOP CONTAINER WITH CAMPUS BANNER & CENTERED LOGIN */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* RRCE Mysore Road Campus Building Banner */}
        <RRCECampusBanner />

        {/* RRCE Official Institutional Login Card */}
        <div className="bg-white rounded-2xl p-7 sm:p-9 shadow-lg border border-slate-200 max-w-md mx-auto relative overflow-hidden">
          {/* Top Gold Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 via-amber-500 to-blue-900" />

          <div className="text-center mb-6 pt-2">
            <div className="flex justify-center mb-3">
              <RRCELogo size="xl" showText={false} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sign In to RRCE ERP
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Rajarajeswari College of Engineering • Single Sign-On
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username / Email / USN
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 1RR25BC007, principal, hod_bca"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 transition-colors"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Forgot Password? Send via SMS</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

          <div className="mt-6 pt-4 border-t border-slate-100 text-center flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              VTU Autonomous
            </span>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-amber-700 font-bold hover:underline"
            >
              USN SMS Credentials
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-[11px] text-slate-500 space-y-1 py-4">
        <p className="font-semibold text-slate-700">
          Rajarajeswari College of Engineering (RRCE) • Bengaluru
        </p>
        <p>Mysore Road, Bengaluru, Karnataka 560074 • Autonomous Institution under VTU</p>
      </footer>
    </div>
  );
}
