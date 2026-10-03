"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Camera,
  Upload,
  X,
  User,
  GraduationCap,
  Lock,
  ShieldCheck,
  Trash2,
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

  // Edit Student Master Details Modal State (Includes Master Details & Branch Reallocation)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "2007-01-01",
    usn: "",
    departmentId: "",
    semester: 3,
    section: "A",
    quota: "KCET",
    isActive: true,
    reallocReason: "Branch upgrade merit request approved by Admissions",
    feeAdjustment: "0",
  });
  const [updatingStudent, setUpdatingStudent] = useState(false);

  // Delete Student Modal State
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Photo Preview & Upload Modal State
  const [photoModalStudent, setPhotoModalStudent] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function getStudentPhoto(st: any): string | null {
    if (st?.user?.photoUrl) return st.user.photoUrl;
    if (typeof window !== "undefined" && st?.usn) {
      const key = `rrce-erp-profile-image-${st.usn.toLowerCase().trim()}`;
      return window.localStorage.getItem(key) || null;
    }
    return null;
  }

  function getStudentInitials(firstName?: string, lastName?: string): string {
    const f = (firstName || "").trim();
    const l = (lastName || "").trim();
    if (!f && !l) return "ST";
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    return f.slice(0, 2).toUpperCase();
  }

  function formatRosterDate(rawDob: any): string {
    if (!rawDob) return "—";
    try {
      const date = typeof rawDob === "string" ? new Date(rawDob) : rawDob;
      if (isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "—";
    }
  }

  function getFormulaPassword(st: any): string {
    const namePrefix = (st?.user?.firstName || "STU").slice(0, 3).toUpperCase();
    if (!st?.dateOfBirth) return `${namePrefix}141207`;
    try {
      const d = typeof st.dateOfBirth === "string" ? new Date(st.dateOfBirth) : st.dateOfBirth;
      if (isNaN(d.getTime())) return `${namePrefix}141207`;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${namePrefix}${day}${month}${year}`;
    } catch {
      return `${namePrefix}141207`;
    }
  }

  async function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !photoModalStudent) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) return;

    setUploadingPhoto(true);
    try {
      const image = await createImageBitmap(file);
      const maxDim = 512;
      const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      const base64 = canvas.toDataURL("image/jpeg", 0.88);

      if (typeof window !== "undefined" && photoModalStudent.usn) {
        window.localStorage.setItem(
          `rrce-erp-profile-image-${photoModalStudent.usn.toLowerCase().trim()}`,
          base64
        );
      }

      await fetch("/api/students/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: photoModalStudent.id,
          usn: photoModalStudent.usn,
          photoUrl: base64,
        }),
      });

      setMessage({
        type: "success",
        text: `Profile photo updated successfully for ${photoModalStudent.user?.firstName || photoModalStudent.usn}!`,
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.id === photoModalStudent.id
            ? { ...s, user: { ...s.user, photoUrl: base64 } }
            : s
        )
      );

      setPhotoModalStudent((prev: any) =>
        prev ? { ...prev, user: { ...prev.user, photoUrl: base64 } } : null
      );
    } catch (err) {
      console.error("Photo upload error:", err);
      setMessage({ type: "error", text: "Failed to upload student photo." });
    } finally {
      setUploadingPhoto(false);
    }
  }

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
      email: student.user?.email || `${student.usn.toLowerCase()}@student.rrce.org`,
      phone: student.user?.phone || "",
      dob: dobString,
      usn: student.usn || "",
      departmentId: student.departmentId || student.department?.id || (departments[0]?.id || ""),
      semester: student.currentSemester || 3,
      section: student.section || "A",
      quota: student.quota || "KCET",
      isActive: student.user?.isActive !== false,
      reallocReason: "Branch upgrade merit request approved by Admissions",
      feeAdjustment: "0",
    });
    setIsEditModalOpen(true);
  }

  async function handleUpdateStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editStudent) return;
    setUpdatingStudent(true);
    setMessage(null);

    try {
      const { usn: formUsn, ...restEditForm } = editForm;
      const res = await fetch("/api/students/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: editStudent.id,
          usn: editStudent.usn,
          newUsn: formUsn.trim().toUpperCase() !== editStudent.usn ? formUsn.trim().toUpperCase() : undefined,
          ...restEditForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const successText = data.wasReallocated
          ? `Branch Reallocation Completed! Reallocated to ${data.targetDeptCode} with allocated USN: ${data.newUsn}. Default password: ${data.newFormulaPassword}`
          : `Student ${editForm.firstName}'s master information updated successfully! ${
              data.newFormulaPassword ? `Default formula password: ${data.newFormulaPassword}` : ""
            }`;
        setMessage({
          type: "success",
          text: successText,
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

  async function handleDeleteStudent() {
    if (!deleteConfirmStudent) return;
    setDeletingStudent(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/students?id=${deleteConfirmStudent.id}&usn=${deleteConfirmStudent.usn}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== "undefined" && deleteConfirmStudent.usn) {
          window.localStorage.removeItem(
            `rrce-erp-profile-image-${deleteConfirmStudent.usn.toLowerCase().trim()}`
          );
        }

        setMessage({
          type: "success",
          text: `Student ${deleteConfirmStudent.user?.firstName || deleteConfirmStudent.usn} (${deleteConfirmStudent.usn}) was permanently removed from records.`,
        });

        setDeleteConfirmStudent(null);
        setIsEditModalOpen(false);
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete student record." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during student deletion." });
    } finally {
      setDeletingStudent(false);
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
                <th className="py-2.5 px-3 text-center">Photo</th>
                <th className="py-2.5 px-3">USN & Class</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Quota</th>
                <th className="py-2.5 px-3">Date of Birth</th>
                <th className="py-2.5 px-3">Formula Password</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => {
                const photoSrc = getStudentPhoto(st);
                const initials = getStudentInitials(st.user?.firstName, st.user?.lastName);

                return (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">
                      #{String(st.usnSequence).padStart(3, "0")}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPhotoModalStudent(st)}
                        title="Click to view or upload student photo"
                        className="group relative inline-flex items-center justify-center focus:outline-none"
                      >
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={`${st.user?.firstName || "Student"} Photo`}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center font-mono select-none group-hover:bg-slate-200 transition-colors">
                            {initials}
                          </div>
                        )}
                        <span className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    </td>

                    <td className="py-2 px-3 font-mono">
                      <div className="font-bold text-slate-900">{st.usn}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        Sem {st.currentSemester || 3} • Sec {st.section || "A"}
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-900 block leading-tight">
                        {st.user?.firstName} {st.user?.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {st.user?.email || `${st.usn.toLowerCase()}@student.rrce.org`}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {st.quota}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-slate-600 font-mono">
                      {formatRosterDate(st.dateOfBirth)}
                    </td>

                    <td className="py-2 px-3 font-mono text-emerald-700 font-bold">
                      {getFormulaPassword(st)}
                    </td>

                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEditModal(st)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-blue-700 border border-slate-200 rounded-md font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmStudent(st)}
                          title={`Delete record for ${st.usn}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* EDIT STUDENT MASTER PROFILE MODAL */}
      {isEditModalOpen && editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Student Master Information
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    USN: {editStudent.usn} • Roll #{String(editStudent.usnSequence).padStart(3, "0")} • {editStudent.department?.code || selectedDept}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Student Badge / Avatar Strip */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                  {getStudentPhoto(editStudent) ? (
                    <img
                      src={getStudentPhoto(editStudent)!}
                      alt={editStudent.user?.firstName || "Student"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-600">
                      {getStudentInitials(editStudent.user?.firstName, editStudent.user?.lastName)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {editStudent.user?.firstName} {editStudent.user?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {editForm.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoModalStudent(editStudent);
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs hover:bg-blue-50 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Manage Photo</span>
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              {/* SECTION 1: PERSONAL & CONTACT */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  <span>Personal & Contact Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Student Email *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md font-mono text-[11px] focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Contact Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+91 9108119999"
                      className="w-full p-2 border border-slate-300 rounded-md font-mono text-[11px] focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={editForm.dob}
                      onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACADEMIC & ENROLLMENT */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-500">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Academic & Program Enrollment</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">USN (Seat Number)</label>
                    <input
                      type="text"
                      required
                      value={editForm.usn}
                      onChange={(e) => setEditForm({ ...editForm, usn: e.target.value.toUpperCase() })}
                      className="w-full p-2 border border-slate-300 rounded-md font-mono uppercase font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Department / Branch
                      {editStudent && editForm.departmentId && editForm.departmentId !== (editStudent.departmentId || editStudent.department?.id) && (
                        <span className="text-amber-700 font-bold ml-1.5 text-[10px] bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          Reallocation Active
                        </span>
                      )}
                    </label>
                    <select
                      value={editForm.departmentId}
                      onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md font-medium"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Current Semester</label>
                    <select
                      value={editForm.semester}
                      onChange={(e) => setEditForm({ ...editForm, semester: parseInt(e.target.value) || 1 })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section</label>
                    <select
                      value={editForm.section}
                      onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono font-bold"
                    >
                      {["A", "B", "C", "D"].map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Admission Quota</label>
                    <select
                      value={editForm.quota}
                      onChange={(e) => setEditForm({ ...editForm, quota: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md font-bold"
                    >
                      <option value="KCET">KCET</option>
                      <option value="COMEDK">COMEDK</option>
                      <option value="MANAGEMENT">MANAGEMENT</option>
                      <option value="GOV">GOV</option>
                      <option value="NRI">NRI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={editForm.isActive ? "active" : "inactive"}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "active" })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md font-semibold"
                    >
                      <option value="active">Active (Enrolled)</option>
                      <option value="inactive">Inactive (Suspended)</option>
                    </select>
                  </div>

                  {/* INTEGRATED BRANCH REALLOCATION PANEL */}
                  {editStudent && editForm.departmentId && editForm.departmentId !== (editStudent.departmentId || editStudent.department?.id) && (
                    <div className="col-span-1 sm:col-span-3 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                          <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>
                            Branch Reallocation: {editStudent.department?.code || selectedDept} → {departments.find((d) => d.id === editForm.departmentId)?.code}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                          Auto USN Generation
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Reallocating department will atomically assign the next sequential USN in the target department (or use custom USN if modified above), update departmental affiliations, and adjust fee schedules.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block font-bold text-slate-800 text-[11px] mb-1">
                            Approval Rationale / Authority Reference *
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.reallocReason}
                            onChange={(e) => setEditForm({ ...editForm, reallocReason: e.target.value })}
                            placeholder="e.g. Branch upgrade merit request approved by Admissions"
                            className="w-full p-2 bg-white border border-amber-300 rounded-md text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 text-[11px] mb-1">
                            Differential Tuition Fee / Adjustment (₹)
                          </label>
                          <input
                            type="number"
                            value={editForm.feeAdjustment}
                            onChange={(e) => setEditForm({ ...editForm, feeAdjustment: e.target.value })}
                            placeholder="0"
                            className="w-full p-2 bg-white border border-amber-300 rounded-md text-xs font-mono focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: STRICT GUARDRAILS (ATTENDANCE & MARKS PROTECTED) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Protected Academic Records (Read-Only)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="font-semibold block text-slate-800">Attendance Records</span>
                    <span className="text-[10px] text-slate-500">Governed exclusively by Faculty Roll-Call & VTU Lockout protocols. Admissions cannot modify attendance.</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="font-semibold block text-slate-800">CIE & Semester Marks</span>
                    <span className="text-[10px] text-slate-500">Managed exclusively by subject instructors and the Controller of Examinations. Admissions cannot modify marks.</span>
                  </div>
                </div>
              </div>

              {/* Password notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Key className="w-3.5 h-3.5 shrink-0" />
                  <span>Auto Password Recalculation Notice</span>
                </div>
                <p className="leading-relaxed">
                  Modifying Date of Birth or First Name recalculates the default formula password (<code className="font-mono font-bold">[NAME_3_UPPER][DDMMYY]</code>) and immediately synchronizes login credentials.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmStudent(editStudent)}
                  className="px-3 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Student Record</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStudent}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs"
                  >
                    {updatingStudent ? "Saving Changes..." : "Save & Update Information"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STUDENT CONFIRMATION MODAL */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-rose-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span>Delete Student Record</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-rose-950 space-y-2 text-xs">
              <p className="font-semibold text-rose-900">
                Are you sure you want to permanently delete this student record?
              </p>
              <div className="font-mono text-[11px] bg-white p-2.5 rounded border border-rose-200 text-slate-800 space-y-1">
                <div><strong>USN:</strong> {deleteConfirmStudent.usn}</div>
                <div><strong>Name:</strong> {deleteConfirmStudent.user?.firstName} {deleteConfirmStudent.user?.lastName}</div>
                <div><strong>Dept:</strong> {deleteConfirmStudent.department?.code || selectedDept} • Sem {deleteConfirmStudent.currentSemester || 3} Sec {deleteConfirmStudent.section || "A"}</div>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                ⚠️ This action is irreversible. It will permanently remove their admission entry, login account, invoice ledger, and associated records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingStudent}
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingStudent}
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingStudent ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PHOTO VIEW & UPLOAD MODAL */}
      {photoModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Student Identity Card Photo</span>
              <button
                type="button"
                onClick={() => setPhotoModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center">
                {getStudentPhoto(photoModalStudent) ? (
                  <img
                    src={getStudentPhoto(photoModalStudent)!}
                    alt={photoModalStudent.user?.firstName || "Student"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-mono font-bold text-2xl text-slate-500">
                    {getStudentInitials(photoModalStudent.user?.firstName, photoModalStudent.user?.lastName)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">Change Photo</span>
                </button>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {photoModalStudent.user?.firstName} {photoModalStudent.user?.lastName}
                </h3>
                <p className="font-mono text-xs text-blue-700 font-semibold mt-0.5">
                  {photoModalStudent.usn} • Roll #{String(photoModalStudent.usnSequence).padStart(3, "0")}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Dept: {selectedDept} • Quota: {photoModalStudent.quota} • DOB: {formatRosterDate(photoModalStudent.dateOfBirth)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl transition-colors shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>{uploadingPhoto ? "Processing Photo..." : "Upload / Replace Photo"}</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoModalStudent(null)}
                className="w-full text-slate-500 hover:text-slate-800 text-xs py-1.5 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />
    </div>
  );
}
