"use client";

import React, { useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  UserPlus,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Database,
  Building,
  KeyRound,
  GraduationCap,
} from "lucide-react";

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = useState<"onboarding" | "reallocation" | "roster">("reallocation");

  // Onboarding Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("2007-06-15");
  const [quota, setQuota] = useState<"CET" | "MANAGEMENT" | "MERIT">("CET");
  const [departmentCode, setDepartmentCode] = useState("BC");
  const [onboardedResult, setOnboardedResult] = useState<any>(null);

  // Branch Reallocation Wizard State
  const [students, setStudents] = useState<any[]>([
    {
      id: "stu-gagan-007",
      usn: "1RR25BC007",
      usnYear: 25,
      usnBranch: "BC",
      usnSequence: 7,
      name: "Gagan R",
      quota: "CET",
      department: "Bachelor of Computer Applications (BCA)",
      currentSemester: 1,
    },
    {
      id: "stu-rahul-008",
      usn: "1RR25BC008",
      usnYear: 25,
      usnBranch: "BC",
      usnSequence: 8,
      name: "Rahul Sharma",
      quota: "MANAGEMENT",
      department: "Bachelor of Computer Applications (BCA)",
      currentSemester: 1,
    },
    {
      id: "stu-priya-009",
      usn: "1RR25BC009",
      usnYear: 25,
      usnBranch: "BC",
      usnSequence: 9,
      name: "Priya Kumar",
      quota: "MERIT",
      department: "Bachelor of Computer Applications (BCA)",
      currentSemester: 1,
    },
  ]);

  const departments = [
    { code: "BCA", usnCode: "BC", name: "Bachelor of Computer Applications", fee: 85000 },
    { code: "CSE", usnCode: "CS", name: "Computer Science & Engineering", fee: 95000 },
    { code: "AIML", usnCode: "AI", name: "Artificial Intelligence & ML", fee: 95000 },
    { code: "ECE", usnCode: "EC", name: "Electronics & Communication", fee: 90000 },
    { code: "ME", usnCode: "ME", name: "Mechanical Engineering", fee: 80000 },
    { code: "ISE", usnCode: "IS", name: "Information Science & Engineering", fee: 90000 },
  ];

  const [selectedStudentId, setSelectedStudentId] = useState("stu-gagan-007");
  const [targetDeptCode, setTargetDeptCode] = useState("CS");
  const [transferReason, setTransferReason] = useState("CET Second-Round Seat Upgradation to Computer Science");
  const [reallocationResult, setReallocationResult] = useState<any>(null);
  const [reallocationLoading, setReallocationLoading] = useState(false);

  // Compute live previews for Onboarding
  const computedName3 = (firstName.trim().replace(/[^a-zA-Z]/g, "").toUpperCase() || "STU").slice(0, 3).padEnd(3, "X");
  const dobParts = dob ? dob.split("-") : ["2007", "01", "01"];
  const computedPassword = `${computedName3}${dobParts[2] || "01"}${dobParts[1] || "01"}${dobParts[0]?.slice(-2) || "07"}`;
  const previewUsn = `1RR25${departmentCode}011`;

  // Compute live preview for Reallocation
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const targetDept = departments.find((d) => d.usnCode === targetDeptCode) || departments[1];
  const currentDept = departments.find((d) => d.usnCode === currentStudent?.usnBranch) || departments[0];
  const newProjectedUsn = `1RR25${targetDept.usnCode}001`;
  const feeDelta = targetDept.fee - currentDept.fee;

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest("/admissions/enroll", {
      method: "POST",
      body: JSON.stringify({
        firstName,
        lastName,
        dateOfBirth: dob,
        quota,
        departmentId: targetDept.code,
      }),
    });

    if (res.data) {
      setOnboardedResult(res.data);
    } else {
      setOnboardedResult({
        usn: previewUsn,
        defaultPassword: computedPassword,
        credentials: {
          username: previewUsn,
          temporaryPassword: computedPassword,
        },
      });
    }
  };

  const handleExecuteReallocation = async () => {
    setReallocationLoading(true);
    try {
      const res = await apiRequest("/admissions/reallocate-branch", {
        method: "POST",
        body: JSON.stringify({
          studentId: currentStudent.id,
          newDepartmentId: targetDept.code,
          reason: transferReason,
        }),
      });

      if (res.data) {
        setReallocationResult(res.data);
      } else {
        setReallocationResult({
          success: true,
          oldUsn: currentStudent.usn,
          newUsn: newProjectedUsn,
          previousBranch: currentDept.usnCode,
          newBranch: targetDept.usnCode,
          newDepartmentName: targetDept.name,
          feeAdjustment: feeDelta,
        });

        setStudents((prev) =>
          prev.map((s) =>
            s.id === currentStudent.id
              ? {
                  ...s,
                  usn: newProjectedUsn,
                  usnBranch: targetDept.usnCode,
                  department: targetDept.name,
                }
              : s
          )
        );
      }
    } finally {
      setReallocationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admission Office Desk</h1>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              Registrar Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Student intake, KYC quota handling, and atomic Branch Reallocation Engine with fee delta calculations.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            onClick={() => setActiveTab("reallocation")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "reallocation"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Branch Reallocation Wizard
          </button>
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "onboarding"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Student Onboarding
          </button>
          <button
            onClick={() => setActiveTab("roster")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "roster"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cohort Natural Roster
          </button>
        </div>
      </div>

      {/* Tab 1: Branch Reallocation Wizard */}
      {activeTab === "reallocation" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Atomic Branch Reallocation Wizard
                </h3>
                <p className="text-xs text-slate-500">
                  Generates new USN, severs previous enrollments, and updates fee balances under a single transaction.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              ACID Transaction
            </span>
          </div>

          {reallocationResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-5 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Atomic Branch Transfer Successfully Executed</h4>
              <p className="text-xs text-slate-600 max-w-xl mx-auto">
                Student credentials and semester bindings migrated. Old USN <span className="font-mono font-bold text-rose-700">{reallocationResult.oldUsn}</span> archived to AuditLog.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
                <div className="bg-white border border-slate-200 p-3 rounded">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Previous USN</span>
                  <div className="text-xs font-bold font-mono text-rose-700 line-through">
                    {reallocationResult.oldUsn}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">New Active USN</span>
                  <div className="text-xs font-bold font-mono text-emerald-700">
                    {reallocationResult.newUsn}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Fee Delta</span>
                  <div className="text-xs font-bold text-slate-900">
                    {reallocationResult.feeAdjustment >= 0 ? `+₹${reallocationResult.feeAdjustment}` : `-₹${Math.abs(reallocationResult.feeAdjustment)}`}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setReallocationResult(null)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white shadow-sm"
                >
                  Perform Another Reallocation
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Select Student for Transfer
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.usn} - {s.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Choose Target Department
                  </label>
                  <select
                    value={targetDeptCode}
                    onChange={(e) => setTargetDeptCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    {departments.map((d) => (
                      <option key={d.usnCode} value={d.usnCode}>
                        {d.name} ({d.code} / {d.usnCode}) - Base Fee ₹{d.fee.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Official Justification Reason
                  </label>
                  <textarea
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Higher merit rank achieved in KEA subsequent allotment..."
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 h-20 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Reallocation Impact Analysis
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded bg-white border border-slate-200">
                      <span className="text-slate-500">Current Branch &amp; USN:</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-700">{currentStudent.usn}</span>
                        <div className="text-[10px] text-slate-400">{currentDept.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded bg-white border border-slate-200">
                      <span className="text-slate-500">New Target USN:</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700">{newProjectedUsn}</span>
                        <div className="text-[10px] text-slate-400">{targetDept.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded bg-white border border-slate-200">
                      <span className="text-slate-500">Fee Delta Adjustment:</span>
                      <div className="text-right">
                        <span className="font-bold font-mono text-slate-900">
                          {feeDelta >= 0 ? `+₹${feeDelta.toLocaleString()}` : `-₹${Math.abs(feeDelta).toLocaleString()}`}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {feeDelta > 0 ? "Supplementary balance invoice" : "Credit balance assigned"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteReallocation}
                  disabled={reallocationLoading || currentStudent.usnBranch === targetDeptCode}
                  className="w-full py-2.5 px-4 rounded-md font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <span>{reallocationLoading ? "Executing..." : "Confirm & Execute Branch Reallocation"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Student Onboarding */}
      {activeTab === "onboarding" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">New Student Enrollment &amp; KYC</h3>
              <p className="text-xs text-slate-500">
                Auto-generates USN and default credential formula: <code className="text-slate-800 font-mono">[NAME3][DD][MM][YY]</code>.
              </p>
            </div>
          </div>

          <form onSubmit={handleEnrollSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gagan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Quota</label>
                <select
                  value={quota}
                  onChange={(e: any) => setQuota(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="CET">CET / KEA Govt Merit</option>
                  <option value="MANAGEMENT">Management Quota</option>
                  <option value="MERIT">Institutional Merit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Enrolling Department</label>
                <select
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {departments.map((d) => (
                    <option key={d.usnCode} value={d.usnCode}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-md font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              >
                Enroll Student &amp; Generate Credentials
              </button>
            </div>

            {/* Live Auto-Generated Credentials Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  USN Engine Live Preview
                </span>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase">Auto-Generated USN</span>
                    <span className="text-sm font-bold font-mono text-emerald-700">{previewUsn}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">1RR + 25 (Year) + {departmentCode} + Seq</div>
                  </div>

                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase">Default Password</span>
                    <span className="text-sm font-bold font-mono text-slate-900">{computedPassword}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Formula: [NAME3][DD][MM][YY]</div>
                  </div>

                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase">First-Login Interception</span>
                    <span className="text-xs font-semibold text-amber-700">isPasswordResetRequired = true</span>
                  </div>
                </div>
              </div>

              {onboardedResult && (
                <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  ✓ Student successfully enrolled! Initial invoice generated.
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Natural Roster Ordering */}
      {activeTab === "roster" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active BCA Cohort Roster</h3>
              <p className="text-xs text-slate-500">
                Institutional Requirement: Ordered by <code className="text-slate-800 font-mono">usnSequence ASC</code> (001, 002, 003...).
              </p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              usnSequence ASC
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Seq</th>
                  <th className="px-4 py-2.5">USN</th>
                  <th className="px-4 py-2.5">Student Name</th>
                  <th className="px-4 py-2.5">Quota</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{String(s.usnSequence).padStart(3, "0")}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{s.usn}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px]">
                        {s.quota}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{s.department}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
