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
  Hash,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function AdmissionsPortal() {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("BCA");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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
      console.error("Failed to load admissions data:", e);
    } finally {
      setLoading(false);
    }
  }

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
          text: `Enrolled successfully! Assigned USN: ${data.generatedUsn} | Temporary Password: ${data.defaultPassword}`,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-xl p-6 md:p-8 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider mb-1 border border-slate-700">
              VTU Admissions & Academic Registry
            </div>
            <h1 className="text-xl font-bold text-white">Admissions Directorate</h1>
            <p className="text-xs text-slate-400">
              VTU USN Roll-Call Sequencing • Atomic Branch Reallocations • Quota Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Student Admission</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border text-xs font-medium flex items-center justify-between ${
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
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by USN or Student Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-800" : ""}`} />
          </button>
        </div>

        <div className="text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
          <Hash className="w-3.5 h-3.5 text-slate-600" />
          <span>Invariant: Guaranteed Roster Order by <strong>usnSequence ASC</strong> (1RR25BC001 - 057)</span>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Department Student Roster ({selectedDept})
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredStudents.length} students enrolled in {selectedDept}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
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
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{String(st.usnSequence).padStart(3, "0")}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {st.usn}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {st.user?.firstName} {st.user?.lastName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
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
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
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
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:border-slate-900 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <ArrowRightLeft className="w-4 h-4" />
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

            <div className="bg-slate-50 rounded-lg p-3.5 mb-4 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">
                  {selectedStudentForRealloc.user.firstName} {selectedStudentForRealloc.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current USN:</span>
                <span className="font-mono font-bold text-slate-900">
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
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] leading-relaxed">
                <strong>Transactional Guarantee:</strong> This operation executes inside a Prisma interactive transaction. It queries the max sequence of the target department, generates a new USN, adjusts the fee invoice, updates student relations, and creates an audit entry.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reallocating || !targetDepartmentId}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <UserPlus className="w-4 h-4" />
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
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="KCET">KCET (Govt. Quota)</option>
                    <option value="COMEDK">COMEDK (Merit Quota)</option>
                    <option value="MANAGEMENT">Management Quota</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-[11px] leading-relaxed">
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
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
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
