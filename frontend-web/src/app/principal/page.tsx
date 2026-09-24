"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  ShieldAlert,
  Percent,
  IndianRupee,
  AlertTriangle,
  UserX,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function PrincipalPage() {
  const [stats, setStats] = useState<any>({
    totalStudents: 9,
    totalFaculties: 4,
    totalDepts: 7,
    campusAttendanceAvg: 88.5,
    finances: {
      totalBilled: 195000,
      totalCollected: 135000,
      pendingAmount: 60000,
      collectionPercentage: 69,
    },
    syllabusLagAlerts: [
      {
        offeringId: "off-1",
        courseCode: "25CS101",
        courseName: "Engineering Mathematics I",
        facultyName: "Prof. Ananya Sharma",
        department: "CSE",
        conductedSessions: 2,
        status: "LAGGING",
      },
    ],
  });

  const [offerings, setOfferings] = useState<any[]>([
    {
      id: "off-bca-math",
      course: { code: "25BC101", name: "Discrete Mathematical Structures" },
      faculty: { id: "fac-math", user: { firstName: "Ananya", lastName: "Sharma" } },
      academicSemester: { department: { code: "BCA" }, semesterNumber: 1 },
      section: "A",
    },
    {
      id: "off-bca-ds",
      course: { code: "25BC102", name: "Data Structures and Algorithms" },
      faculty: { id: "fac-bca", user: { firstName: "Chethan", lastName: "Kumar" } },
      academicSemester: { department: { code: "BCA" }, semesterNumber: 1 },
      section: "A",
    },
  ]);

  const [faculties, setFaculties] = useState<any[]>([
    { id: "fac-math", employeeCode: "RRCE-FAC-014", user: { firstName: "Ananya", lastName: "Sharma" }, homeDepartment: { code: "BS" } },
    { id: "fac-bca", employeeCode: "RRCE-FAC-022", user: { firstName: "Chethan", lastName: "Kumar" }, homeDepartment: { code: "BCA" } },
    { id: "fac-cse", employeeCode: "RRCE-FAC-035", user: { firstName: "Divya", lastName: "Narayanan" }, homeDepartment: { code: "CSE" } },
  ]);

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  const [newFacultyId, setNewFacultyId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const [showSoftDeleteModal, setShowSoftDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState({ id: "stu-rahul-008", usn: "1RR25BC008", name: "Rahul Sharma" });
  const [deleteReason, setDeleteReason] = useState("");

  const [condonationState, setCondonationState] = useState({
    studentId: "stu-rahul-008",
    usn: "1RR25BC008",
    name: "Rahul Sharma",
    currentPercentage: 0.0,
    reason: "Represented RRCE in State Inter-Collegiate Athletics Championship",
    isDone: false,
  });

  const [examPublished, setExamPublished] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const res = await apiRequest("/principal/stats");
    if (res.data) setStats(res.data);

    const offs = await apiRequest("/principal/offerings");
    if (offs.data && offs.data.length > 0) setOfferings(offs.data);

    const facs = await apiRequest("/principal/faculties");
    if (facs.data && facs.data.length > 0) setFaculties(facs.data);
  };

  const handleReassign = async () => {
    if (!selectedOffering || !newFacultyId) return;
    await apiRequest("/principal/reassign-offering", {
      method: "POST",
      body: JSON.stringify({
        courseOfferingId: selectedOffering.id,
        newFacultyId,
        reason: reassignReason || "Mid-semester reassignment authorized by Principal",
      }),
    });

    const chosenFac = faculties.find((f) => f.id === newFacultyId);
    setActionMessage(
      `Course ${selectedOffering.course.name} successfully reassigned to ${chosenFac?.user?.firstName || 'new faculty'}`
    );
    setShowReassignModal(false);
    fetchStats();
  };

  const handleSoftDelete = async () => {
    if (!deleteReason) return;
    await apiRequest(`/principal/students/${studentToDelete.id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason: deleteReason }),
    });

    setActionMessage(
      `Student ${studentToDelete.usn} (${studentToDelete.name}) soft-deleted. isActive=false recorded with audit trail.`
    );
    setShowSoftDeleteModal(false);
    setDeleteReason("");
  };

  const handleCondone = async () => {
    await apiRequest("/principal/condone-attendance", {
      method: "POST",
      body: JSON.stringify({
        studentId: condonationState.studentId,
        reason: condonationState.reason,
        minimumCondonedThreshold: 75.0,
      }),
    });

    setCondonationState((prev) => ({ ...prev, isDone: true }));
    setActionMessage(
      `Attendance shortage condoned for ${condonationState.usn}. Exam hall-ticket clearance granted.`
    );
  };

  const handlePublishExam = async () => {
    setExamPublished(true);
    await apiRequest("/principal/exams/cie-1-math/publish", {
      method: "POST",
    });
    setActionMessage("CIE-1 Discrete Mathematics results officially locked and published.");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Principal Executive Console</h1>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              Campus Authority
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Universal institutional oversight: soft-deletes, course reassignments, 75% attendance condonation, and exam publication.
          </p>
        </div>

        <button
          onClick={() => setShowSoftDeleteModal(true)}
          className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <UserX className="w-4 h-4 text-rose-600" />
          <span>Soft-Delete Student</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs text-emerald-700 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Campus Attendance</span>
            <Percent className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 mt-2">
            {stats.campusAttendanceAvg}%
          </div>
          <div className="text-xs text-slate-500 mt-1">VTU Statutory Threshold: 75.0%</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fee Collections</span>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 mt-2">
            ₹{stats.finances?.totalCollected?.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pending: ₹{stats.finances?.pendingAmount?.toLocaleString()} ({stats.finances?.collectionPercentage}% collected)
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Enrollment</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-slate-900 mt-2">
            {stats.totalStudents} Students
          </div>
          <div className="text-xs text-slate-500 mt-1">Across 7 Autonomous Departments</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Syllabus Lag Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-amber-700 mt-2">
            {stats.syllabusLagAlerts?.length || 0} Alert
          </div>
          <div className="text-xs text-slate-500 mt-1">&lt;5 sessions conducted to date</div>
        </div>
      </div>

      {/* Main Grid: Mid-Term Reassignment & Attendance Condonation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Universal Course Offering Reassignment */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Mid-Semester Course Reassignment</h2>
              <p className="text-xs text-slate-500">Reassign instructors across course offerings</p>
            </div>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {offerings.map((offering) => (
              <div key={offering.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">{offering.course.code}</span>
                    <span className="text-xs font-semibold text-slate-800">{offering.course.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dept: {offering.academicSemester.department.code} (Sec {offering.section}) • Current Faculty:{" "}
                    <span className="text-slate-700 font-medium">
                      {offering.faculty.user.firstName} {offering.faculty.user.lastName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOffering(offering);
                    setShowReassignModal(true);
                  }}
                  className="px-3 py-1 rounded bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-300 transition-colors"
                >
                  Reassign
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 75% Attendance Condonation Panel */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">VTU Attendance Condonation Panel</h2>
              <p className="text-xs text-slate-500">Executive override for shortages below 75% threshold</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-900">{condonationState.usn}</span>
                <h4 className="text-xs font-bold text-slate-900">{condonationState.name}</h4>
                <p className="text-[11px] text-slate-500">Current Recorded Attendance: <span className="text-rose-700 font-bold">{condonationState.currentPercentage}%</span></p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium border ${condonationState.isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                {condonationState.isDone ? 'Condoned & Eligible' : 'Shortage Alert'}
              </span>
            </div>

            <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
              <span className="font-semibold text-slate-900">Justification: </span>
              {condonationState.reason}
            </div>

            {!condonationState.isDone ? (
              <button
                onClick={handleCondone}
                className="w-full py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm transition-colors"
              >
                Authorize Condonation &amp; Grant Exam Hall-Ticket
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-emerald-700 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Executive condonation order recorded in AuditLog.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Exam Result Publication Banner */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Official Exam Result Publication &amp; Lock</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize official release of verified CIE/SEE marks and lock moderation entries.
          </p>
        </div>

        <button
          onClick={handlePublishExam}
          disabled={examPublished}
          className={`px-4 py-2 rounded-md font-medium text-xs flex items-center space-x-2 transition-colors ${
            examPublished
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
              : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
          }`}
        >
          {examPublished ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Results Published &amp; Locked</span>
            </>
          ) : (
            <>
              <span>Authorize &amp; Publish Results</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reassign Course Instructor</h3>
            <p className="text-xs text-slate-500">
              Reassigning <span className="text-slate-900 font-semibold">{selectedOffering?.course?.name}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select New Faculty</label>
              <select
                value={newFacultyId}
                onChange={(e) => setNewFacultyId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              >
                <option value="">-- Choose Faculty Member --</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.user.firstName} {f.user.lastName} ({f.employeeCode} - {f.homeDepartment?.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Reason for Transfer</label>
              <textarea
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Workload re-balancing or faculty leave..."
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 h-20 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowReassignModal(false)}
                className="flex-1 py-2 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={!newFacultyId}
                className="flex-1 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft-Delete Modal */}
      {showSoftDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-700">
              <UserX className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Student Soft-Delete Audit</h3>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-800 leading-relaxed">
              <span className="font-semibold text-rose-900">Soft-Delete Invariant: </span>
              Hard cascading deletes are strictly forbidden. Deactivating sets <code className="font-mono">isActive = false</code>, records <code className="font-mono">deletedAt = NOW()</code>, and logs reason.
            </div>

            <div>
              <span className="text-xs text-slate-500">Target Student:</span>
              <div className="text-xs font-bold text-slate-900">{studentToDelete.name} ({studentToDelete.usn})</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Deletion / Dismissal Reason</label>
              <textarea
                required
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter justification for institutional audit log (e.g. Student transfer, disciplinary dismissal)..."
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 h-24 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowSoftDeleteModal(false)}
                className="flex-1 py-2 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSoftDelete}
                disabled={!deleteReason.trim()}
                className="flex-1 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium disabled:opacity-50"
              >
                Execute Soft-Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
