"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, ArrowRight, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = (searchParams.get("portal") || "").toLowerCase().trim();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contextual configurations based on selected portal
  const portalConfig = React.useMemo(() => {
    switch (portalParam) {
      case "faculty":
        return {
          badge: "FACULTY PORTAL LOGIN",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          portalName: "Faculty Desk",
          label: "Official RRCE Email",
          placeholder: "e.g. jaishankar.m@rrce.org or shreya.s@rrce.org",
          helpText: "Default password for all faculty is: rrce2025",
        };
      case "student":
        return {
          badge: "STUDENT PORTAL LOGIN",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          portalName: "Student Workspace",
          label: "Student USN or Roll Number",
          placeholder: "e.g. 1RR25BC007 or 7",
          helpText: "Default password: rrce2025 (or formula [NAME_3_UPPER][DDMMYY])",
        };
      case "hod":
        return {
          badge: "HOD DIRECTORATE LOGIN",
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
          portalName: "HOD Directorate",
          label: "HOD Email",
          placeholder: "hod.bca@rrce.org",
          helpText: "Default password: rrce2025",
        };
      case "admissions":
        return {
          badge: "ADMISSIONS REGISTRY LOGIN",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
          portalName: "Admissions Directorate",
          label: "Institutional Email",
          placeholder: "admissions@rrce.org",
          helpText: "Default password: rrce2025",
        };
      case "principal":
        return {
          badge: "OFFICE OF THE PRINCIPAL LOGIN",
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
          portalName: "Principal Desk",
          label: "Institutional Email",
          placeholder: "principal@rrce.org",
          helpText: "Default password: rrce2025",
        };
      default:
        return {
          badge: "ENTERPRISE ERP LOGIN",
          badgeColor: "bg-zinc-100 text-zinc-700 border-zinc-200",
          portalName: "Enterprise Portal",
          label: "Username, Email, or Student USN",
          placeholder: "e.g. jaishankar.m@rrce.org, 1RR25BC007, or hod.bca@rrce.org",
          helpText: "Default initial password for all faculty and staff: rrce2025",
        };
    }
  }, [portalParam]);

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
        let destination = data.redirectUrl || "/student";
        if (portalParam === "faculty" && data.user?.role === "FACULTY") {
          destination = "/faculty";
        } else if (portalParam === "student" && data.user?.role === "STUDENT") {
          destination = "/student";
        } else if (portalParam === "hod" && (data.user?.role === "HOD" || data.user?.role === "FACULTY")) {
          destination = "/hod";
        } else if (portalParam === "admissions" && (data.user?.role === "ADMISSIONS" || data.user?.role === "PRINCIPAL")) {
          destination = "/admissions";
        } else if (portalParam === "principal" && data.user?.role === "PRINCIPAL") {
          destination = "/principal";
        }

        router.push(destination);
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* GROUNDED INSTITUTIONAL LOGIN CARD */}
      <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/90 shadow-sm space-y-6">
        {/* BACK TO PORTAL SELECTION LINK */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal Selection</span>
          </Link>
          <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
            2025–26
          </span>
        </div>

        {/* INSTITUTION EMBLEM & CONTEXTUAL HEADER */}
        <div className="text-center space-y-3 pt-1">
          <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center mx-auto border border-zinc-200 shadow-xs">
            <img src="/images.svg" alt="RRCE Official Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="inline-block mb-1.5">
              <span
                className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border uppercase ${portalConfig.badgeColor}`}
              >
                {portalConfig.badge}
              </span>
            </div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
              Rajarajeswari College of Engineering
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Autonomous Institution under VTU • Bengaluru
            </p>
          </div>
        </div>

        {/* ERROR NOTIFICATION BANNER */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* AUTHENTICATION FORM */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 mb-1.5">
              {portalConfig.label}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                autoFocus
                placeholder={portalConfig.placeholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-zinc-700">
                Password
              </label>
              <span className="text-[11px] text-zinc-400">Default: rrce2025</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed bg-zinc-50 border border-zinc-200/80 p-2 rounded-lg">
              {portalConfig.helpText}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-4 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <>
                <span>Sign In to {portalConfig.portalName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* FOOTER METADATA */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit TLS</span>
          </div>
          <Link href="/" className="hover:text-zinc-900 font-medium transition-colors">
            Switch Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-zinc-500">
          Loading authentication gateway...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
