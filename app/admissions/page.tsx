"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  UserPlus,
  RefreshCw,
  Search,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  CreditCard,
  Hash,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function AdmissionsPortal() {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("BCA");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New Admission Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    firstName: "",
    lastName: "",
    dob: "2007-06-15",
    phone: "+91 9108119999",
    departmentId: "",
    quota: "KCET",
    semester: 1,
  });
  const [enrolling, setEnrolling] = useState(false);

  // Branch Reallocation Modal state
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [selectedStudentForRealloc, setSelectedStudentForRealloc] = useState<any>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [reallocReason, setReallocReason] = useState("Branch upgrade merit request approved by Admissions");
  const [feeAdjustment, setFeeAdjustment] = useState("0");
  const [reallocating, setReallocating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch departments
      const dRes = await fetch("/api/departments");
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
        if (dData.departments?.length > 0 && !enrollForm.departmentId) {
          setEnrollForm((prev) => ({ ...prev, departmentId: dData.departments[0].id }));
        }
      }

      // 2. Fetch students (Invariant 2: ordered by usnSequence ASC)
      const sRes = await fetch(`/api/students?dept=${selectedDept}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.students || []);
      }
    } catch (e) {
      console.error("Failed to load admissions data:", e);
    } finally {
      setLoading(false);
    }
  }

  // Handle Enrollment
  async function handleEnroll(e: React.FormEvent) {
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
          text: `Enrolled successfully! Assigned USN: ${data.generatedUsn} | Temporary Formula Password: ${data.defaultPassword}`,
        });
        setIsEnrollModalOpen(false);
        setEnrollForm({
          firstName: "",
          lastName: "",
          dob: "2007-06-15",
          phone: "+91 9108119999",
          departmentId: departments[0]?.id || "",
          quota: "KCET",
          semester: 1,
        });
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Enrollment failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Connection error during enrollment." });
    } finally {
      setEnrolling(false);
    }
  }

  // Handle Branch Reallocation
  async function handleReallocate(e: React.FormEvent) {
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
          feeAdjustmentAmount: Number(feeAdjustment) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Atomic Reallocation Complete! ${selectedStudentForRealloc.user.firstName} reallocated from ${data.oldDepartmentCode} (${data.oldUsn}) to ${data.newDepartmentCode} (${data.newUsn}). Audit log created.`,
        });
        setIsReallocateModalOpen(false);
        setSelectedStudentForRealloc(null);
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Branch reallocation failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to perform atomic reallocation." });
    } finally {
      setReallocating(false);
    }
  }

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    return s.usn.toLowerCase().includes(term) || fullName.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-blue-900/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 border border-blue-400/30">
              VTU Admissions & Academic Registry
            </div>
            <h1 className="text-2xl font-black text-white">Admissions Directorate</h1>
            <p className="text-xs text-blue-200/80">
              VTU USN Roll-Call Sequencing • Atomic Branch Reallocations • Quota Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Admission Intake</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            {message.text}
          </span>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Filter and Invariant Notice */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by USN or Student Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d.id || d.code} value={d.code}>
                {d.code} Department
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>

        <div className="text-[11px] text-blue-700 bg-blue-50/80 border border-blue-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 font-medium">
          <Hash className="w-3.5 h-3.5 text-blue-600" />
          <span>Invariant: Guaranteed Roster Order by <strong>usnSequence ASC</strong> (1RR25BC001 - 057)</span>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Department Student Roster ({selectedDept})
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredStudents.length} students enrolled in {selectedDept}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Batch 2025-26
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Seq</th>
                <th className="py-3 px-4">USN</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Quota</th>
                <th className="py-3 px-4">DOB</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Annual Fee (₹85k)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    {loading ? "Loading roster..." : "No students found matching your search."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const invoice = st.invoices?.[0];
                  const isPaid = invoice?.status === "PAID";
                  const isPending = invoice?.status === "PENDING";

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{String(st.usnSequence).padStart(3, "0")}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-blue-700">
                        {st.usn}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {st.user?.firstName} {st.user?.lastName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            st.quota === "KCET"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : st.quota === "COMEDK"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {st.quota}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(st.dateOfBirth).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {st.user?.phone || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800"
                              : isPending
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {invoice?.status || "PENDING"} (₹{(invoice?.paidAmount || 0).toLocaleString("en-IN")})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudentForRealloc(st);
                            setIsReallocateModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-2.5 py-1 rounded-lg border border-blue-200 hover:border-blue-600 transition-all"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Reallocate Branch
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ATOMIC BRANCH REALLOCATION MODAL */}
      {isReallocateModalOpen && selectedStudentForRealloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Atomic Branch Reallocation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transactional USN sequence increment & audit log
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReallocateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Current Details */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">
                  {selectedStudentForRealloc.user.firstName} {selectedStudentForRealloc.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current USN:</span>
                <span className="font-mono font-bold text-blue-700">
                  {selectedStudentForRealloc.usn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Department:</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudentForRealloc.department?.name || selectedDept} ({selectedStudentForRealloc.usnBranch})
                </span>
              </div>
            </div>

            <form onSubmit={handleReallocate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Department (Destination Branch)
                </label>
                <select
                  required
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Target Department --</option>
                  {departments
                    .filter((d) => d.id !== selectedStudentForRealloc.departmentId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code} - USN Code: {d.usnCode})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fee Adjustment (₹ Difference for Target Branch)
                </label>
                <input
                  type="number"
                  value={feeAdjustment}
                  onChange={(e) => setFeeAdjustment(e.target.value)}
                  placeholder="0 (e.g. 5000 if premium branch)"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Branch Change (Logged into Permanent Audit Trail)
                </label>
                <textarea
                  rows={2}
                  required
                  value={reallocReason}
                  onChange={(e) => setReallocReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] leading-relaxed">
                <strong>Transactional Guarantee:</strong> This operation executes inside a Prisma interactive transaction. It queries the max sequence of the target department, generates a new USN, adjusts the fee invoice, updates student relations, and creates an audit entry.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reallocating || !targetDepartmentId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {reallocating ? "Executing Transaction..." : "Confirm & Reallocate Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ADMISSION INTAKE MODAL */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    New Student Admission Intake
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-USN generation & default formula password
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chethan"
                    value={enrollForm.firstName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, firstName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gowda"
                    value={enrollForm.lastName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, lastName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={enrollForm.dob}
                    onChange={(e) => setEnrollForm({ ...enrollForm, dob: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9108110000"
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    required
                    value={enrollForm.departmentId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, departmentId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quota</label>
                  <select
                    value={enrollForm.quota}
                    onChange={(e) => setEnrollForm({ ...enrollForm, quota: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="KCET">KCET (Govt. Quota)</option>
                    <option value="COMEDK">COMEDK (Merit Quota)</option>
                    <option value="MANAGEMENT">Management Quota</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-[11px] leading-relaxed">
                <strong>Automations Applied:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Calculates next sequence in branch and assigns official VTU USN.</li>
                  <li>Generates default password via <code className="font-bold">[NAME_3_UPPER][DD][MM][YY]</code>.</li>
                  <li>Creates ₹85,000 initial tuition fee invoice for 2025-26.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {enrolling ? "Enrolling..." : "Enroll Student & Issue USN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
