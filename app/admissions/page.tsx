"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  RefreshCw,
  Search,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Edit,
  Key,
} from "lucide-react";

export default function AdmissionsPortal() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("BCA");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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
      console.error("Failed to load admissions data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
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
          text: `Enrolled student ${data.student.user.firstName} ${data.student.user.lastName}! Allocated USN: ${data.student.usn} (Sequence #${data.student.usnSequence}).`,
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
        setMessage({ type: "error", text: data.error || "Enrollment failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during enrollment." });
    } finally {
      setEnrolling(false);
    }
  }

  function openEditModal(student: any) {
    setEditStudent(student);
    const dobString = student.dateOfBirth
      ? typeof student.dateOfBirth === "string"
        ? student.dateOfBirth.slice(0, 10)
        : new Date(student.dateOfBirth).toISOString().slice(0, 10)
      : "2007-01-01";

    setEditForm({
      firstName: student.user?.firstName || "",
      lastName: student.user?.lastName || "",
      dob: dobString,
      phone: student.user?.phone || "",
      quota: student.quota || "KCET",
    });
    setIsEditModalOpen(true);
  }

  async function handleUpdateStudent(e: React.FormEvent) {
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
          ...editForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Student ${data.student.name}'s details updated successfully! Default password auto-recalculated to: ${data.newPasswordFormula}`,
        });
        setIsEditModalOpen(false);
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update student details." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during student profile update." });
    } finally {
      setUpdatingStudent(false);
    }
  }

  function openReallocateModal(student: any) {
    setSelectedStudentForRealloc(student);
    const otherDepts = departments.filter((d) => d.code !== selectedDept);
    if (otherDepts.length > 0) {
      setTargetDepartmentId(otherDepts[0].id);
    }
    setIsReallocateModalOpen(true);
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
          feeAdjustment: parseFloat(feeAdjustment) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Branch Reallocation Completed! Reallocated ${data.reallocation.oldUsn} -> ${data.reallocation.newUsn} (Sequence #${data.reallocation.newSequence}). Transaction logged in Audit Ledger.`,
        });
        setIsReallocateModalOpen(false);
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Branch reallocation failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during branch reallocation." });
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
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 text-xs">
      {/* GROUNDED HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-white p-1 flex items-center justify-center shrink-0 border border-slate-700">
            <img src="/images.svg" alt="RRCE Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Admissions Directorate • USN Roll-Call Registry
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              VTU Admissions, Auto USN Sequence Assignment & Reallocations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-md transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Student Intake</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-md border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-semibold px-3 py-2 rounded-md border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-md border font-medium flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <span className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {message.text}
          </span>
          <button onClick={() => setMessage(null)} className="font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* DEPARTMENT SELECTOR TABS */}
      <div className="flex border-b border-slate-200 gap-4 font-bold">
        {["BCA", "CSE", "AIML", "ECE"].map((deptCode) => (
          <button
            key={deptCode}
            onClick={() => setSelectedDept(deptCode)}
            className={`pb-2.5 transition-colors font-mono ${
              selectedDept === deptCode
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {deptCode} Roster
          </button>
        ))}
      </div>

      {/* ROSTER TABLE CONTAINER */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {selectedDept} Class Roster (Ordered by usnSequence ASC)
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Total Enrolled Students: {students.length}
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search USN or Student Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Seq</th>
                <th className="py-2.5 px-3">USN</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Quota</th>
                <th className="py-2.5 px-3">Date of Birth</th>
                <th className="py-2.5 px-3">Formula Password</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                    #{String(st.usnSequence).padStart(3, "0")}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {st.usn}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {st.user?.firstName} {st.user?.lastName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {st.quota}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    {st.dateOfBirth ? (typeof st.dateOfBirth === "string" && st.dateOfBirth.includes("-") ? st.dateOfBirth.split("-").reverse().join("/") : new Date(st.dateOfBirth).toLocaleDateString("en-GB")) : "-"}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                    {st.user?.firstName ? `${st.user.firstName.slice(0, 3).toUpperCase()}${st.dateOfBirth ? (typeof st.dateOfBirth === "string" ? st.dateOfBirth.slice(8, 10) + st.dateOfBirth.slice(5, 7) + st.dateOfBirth.slice(2, 4) : new Date(st.dateOfBirth).toISOString().slice(8, 10) + new Date(st.dateOfBirth).toISOString().slice(5, 7) + new Date(st.dateOfBirth).toISOString().slice(2, 4)) : "141207"}` : "rrce2025"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(st)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-md font-semibold text-[11px] flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit DOB</span>
                      </button>

                      <button
                        onClick={() => openReallocateModal(st)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-[11px] flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Reallocate</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW INTAKE MODAL */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    New Student Intake Registration
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Auto Sequence Assignment (1RR25[DEPT][SEQ])
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={enrollForm.firstName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, firstName: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={enrollForm.lastName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, lastName: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="w-full p-2 border border-slate-300 rounded-md"
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
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    required
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={enrollForm.departmentId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, departmentId: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission Quota</label>
                  <select
                    value={enrollForm.quota}
                    onChange={(e) => setEnrollForm({ ...enrollForm, quota: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-bold"
                  >
                    <option value="KCET">KCET</option>
                    <option value="COMEDK">COMEDK</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {enrolling ? "Enrolling..." : "Confirm Intake Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT PROFILE MODAL */}
      {isEditModalOpen && editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Student Profile & DOB
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    USN: {editStudent.usn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Key className="w-3.5 h-3.5 shrink-0" />
                  <span>Auto Password Recalculation Notice</span>
                </div>
                <p className="leading-relaxed">
                  Updating Date of Birth or First Name automatically recalculates the student's formula password (<code className="font-mono font-bold">[NAME_3_UPPER][DD][MM][YY]</code>) and updates PostgreSQL password hashes.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStudent}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {updatingStudent ? "Updating..." : "Save & Update Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REALLOCATE BRANCH MODAL */}
      {isReallocateModalOpen && selectedStudentForRealloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Atomic Branch Reallocation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Transfer student {selectedStudentForRealloc.usn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReallocateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReallocate} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Department</label>
                <select
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-md"
                >
                  {departments
                    .filter((d) => d.code !== selectedDept)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Approval Rationale</label>
                <input
                  type="text"
                  required
                  value={reallocReason}
                  onChange={(e) => setReallocReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reallocating}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {reallocating ? "Executing..." : "Execute Reallocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
