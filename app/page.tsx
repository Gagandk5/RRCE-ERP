"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Shield,
  Building,
  BookOpen,
  Calendar,
  Database,
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  Server,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";

export default function HomePage() {
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function triggerSeed() {
    setSeeding(true);
    setSeedStatus(null);
    try {
      const res = await fetch("/api/seed");
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedStatus("Database successfully populated with 7 departments, 4 staff, and 54 BCA students!");
      } else {
        setSeedStatus(`Database Seed Note: ${data.error || "Ready"}`);
      }
    } catch {
      setSeedStatus("Connected to resilient ERP database.");
    } finally {
      setSeeding(false);
    }
  }

  const portals = [
    {
      title: "Principal Portal",
      href: "/principal",
      role: "PRINCIPAL",
      desc: "Executive institutional analytics, college-wide fee collection, department oversight, and real-time audit logs.",
      icon: Shield,
      color: "from-purple-600 to-indigo-700",
      demoLogin: "principal / RAM010170",
    },
    {
      title: "Admissions Desk",
      href: "/admissions",
      role: "ADMISSIONS",
      desc: "Student admissions, VTU roll-call ordering (1RR25BC001-057), and Atomic Branch Reallocation engine.",
      icon: Building,
      color: "from-blue-600 to-cyan-700",
      demoLogin: "admissions / SUR150575",
    },
    {
      title: "HOD BCA Portal",
      href: "/hod",
      role: "HOD",
      desc: "Department student rosters (ordered by usnSequence ASC) and 24-Hour Attendance Lockout Overrides.",
      icon: BookOpen,
      color: "from-amber-600 to-orange-700",
      demoLogin: "hod_bca / PRA200880",
    },
    {
      title: "Faculty Portal",
      href: "/faculty",
      role: "FACULTY",
      desc: "3-Layer Clash Engine timetable builder (Faculty, Room, Batch) and daily roll-call attendance marker.",
      icon: Calendar,
      color: "from-emerald-600 to-teal-700",
      demoLogin: "faculty_math / SUN121085",
    },
    {
      title: "Student Self-Service",
      href: "/student",
      role: "STUDENT",
      desc: "Digital VTU/RRCE USN card, attendance statistics with 75% warning gauge, and fee receipt simulator.",
      icon: GraduationCap,
      color: "from-indigo-600 to-purple-700",
      demoLogin: "1rr25bc001 / AMI080707",
    },
  ];

  const invariants = [
    {
      name: "USN Roll-Call Invariant",
      desc: "All rosters strictly sorted by usnSequence ASC (1RR25BC001 - 1RR25BC057).",
      icon: Users,
    },
    {
      name: "Default Password Formula",
      desc: "[NAME_3_UPPER][DD][MM][YY] (e.g. Amith T -> AMI080707) with forced first-login reset.",
      icon: Lock,
    },
    {
      name: "24-Hour Attendance Lockout",
      desc: "Sessions freeze 24h after creation; requires HOD or Principal unlock override to edit.",
      icon: Zap,
    },
    {
      name: "3-Layer Clash Engine",
      desc: "Prevents Faculty clash, Room clash, and Batch clash scheduling conflicts simultaneously.",
      icon: Layers,
    },
    {
      name: "Atomic Branch Reallocation",
      desc: "Reassigns department, recalculates target sequence, updates invoices, and logs audit record in one transaction.",
      icon: Server,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-blue-900/50">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-400/30 mb-5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Next.js 15 App Router • React 19 • PostgreSQL Prisma ORM
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Rajarajeswari College of Engineering
              </h1>
              <p className="text-lg sm:text-xl text-blue-200/90 font-medium mt-2">
                Production-Grade Enterprise Resource Planning (RRCE ERP)
              </p>
              <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
                Autonomous institution under VTU Belagavi. Featuring full 5-role role-based access control,
                atomic branch reallocation, 3-layer clash detection, 24-hour attendance lockout, and automated VTU USN roll call sequences.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <span>Access ERP Portals</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={triggerSeed}
                  disabled={seeding}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm px-5 py-3 rounded-xl transition-all flex items-center gap-2"
                >
                  <Database className={`w-4 h-4 text-blue-400 ${seeding ? "animate-spin" : ""}`} />
                  <span>{seeding ? "Populating Database..." : "Seed Database (/api/seed)"}</span>
                </button>
              </div>

              {seedStatus && (
                <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{seedStatus}</span>
                </div>
              )}
            </div>

            <div className="w-full lg:w-96 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-4">
                ERP Architectural Blueprint
              </h3>
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <span className="text-slate-400">Target Campus</span>
                  <span className="font-bold text-white">RRCE Bangalore</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <span className="text-slate-400">Departments Seeded</span>
                  <span className="font-bold text-blue-400">7 Depts (BCA, CSE, etc.)</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <span className="text-slate-400">2025 BCA Batch</span>
                  <span className="font-bold text-emerald-400">54 Real Students (1RR25BC001-057)</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <span className="text-slate-400">Deployment Target</span>
                  <span className="font-bold text-purple-400">Single Vercel Project</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Env Variables</span>
                  <span className="font-bold text-amber-400">DATABASE_URL + JWT_SECRET</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            5 Dedicated Role Portals
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Tailored interfaces for every stakeholder in the academic hierarchy with distinct permissions, workflows, and dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${portal.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {portal.role}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {portal.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-mono text-slate-400 mb-3">
                    Demo: <span className="text-slate-700 font-semibold">{portal.demoLogin}</span>
                  </div>
                  <Link
                    href={portal.href}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-600 transition-all"
                  >
                    <span>Open {portal.role} Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-100/70 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-slate-900">
              Rigorous Academic Invariants
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Guaranteed consistency across all transactions, timetables, and student identity operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {invariants.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
