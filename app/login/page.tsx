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
  Key,
  Copy,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password / Credentials Retrieval Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotUsn, setForgotUsn] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
    usn?: string;
    password?: string;
    phone?: string;
    explanation?: string;
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
          studentName: data.studentName,
          usn: data.usn,
          password: data.password,
          phone: data.recipientPhone,
          explanation: data.formulaExplanation,
        });
      } else {
        setSmsResult({
          success: false,
          message: data.error || "Failed to retrieve credentials.",
        });
      }
    } catch {
      setSmsResult({
        success: false,
        message: "Failed to connect to authentication server.",
      });
    } finally {
      setSmsSending(false);
    }
  }

  function handleAutoFillAndLogin() {
    if (smsResult?.usn && smsResult?.password) {
      setIdentifier(smsResult.usn);
      setPassword(smsResult.password);
      setIsForgotModalOpen(false);
      executeLogin(smsResult.usn, smsResult.password);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* FORGOT PASSWORD CREDENTIALS RECOVERY MODAL */}
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
                    Find Login Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    RRCE Academic USN Registry Lookup
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
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Record Found for {smsResult.studentName}</span>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 border border-slate-800">
                      <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                        <span>Student Name:</span>
                        <strong className="text-white">{smsResult.studentName}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                        <span>USN / Username:</span>
                        <strong className="text-white font-mono text-xs">{smsResult.usn}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                        <span>Calculated Password:</span>
                        <strong className="text-emerald-400 font-mono text-sm tracking-wider">{smsResult.password}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Mobile Contact:</span>
                        <strong className="text-slate-300 font-mono text-xs">{smsResult.phone}</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                      Password Formula: <code className="font-bold text-slate-800">{smsResult.explanation}</code>
                    </p>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleAutoFillAndLogin}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Auto-Fill & Sign In Now</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{smsResult.message}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSmsResult(null)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg text-xs"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSendSmsCredentials} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Enter USN, First Name, or Roll Sequence
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1RR25BC007 or Gagan or 7"
                      value={forgotUsn}
                      onChange={(e) => setForgotUsn(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none uppercase font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                  <strong>Academic Registry Lookup:</strong> Enter your USN (e.g. 1RR25BC007), First Name (e.g. Gagan), or Roll Sequence (e.g. 7) to recover your login password instantly.
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
                    <span>{smsSending ? "Searching..." : "Retrieve Credentials"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CLEAN CENTERED LOGIN CARD */}
      <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-sm border border-slate-200">
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
                <span>Forgot Password? Recover Credentials</span>
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
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}
