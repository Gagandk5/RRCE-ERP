"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DEMO_CREDENTIALS,
  setStoredToken,
  setStoredUser,
  getRememberedIdentifier,
  setRememberedIdentifier,
  API_BASE,
  UserSession,
} from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";

const PORTALS = {
  student: {
    role: "STUDENT" as const,
    label: "Student",
    description: "Access attendance, timetable, fees, and academic information.",
    identifierLabel: "Student USN",
    placeholder: "e.g. 1RR25BC007",
    icon: BookOpen,
    accent: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  faculty: {
    role: "FACULTY" as const,
    label: "Faculty",
    description: "Manage classes, attendance, and assigned student records.",
    identifierLabel: "Faculty email",
    placeholder: "e.g. faculty.math@rrce.org",
    icon: BriefcaseBusiness,
    accent: "border-sky-300 bg-sky-50 text-sky-800",
  },
  hod: {
    role: "HOD" as const,
    label: "HOD",
    description: "Manage department academic operations and approvals.",
    identifierLabel: "HOD email",
    placeholder: "e.g. hod.bca@rrce.org",
    icon: ClipboardCheck,
    accent: "border-cyan-300 bg-cyan-50 text-cyan-800",
  },
  admission_office: {
    role: "ADMISSION_OFFICE" as const,
    label: "Admission Office",
    description: "Manage admissions and official student records.",
    identifierLabel: "Admission office email",
    placeholder: "e.g. admissions@rrce.org",
    icon: Building2,
    accent: "border-amber-300 bg-amber-50 text-amber-800",
  },
  principal: {
    role: "PRINCIPAL" as const,
    label: "Principal",
    description: "Access institution-level administration and oversight.",
    identifierLabel: "Principal email",
    placeholder: "e.g. principal@rrce.org",
    icon: ShieldCheck,
    accent: "border-violet-300 bg-violet-50 text-violet-800",
  },
} as const;

type PortalKey = keyof typeof PORTALS;

export default function PortalLoginPage() {
  const router = useRouter();
  const params = useParams<{ portal: string }>();
  const portal = PORTALS[params.portal as PortalKey];
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberIdentifier, setRememberIdentifier] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rememberedIdentifier = getRememberedIdentifier();
    if (rememberedIdentifier) setIdentifier(rememberedIdentifier);
  }, []);

  if (!portal) {
    router.replace("/login");
    return null;
  }

  const Icon = portal.icon;

  const executeLogin = async (idVal: string, passVal: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: idVal, password: passVal, requestedRole: portal.role }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.user.role !== portal.role) {
          setError("This account belongs to a different portal.");
          return;
        }
        setRememberedIdentifier(idVal, rememberIdentifier);
        setStoredToken(data.accessToken);
        setStoredUser(data.user);
        router.push(portal.role === "PRINCIPAL" ? "/principal" : portal.role === "ADMISSION_OFFICE" ? "/admissions" : portal.role === "HOD" ? "/hod" : portal.role === "FACULTY" ? "/faculty" : "/student");
        return;
      }

      const matchedDemo = process.env.NODE_ENV === "development" && DEMO_CREDENTIALS.find(
        (demo) => demo.role === portal.role && (demo.identifier.toLowerCase() === idVal.trim().toLowerCase() || (demo.role === "STUDENT" && idVal.toUpperCase() === "1RR25BC007")),
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
          studentProfile: matchedDemo.role === "STUDENT" ? { id: "stu-gagan-007", usn: "1RR25BC007", usnYear: 25, usnBranch: "BC", usnSequence: 7, currentSemester: 1, quota: "CET" } : undefined,
          facultyProfile: matchedDemo.role === "FACULTY" ? { id: "fac-math-014", employeeCode: "RRCE-FAC-014", designation: "Associate Professor" } : undefined,
        };
        setStoredToken(`mock-token-${matchedDemo.role}`);
        setStoredUser(mockUser);
        router.push(matchedDemo.route);
        return;
      }

      setError("Invalid credentials. Please check your login details.");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please fill in both fields.");
      return;
    }
    executeLogin(identifier, password);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-8 px-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-200/80 text-slate-700 text-[11px] font-semibold tracking-wider uppercase">
            <GraduationCap className="w-4 h-4 text-slate-900" />
            <span>1RR • RajaRajeswari College of Engineering</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{portal.label} login</h1>
          <p className="text-xs text-slate-500">{portal.description}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          <button type="button" onClick={() => router.push("/login")} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Change login type
          </button>

          <div className={`rounded-md border p-3 ${portal.accent}`}>
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">{portal.label} portal</p>
                <p className="text-[10px] opacity-75">Your account role is verified by the server.</p>
              </div>
            </div>
          </div>

          {error && <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{portal.identifierLabel}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input type="text" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={portal.placeholder} className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={rememberIdentifier} onChange={(event) => setRememberIdentifier(event.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              Remember username on this device
            </label>
            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-md font-medium text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              <span>{loading ? "Authenticating..." : `Sign in as ${portal.label}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
