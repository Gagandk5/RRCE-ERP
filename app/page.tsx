import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Building2,
  UserPlus,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "RRCE Enterprise ERP • Institutional Portal Gateway",
  description: "Official Institutional Access Gateway for Rajarajeswari College of Engineering (RRCE), Bangalore.",
};

const PORTALS = [
  {
    title: "Student Workspace",
    href: "/login?portal=student",
    icon: GraduationCap,
    badge: "Student Login",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    iconColor: "text-emerald-600 bg-emerald-50/70 border-emerald-100",
    accentHover: "hover:border-emerald-300 hover:shadow-emerald-500/5",
    description:
      "Class schedules, real-time attendance eligibility ledger, CIE marks, digital assignments, and fee payment receipts.",
  },
  {
    title: "Faculty Desk",
    href: "/login?portal=faculty",
    icon: BookOpen,
    badge: "Faculty Login",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    iconColor: "text-blue-600 bg-blue-50/70 border-blue-100",
    accentHover: "hover:border-blue-300 hover:shadow-blue-500/5",
    description:
      "Daily classroom roll-call marker, 3-layer clash engine timetable, continuous CIE evaluation ledger, and student proctoring.",
  },
  {
    title: "HOD Directorate",
    href: "/login?portal=hod",
    icon: Building2,
    badge: "HOD Login",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200/80",
    iconColor: "text-purple-600 bg-purple-50/70 border-purple-100",
    accentHover: "hover:border-purple-300 hover:shadow-purple-500/5",
    description:
      "Department oversight (BCA), faculty workload allocation, subject management, and 24-hour attendance lockout overrides.",
  },
  {
    title: "Admissions Directorate",
    href: "/login?portal=admissions",
    icon: UserPlus,
    badge: "Admissions Login",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200/80",
    iconColor: "text-amber-600 bg-amber-50/70 border-amber-100",
    accentHover: "hover:border-amber-300 hover:shadow-amber-500/5",
    description:
      "Student intake registration, deterministic USN sequence generator, fee invoices, and atomic branch reallocation.",
  },
  {
    title: "Office of the Principal",
    href: "/login?portal=principal",
    icon: ShieldAlert,
    badge: "Principal Login",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200/80",
    iconColor: "text-rose-600 bg-rose-50/70 border-rose-100",
    accentHover: "hover:border-rose-300 hover:shadow-rose-500/5",
    description:
      "Institutional executive KPIs, departmental fee collection analytics, compliance reports, and system audit trail ledger.",
  },
];

export default function RootGatewayPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-zinc-900 selection:text-white">
      {/* 1. INSTITUTIONAL TOP BAR */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white p-1 border border-zinc-200 shadow-xs flex items-center justify-center shrink-0">
              <img src="/images.svg" alt="RRCE Official Crest" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 text-sm tracking-tight sm:text-base">
                  Rajarajeswari College of Engineering
                </span>
                <span className="hidden sm:inline-block font-mono text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-semibold border border-zinc-200">
                  RRCE ERP
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium hidden xs:block">
                Autonomous Institution under VTU Belagavi • Approved by AICTE, New Delhi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-800 transition-colors"
            >
              Direct Login
            </Link>
          </div>
        </div>
      </header>

      {/* 2. GATEWAY HERO & PORTAL DIRECTORY */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full flex-1">
        {/* HERO TITLE SECTION */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-medium shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Campus Enterprise Resource Planning System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Institutional Portal Selection Gateway
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Select your academic or administrative role below to securely authenticate into your dedicated workspace.
          </p>
        </div>

        {/* 5-CARD RESPONSIVE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                className={`group bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${portal.accentHover}`}
              >
                <div className="space-y-4">
                  {/* CARD HEADER: ICON & BADGE */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${portal.iconColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${portal.badgeColor}`}
                    >
                      {portal.badge}
                    </span>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 group-hover:text-zinc-950 transition-colors">
                      {portal.title}
                    </h2>
                    <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="pt-6 mt-4 border-t border-zinc-100">
                  <Link
                    href={portal.href}
                    className="w-full inline-flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-[0.98]"
                  >
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* CAMPUS ANNOUNCEMENT / QUICK INFO CARD */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-2xl p-6 border border-zinc-700/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono">
                VTU Affiliated • Autonomous
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Academic Year 2025–26
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Semester attendance tracking, continuous internal evaluations (CIE), and timetable clash prevention are live for all departments.
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-zinc-700/60 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">System v1.0 • Live</span>
              <a
                href="https://rrce.org"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
              >
                <span>rrce.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* 3. INSTITUTIONAL FOOTER */}
      <footer className="bg-white border-t border-zinc-200/80 py-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>Mysore Road, Bengaluru, Karnataka 560074</span>
            </div>
            <span className="hidden md:inline text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <a href="mailto:support.erp@rrce.org" className="hover:text-zinc-900 transition-colors">
                support.erp@rrce.org
              </a>
            </div>
            <span className="hidden md:inline text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <span>+91 80 28437124</span>
            </div>
          </div>

          <div className="text-center md:text-right font-mono text-[11px] text-zinc-400">
            © 2025 Rajarajeswari College of Engineering. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
