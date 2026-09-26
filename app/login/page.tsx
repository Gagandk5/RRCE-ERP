"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Shield,
  Building,
  BookOpen,
  Calendar,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import PasswordResetModal from "@/components/PasswordResetModal";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<any>(null);

  const demoAccounts = [
    {
      role: "PRINCIPAL",
      title: "Principal / Executive",
      username: "principal",
      pwd: "RAM010170",
      desc: "Institutional oversight, overrides & audit logs",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Shield,
    },
    {
      role: "ADMISSIONS",
      title: "Admissions Officer",
      username: "admissions",
      pwd: "SUR150575",
      desc: "Student intake & Atomic branch reallocation",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Building,
    },
    {
      role: "HOD",
      title: "HOD - BCA Dept",
      username: "hod_bca",
      pwd: "PRA200880",
      desc: "Department roster & 24h lockout override",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      icon: BookOpen,
    },
    {
      role: "FACULTY",
      title: "Faculty (Mathematics)",
      username: "faculty_math",
      pwd: "SUN121085",
      desc: "3-layer clash timetable & roll-call attendance",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: Calendar,
    },
    {
      role: "STUDENT",
      title: "BCA Student (Amith T)",
      username: "1rr25bc001",
      pwd: "AMI080707",
      desc: "Digital USN card, attendance gauge & fee invoice",
      badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: GraduationCap,
    },
  ];

  async function handleLogin(e?: React.FormEvent, customId?: string, customPwd?: string) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const targetId = customId || identifier;
    const targetPwd = customPwd || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetId, password: targetPwd }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.user.isPasswordResetRequired) {
          setResetTargetUser(data.user);
          setResetModalOpen(true);
        } else {
          router.push(data.redirectUrl || "/");
          router.refresh();
        }
      } else {
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch {
      setError("Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(account: typeof demoAccounts[0]) {
    setIdentifier(account.username);
    setPassword(account.pwd);
    handleLogin(undefined, account.username, account.pwd);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <PasswordResetModal
        isOpen={resetModalOpen}
        onSuccess={() => {
          setResetModalOpen(false);
          router.push("/student");
          router.refresh();
        }}
        username={resetTargetUser?.username}
        firstName={resetTargetUser?.firstName}
      />

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Clean Professional Form */}
        <div className="lg:col-span-6 bg-white rounded-xl p-7 md:p-9 shadow-sm border border-slate-200">
          <div className="mb-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Single Sign-On
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign In to RRCE ERP
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Rajarajeswari College of Engineering • Institutional Portal
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
                  placeholder="e.g. principal, hod_bca, 1RR25BC001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-500">
                  Formula: AMI080707
                </span>
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

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Autonomous College under VTU Belagavi • AICTE Approved
            </p>
          </div>
        </div>

        {/* Right Side: Clean Solid 1-Click Role Switcher */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">
              Quick Role Authentication
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Click any of the 5 institutional role cards below to automatically authenticate:
            </p>

            <div className="space-y-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    onClick={() => handleQuickLogin(acc)}
                    disabled={loading}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-lg transition-colors group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {acc.title}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${acc.badge}`}>
                            {acc.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{acc.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
