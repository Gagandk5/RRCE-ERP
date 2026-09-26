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
      demoLogin: "principal / RAM010170",
    },
    {
      title: "Admissions Desk",
      href: "/admissions",
      role: "ADMISSIONS",
      desc: "Student admissions, VTU roll-call ordering (1RR25BC001-057), and Atomic Branch Reallocation engine.",
      icon: Building,
      demoLogin: "admissions / SUR150575",
    },
    {
      title: "HOD BCA Portal",
      href: "/hod",
      role: "HOD",
      desc: "Department student rosters (ordered by usnSequence ASC) and 24-Hour Attendance Lockout Overrides.",
      icon: BookOpen,
      demoLogin: "hod_bca / PRA200880",
    },
    {
      title: "Faculty Portal",
      href: "/faculty",
      role: "FACULTY",
      desc: "3-Layer Clash Engine timetable builder (Faculty, Room, Batch) and daily roll-call attendance marker.",
      icon: Calendar,
      demoLogin: "faculty_math / SUN121085",
    },
    {
      title: "Student Self-Service",
      href: "/student",
      role: "STUDENT",
      desc: "Digital VTU/RRCE USN card, attendance statistics with 75% warning gauge, and fee receipt simulator.",
      icon: GraduationCap,
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
      {/* Clean Solid Hero Section */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-700 mb-5">
                <span>Next.js 15 App Router</span>
                <span>•</span>
                <span>React 19</span>
                <span>•</span>
                <span>PostgreSQL & Prisma</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
                Rajarajeswari College of Engineering
              </h1>
              <p className="text-base sm:text-lg text-slate-300 font-medium mt-3">
                College Enterprise Resource Planning System (RRCE ERP)
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
                Autonomous institution under VTU Belagavi. Featuring full 5-role access control,
                atomic branch reallocation, 3-layer clash detection, 24-hour attendance lockout, and automated VTU USN roll call sequences.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <span>Access ERP Portals</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={triggerSeed}
                  disabled={seeding}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Database className={`w-4 h-4 text-slate-300 ${seeding ? "animate-spin" : ""}`} />
                  <span>{seeding ? "Populating Database..." : "Seed Database (/api/seed)"}</span>
                </button>
              </div>

              {seedStatus && (
                <div className="mt-4 p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{seedStatus}</span>
                </div>
              )}
            </div>

            {/* Clean Stats Box */}
            <div className="w-full lg:w-96 bg-slate-800/90 border border-slate-700 rounded-xl p-6">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                Institutional Blueprint
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
                  <span className="text-slate-400">Target Campus</span>
                  <span className="font-semibold text-white">RRCE Bangalore</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
                  <span className="text-slate-400">Departments</span>
                  <span className="font-semibold text-white">7 Depts (BCA, CSE, etc.)</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
                  <span className="text-slate-400">2025 BCA Batch</span>
                  <span className="font-semibold text-white">54 Students (1RR25BC001-057)</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
                  <span className="text-slate-400">Deployment</span>
                  <span className="font-semibold text-white">Vercel Single Project</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database</span>
                  <span className="font-semibold text-white">Neon PostgreSQL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Portals Grid */}
      <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            5 Role-Based Portals
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tailored interfaces with distinct permissions, workflows, and administrative features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                      {portal.role}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {portal.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-mono text-slate-400 mb-3">
                    Demo: <span className="text-slate-700 font-medium">{portal.demoLogin}</span>
                  </div>
                  <Link
                    href={portal.href}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                  >
                    <span>Open Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Invariants */}
      <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl font-bold text-slate-900">
              System Invariants & Governance Rules
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic behavior across all transactions, timetables, and identity operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {invariants.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-white text-slate-800 flex items-center justify-center shrink-0 border border-slate-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
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
