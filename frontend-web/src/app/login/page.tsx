"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_CREDENTIALS,
  setStoredToken,
  setStoredUser,
  API_BASE,
  UserSession,
} from "@/lib/api";
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeLogin = async (idVal: string, passVal: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: idVal, password: passVal }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setStoredToken(data.accessToken);
        setStoredUser(data.user);

        const role = data.user.role;
        if (role === "PRINCIPAL") router.push("/principal");
        else if (role === "ADMISSION_OFFICE") router.push("/admissions");
        else if (role === "HOD") router.push("/hod");
        else if (role === "FACULTY") router.push("/faculty");
        else router.push("/student");
        return;
      }

      const matchedDemo = DEMO_CREDENTIALS.find(
        (d) =>
          d.identifier.toLowerCase() === idVal.trim().toLowerCase() ||
          (d.role === "STUDENT" && idVal.toUpperCase() === "1RR25BC007")
      );

      if (matchedDemo) {
        const mockUser: UserSession = {
          id: `usr-${matchedDemo.role.toLowerCase()}`,
          username: matchedDemo.identifier.split("@")[0],
          email: matchedDemo.identifier,
          role: matchedDemo.role,
          firstName: matchedDemo.name.split(" ")[0],
          lastName: matchedDemo.name.split(" ").slice(1).join(" ") || "R",
          isPasswordResetRequired: matchedDemo.role === "STUDENT" && passVal === "GAG141207",
          departmentName: matchedDemo.dept,
          studentProfile:
            matchedDemo.role === "STUDENT"
              ? {
                  id: "stu-gagan-007",
                  usn: "1RR25BC007",
                  usnYear: 25,
                  usnBranch: "BC",
                  usnSequence: 7,
                  currentSemester: 1,
                  quota: "CET",
                }
              : undefined,
          facultyProfile:
            matchedDemo.role === "FACULTY"
              ? {
                  id: "fac-math-014",
                  employeeCode: "RRCE-FAC-014",
                  designation: "Associate Professor",
                }
              : undefined,
        };

        setStoredToken(`mock-token-${matchedDemo.role}`);
        setStoredUser(mockUser);
        router.push(matchedDemo.route);
        return;
      }

      setError("Invalid credentials. Please check your USN / Email and password.");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in both identifier and password.");
      return;
    }
    executeLogin(identifier, password);
  };

  const handleDemoClick = (demo: (typeof DEMO_CREDENTIALS)[0]) => {
    setIdentifier(demo.identifier);
    setPassword(demo.password);
    executeLogin(demo.identifier, demo.password);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-8 px-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-200/80 text-slate-700 text-[11px] font-semibold tracking-wider uppercase mb-1">
            <GraduationCap className="w-4 h-4 text-slate-900" />
            <span>1RR • RajaRajeswari College of Engineering</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sign in to ERP Portal
          </h1>
          <p className="text-xs text-slate-500">
            VTU &amp; AICTE Autonomous Institutional Framework
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                USN / Employee ID / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 1RR25BC007 or principal@rrce.org"
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md font-medium text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sign-In Box */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Demo Sign-In</span>
              </span>
              <span className="text-[10px] text-slate-400">One-click auto fill</span>
            </div>

            <div className="space-y-1.5">
              {DEMO_CREDENTIALS.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleDemoClick(demo)}
                  className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs py-2 px-3 rounded-md text-left flex items-center justify-between transition-colors group"
                >
                  <div>
                    <span className="font-semibold text-slate-900 group-hover:text-slate-900 block">
                      {demo.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {demo.identifier}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Student Default Formula: <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">[NAME3][DD][MM][YY]</code>
        </div>
      </div>
    </div>
  );
}
