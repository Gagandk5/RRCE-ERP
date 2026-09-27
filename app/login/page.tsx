"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error || "Authentication failed. Please check your credentials.");
      }
    } catch {
      setError("Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* GROUNDED INSTITUTIONAL LOGIN CARD */}
      <div className="max-w-md w-full bg-white rounded-lg p-8 border border-slate-200 shadow-sm space-y-6">
        {/* INSTITUTION EMBLEM & HEADER */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-lg bg-white p-1.5 flex items-center justify-center mx-auto border border-slate-200 shadow-sm">
            <img src="/images.svg" alt="RRCE Official Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Rajarajeswari College of Engineering
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Autonomous Institution under VTU • Enterprise Portal
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Username, Email, or Student USN
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. 1RR25BC007, principal, or faculty_math"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Students: Enter your USN or Roll No (e.g., 1RR25BC007 or 7).
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Default password formula: <code className="font-mono text-slate-600 font-semibold">[NAME_3_UPPER][DD][MM][YY]</code> (e.g. GAG141207).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-md text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center flex items-center justify-between text-[11px] text-slate-500">
          <span>Bengaluru, Karnataka</span>
          <span>RRCE ERP</span>
        </div>
      </div>
    </div>
  );
}
