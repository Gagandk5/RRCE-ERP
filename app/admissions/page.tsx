"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ArrowRightLeft,
  Users,
  Receipt,
  PieChart,
  Key,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  Search,
  Bell,
  Clock,
  Sparkles,
  X,
  Loader2,
  Edit,
  Building,
  RefreshCw,
  AlertCircle,
  FileText,
  IndianRupee,
  ChevronRight,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function AdmissionsPortal() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("BCA");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // New Admission Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    firstName: "",
    lastName: "",
    dob: "2007-06-15",
    phone: "+91 9108119999",
    departmentId: "",
    quota: "KCET",
    semester: 3,
  });
  const [enrolling, setEnrolling] = useState(false);

  // Atomic Branch Reallocation Modal State
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [selectedStudentForRealloc, setSelectedStudentForRealloc] = useState<any>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [reallocReason, setReallocReason] = useState("Branch upgrade merit request approved by Admissions");
  const [feeAdjustment, setFeeAdjustment] = useState("0");
  const [reallocating, setReallocating] = useState(false);

  // Edit Student Details Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    dob: "2007-01-01",
    phone: "",
    quota: "KCET",
  });
  const [updatingStudent, setUpdatingStudent] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  async function fetchData() {
    setLoading(true);
    try {
      const dRes = await fetch("/api/departments");
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
        if (dData.departments?.length > 0 && !enrollForm.departmentId) {
          setEnrollForm((prev) => ({ ...prev, departmentId: dData.departments[0].id }));
        }
      }

      const sRes = await fetch(`/api/students?dept=${selectedDept}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.students || []);
      }
    } catch (e) {
      console.error("Admissions fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnrolling(true);
    setMessage(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Student ${data.student.user.firstName} ${data.student.user.lastName} successfully enrolled with USN: ${data.student.usn}`,
        });
        setIsEnrollModalOpen(false);
        setEnrollForm({
          firstName: "",
          lastName: "",
          dob: "2007-06-15",
          phone: "+91 9108119999",
          departmentId: departments[0]?.id || "",
          quota: "KCET",
          semester: 3,
        });
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Enrollment failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during enrollment" });
    } finally {
      setEnrolling(false);
    }
  }

  async function handleReallocateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentForRealloc || !targetDepartmentId) return;

    setReallocating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reallocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentForRealloc.id,
          targetDepartmentId,
          reason: reallocReason,
          feeAdjustment: parseFloat(feeAdjustment) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Atomic Reallocation Successful: ${selectedStudentForRealloc.usn} reallocated to ${data.newDepartmentCode}. New USN assigned: ${data.newUSN}`,
        });
        setIsReallocateModalOpen(false);
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Reallocation failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during branch reallocation" });
    } finally {
      setReallocating(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStudent) return;

    setUpdatingStudent(true);
    setMessage(null);
    try {
      const res = await fetch("/api/students/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: editStudent.id,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          dateOfBirth: editForm.dob,
          phone: editForm.phone,
          quota: editForm.quota,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Updated details for student ${data.student.usn}`,
        });
        setIsEditModalOpen(false);
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update student" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error updating student details" });
    } finally {
      setUpdatingStudent(false);
    }
  }

  // 9 Quick-Access Cards Specification
  const quickAccessCards = [
    {
      id: "intake",
      title: "New Intake",
      subtext: "Auto-sequence USN",
      icon: UserPlus,
      tint: "bg-blue-50/60 border-blue-100/80 hover:border-blue-300 text-blue-950",
      iconBg: "bg-blue-100 text-blue-700",
      badge: "Enroll",
      badgeColor: "bg-blue-100 text-blue-800",
      onClick: () => setIsEnrollModalOpen(true),
    },
    {
      id: "realloc",
      title: "Branch Transfer",
      subtext: "Interactive transaction",
      icon: ArrowRightLeft,
      tint: "bg-amber-50/60 border-amber-100/80 hover:border-amber-300 text-amber-950",
      iconBg: "bg-amber-100 text-amber-700",
      badge: "Reallocate",
      badgeColor: "bg-amber-100 text-amber-800",
      onClick: () => {
        if (students.length > 0) {
          setSelectedStudentForRealloc(students[0]);
          setTargetDepartmentId(departments.find((d) => d.code !== selectedDept)?.id || "");
          setIsReallocateModalOpen(true);
        }
      },
    },
    {
      id: "rosters",
      title: "Department Rosters",
      subtext: "BCA, CSE, AIML, ECE",
      icon: Users,
      tint: "bg-sky-50/60 border-sky-100/80 hover:border-sky-300 text-sky-950",
      iconBg: "bg-sky-100 text-sky-700",
      badge: "Directory",
      badgeColor: "bg-sky-100 text-sky-800",
      onClick: () => {
        const el = document.getElementById("registry-table");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: "invoices",
      title: "Tuition Invoices",
      subtext: "₹85,000 standard billing",
      icon: Receipt,
      tint: "bg-emerald-50/60 border-emerald-100/80 hover:border-emerald-300 text-emerald-950",
      iconBg: "bg-emerald-100 text-emerald-700",
      badge: "Billing",
      badgeColor: "bg-emerald-100 text-emerald-800",
      onClick: () => setActiveModal("invoices"),
    },
    {
      id: "quota",
      title: "Quota Matrix",
      subtext: "KCET, COMEDK, Mgmt",
      icon: PieChart,
      tint: "bg-indigo-50/60 border-indigo-100/80 hover:border-indigo-300 text-indigo-950",
      iconBg: "bg-indigo-100 text-indigo-700",
      badge: "Seat Matrix",
      badgeColor: "bg-indigo-100 text-indigo-800",
      onClick: () => setActiveModal("quota"),
    },
    {
      id: "credentials",
      title: "Profile Modifier",
      subtext: "Auto-derive passwords",
      icon: Key,
      tint: "bg-purple-50/60 border-purple-100/80 hover:border-purple-300 text-purple-950",
      iconBg: "bg-purple-100 text-purple-700",
      badge: "DOB Formula",
      badgeColor: "bg-purple-100 text-purple-800",
      onClick: () => setActiveModal("credentials"),
    },
    {
      id: "verify",
      title: "Document Verify",
      subtext: "VTU Eligibility",
      icon: CheckCircle2,
      tint: "bg-teal-50/60 border-teal-100/80 hover:border-teal-300 text-teal-950",
      iconBg: "bg-teal-100 text-teal-700",
      badge: "VTU Check",
      badgeColor: "bg-teal-100 text-teal-800",
      onClick: () => setActiveModal("verify"),
    },
    {
      id: "audit",
      title: "Audit Ledger",
      subtext: "System log entries",
      icon: ShieldAlert,
      tint: "bg-slate-100/60 border-slate-200/80 hover:border-slate-300 text-slate-950",
      iconBg: "bg-slate-200 text-slate-700",
      badge: "Audit Trail",
      badgeColor: "bg-slate-200 text-slate-800",
      onClick: () => setActiveModal("audit"),
    },
    {
      id: "analytics",
      title: "Seat Capacity",
      subtext: "Admissions 2025-26",
      icon: TrendingUp,
      tint: "bg-orange-50/60 border-orange-100/80 hover:border-orange-300 text-orange-950",
      iconBg: "bg-orange-100 text-orange-700",
      badge: "Analytics",
      badgeColor: "bg-orange-100 text-orange-800",
      onClick: () => setActiveModal("analytics"),
    },
  ];

  const filteredCards = useMemo(() => {
    if (!search.trim()) return quickAccessCards;
    const q = search.toLowerCase();
    return quickAccessCards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtext.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
    );
  }, [search]);

  // Filtered Students in Registry table
  const filteredStudents = useMemo(() => {
    const term = search.toLowerCase();
    return students.filter((s) => {
      const name = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
      return s.usn.toLowerCase().includes(term) || name.includes(term);
    });
  }, [students, search]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 selection:bg-indigo-900 selection:text-white pb-24 lg:pb-12">
      {/* 1. DEEP EXECUTIVE CURVED HERO HEADER */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white pt-6 pb-14 px-5 sm:px-8 rounded-b-[2.25rem] shadow-md">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* TOP BAR */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-1 border border-white/20 shadow-xs flex items-center justify-center shrink-0">
                <img src="/images.svg" alt="RRCE Crest" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white block">
                  Admissions Directorate
                </span>
                <span className="hidden sm:inline-block font-mono text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                  Registry & Allocation
                </span>
              </div>
            </div>

            {/* NOTIFICATION BELL & AVATAR */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">Registry Circulars</span>
                      <span className="text-[10px] text-slate-400 font-mono">Admissions 2025</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      VTU Odd Semester Admission Registry portal is open. KCET Round 2 quota verifications in progress.
                    </p>
                  </div>
                )}
              </div>

              {/* USER AVATAR */}
              <div className="flex items-center gap-2.5 pl-1.5 sm:border-l sm:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-sky-600/80 border border-sky-400/40 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  SR
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-bold text-xs text-white block leading-tight">
                    Suresh Reddy
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono block leading-tight">
                    admissions@rrce.org
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GREETING & ROLE METADATA */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-[11px] font-medium mb-2.5">
              <Sparkles className="w-3 h-3 text-sky-300" />
              <span>Directorate of Admissions & Registry • Rajarajeswari College of Engg</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hello, Suresh Reddy 👋
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Academic Intake 2025–26 • Centralized USN Generation & Atomic Branch Reallocation Engine
            </p>
          </div>

          {/* QUICK KPI CHIPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Enrolled</span>
              <span className="text-sm font-bold text-white font-mono">{students.length} Students</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Standard Tuition</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">₹85,000 / Yr</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Quota Matrix</span>
              <span className="text-sm font-bold text-sky-400 font-mono">KCET / COMEDK</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Division</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{selectedDept} Sem 3</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING OVERLAPPING SEARCH BAR */}
      <div className="relative -mt-6 mx-auto max-w-2xl px-4 z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center gap-3 px-4 h-13 transition-all focus-within:ring-2 focus-within:ring-sky-900/20 focus-within:border-slate-300">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants, USN sequence, branch transfer requests..."
            className="w-full text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-medium"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[10px] font-mono font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* 3. 3-TO-4 COLUMN SQUIRCLE QUICK-ACCESS GRID */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-9">
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
                Admissions Operations Desk
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Student intake, automated USN issuance, and branch reallocations
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredCards.length} shortcuts
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={card.onClick}
                  className={`rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[115px] sm:min-h-[125px] text-left ${card.tint}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${card.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono shrink-0 ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="font-bold text-xs sm:text-sm text-slate-950 block leading-tight tracking-tight">
                      {card.title}
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium truncate">
                      {card.subtext}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* FEEDBACK BANNER */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4. LOWER TIMELINE / RECENT ACTIVITY & MASTER REGISTRY */}
        <section id="registry-table" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight flex items-center gap-2">
                <span>Master Student Registry</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                  {students.length} Total
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live roster with branch reallocation and credentials management
              </p>
            </div>

            {/* DEPARTMENT PICKER TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    selectedDept === dept.code
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {dept.code}
                </button>
              ))}
            </div>
          </div>

          {/* REGISTRY DATA TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">SEQ</th>
                    <th className="px-4 py-3.5">USN</th>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5">Quota</th>
                    <th className="px-4 py-3.5">Tuition Fee</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.slice(0, 15).map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">
                        #{String(st.usnSequence).padStart(3, "0")}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {st.usn}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {st.user?.firstName} {st.user?.lastName}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-semibold text-slate-700">
                          {st.quota || "KCET"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                        ₹85,000
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForRealloc(st);
                              setTargetDepartmentId(departments.find((d) => d.code !== selectedDept)?.id || "");
                              setIsReallocateModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 font-semibold text-[11px] hover:bg-amber-100 transition-colors"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Transfer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditStudent(st);
                              setEditForm({
                                firstName: st.user?.firstName || "",
                                lastName: st.user?.lastName || "",
                                dob: st.dateOfBirth ? new Date(st.dateOfBirth).toISOString().slice(0, 10) : "2007-01-01",
                                phone: st.user?.phone || "",
                                quota: st.quota || "KCET",
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-[11px] hover:bg-slate-50 transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* MODALS */}
      {/* 1. New Intake Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-950">New Student Intake Registration</h3>
              </div>
              <button onClick={() => setIsEnrollModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-3.5 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name</label>
                  <input
                    required
                    value={enrollForm.firstName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, firstName: e.target.value })}
                    placeholder="e.g. Amith"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                  <input
                    required
                    value={enrollForm.lastName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, lastName: e.target.value })}
                    placeholder="e.g. T"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={enrollForm.dob}
                    onChange={(e) => setEnrollForm({ ...enrollForm, dob: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quota</label>
                  <select
                    value={enrollForm.quota}
                    onChange={(e) => setEnrollForm({ ...enrollForm, quota: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  >
                    <option value="KCET">KCET (Govt)</option>
                    <option value="COMEDK">COMEDK</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="SNQ">SNQ Quota</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <select
                    value={enrollForm.departmentId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, departmentId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    required
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                VTU USN will be auto-generated sequentially (e.g. <code>1RR25BC055</code>). Initial default password is set based on date of birth formula.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {enrolling ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Atomic Branch Reallocation Modal */}
      {isReallocateModalOpen && selectedStudentForRealloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950">Atomic Branch Reallocation</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Current: {selectedStudentForRealloc.usn} ({selectedStudentForRealloc.user?.firstName} {selectedStudentForRealloc.user?.lastName})
                  </span>
                </div>
              </div>
              <button onClick={() => setIsReallocateModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReallocateSubmit} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Department</label>
                <select
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                >
                  {departments
                    .filter((d) => d.code !== selectedDept)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Transfer Reason / Merit Ref</label>
                <input
                  required
                  value={reallocReason}
                  onChange={(e) => setReallocReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900">
                <strong>Atomic Transaction:</strong> Reallocating will retire the current USN and issue a new sequential USN in the target department. Student records and fee ledgers will migrate automatically.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reallocating}
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {reallocating ? "Migrating..." : "Confirm Branch Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Student Modal */}
      {isEditModalOpen && editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-950">Edit Student: {editStudent.usn}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name</label>
                  <input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                  <input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">DOB</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={updatingStudent} className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold">
                  {updatingStudent ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Quick-Access Informational Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-950 uppercase">
                {activeModal === "invoices" ? "Tuition Fee Invoicing Engine" : activeModal === "quota" ? "Admission Quota Matrix" : activeModal === "credentials" ? "DOB Password Formula" : activeModal === "verify" ? "VTU Document Verification" : activeModal === "audit" ? "Admissions Audit Trail" : "Seat Capacity & Analytics"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official institutional registry record managed by the Directorate of Admissions, Rajarajeswari College of Engineering.
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING/DOCKED BOTTOM THUMB NAVIGATION FOR MOBILE (<1024px) */}
      <BottomNav role="ADMISSIONS" onAction={(action) => {
        if (action === "new-intake") setIsEnrollModalOpen(true);
        if (action === "realloc" && students.length > 0) {
          setSelectedStudentForRealloc(students[0]);
          setIsReallocateModalOpen(true);
        }
      }} />
    </div>
  );
}
