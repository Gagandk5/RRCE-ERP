"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

const PORTALS = [
  {
    role: "STUDENT" as const,
    label: "Student",
    description: "USN and academic information",
    identifier: "Use your USN",
    route: "/student",
    icon: BookOpen,
    accent: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  {
    role: "FACULTY" as const,
    label: "Faculty",
    description: "Classes, attendance, and students",
    identifier: "Use official email",
    route: "/faculty",
    icon: BriefcaseBusiness,
    accent: "border-sky-300 bg-sky-50 text-sky-800",
  },
  {
    role: "HOD" as const,
    label: "HOD",
    description: "Department academic operations",
    identifier: "Use official email",
    route: "/hod",
    icon: ClipboardCheck,
    accent: "border-cyan-300 bg-cyan-50 text-cyan-800",
  },
  {
    role: "ADMISSION_OFFICE" as const,
    label: "Admission Office",
    description: "Admissions and student records",
    identifier: "Use official email",
    route: "/admissions",
    icon: Building2,
    accent: "border-amber-300 bg-amber-50 text-amber-800",
  },
  {
    role: "PRINCIPAL" as const,
    label: "Principal",
    description: "Institution-level administration",
    identifier: "Use official email",
    route: "/principal",
    icon: ShieldCheck,
    accent: "border-violet-300 bg-violet-50 text-violet-800",
  },
] as const;

export default function LoginPage() {
  const router = useRouter();

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

        {/* Portal selection card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Who is logging in?</h2>
                <p className="text-[11px] text-slate-500">Choose the portal that matches your account.</p>
              </div>
              <span className="text-[10px] text-slate-400">Secure role check</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PORTALS.map((portal) => {
                const Icon = portal.icon;
                return (
                  <button
                    key={portal.role}
                    type="button"
                    onClick={() => router.push(`/login/${portal.role.toLowerCase()}`)}
                    className={`min-h-[92px] rounded-md border p-3 text-left transition-colors hover:shadow-sm ${portal.accent}`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="block text-[11px] font-semibold leading-tight">{portal.label}</span>
                    <span className="block mt-1 text-[9px] leading-tight opacity-75">{portal.identifier}</span>
                  </button>
                );
              })}
            </div>
            <p className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-[10px] text-slate-500">Select your role to open its separate secure login page.</p>
          </section>
        </div>

        <div className="text-center text-xs text-slate-500">
          Student Default Formula: <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">[NAME3][DD][MM][YY]</code>
        </div>
      </div>
    </div>
  );
}
