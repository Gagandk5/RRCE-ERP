"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

export default function HodPage() {
  const [activeTab, setActiveTab] = useState<"timetable" | "leaves" | "moderation">("timetable");

  // Timetable State & 3-Layer Clash Simulation
  const [timetableSlots, setTimetableSlots] = useState<any[]>([
    {
      id: "slot-1",
      day: "Monday",
      dayOfWeek: 1,
      time: "09:00 - 10:00",
      startTime: 540,
      endTime: 600,
      courseCode: "25BC101",
      courseName: "Discrete Mathematics",
      faculty: "Prof. Ananya Sharma",
      facultyId: "fac-math",
      room: "LH-204",
      section: "A",
    },
    {
      id: "slot-2",
      day: "Monday",
      dayOfWeek: 1,
      time: "10:00 - 11:00",
      startTime: 600,
      endTime: 660,
      courseCode: "25BC102",
      courseName: "Data Structures",
      faculty: "Prof. Chethan Kumar",
      facultyId: "fac-bca",
      room: "LH-204",
      section: "A",
    },
    {
      id: "slot-3",
      day: "Tuesday",
      dayOfWeek: 2,
      time: "09:00 - 10:00",
      startTime: 540,
      endTime: 600,
      courseCode: "25BC101",
      courseName: "Discrete Mathematics",
      faculty: "Prof. Ananya Sharma",
      facultyId: "fac-math",
      room: "LH-204",
      section: "A",
    },
  ]);

  // Clash Checker Inputs
  const [testFacultyId, setTestFacultyId] = useState("fac-math");
  const [testRoom, setTestRoom] = useState("LH-204");
  const [testSection, setTestSection] = useState("A");
  const [testDay, setTestDay] = useState(1); // Monday
  const [testStartTime, setTestStartTime] = useState(570); // 09:30 (Clash!)
  const [testEndTime, setTestEndTime] = useState(630); // 10:30
  const [clashResult, setClashResult] = useState<any>(null);

  // Leave Management State
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([
    {
      id: "leave-fac-01",
      applicantType: "FACULTY",
      name: "Prof. Ananya Sharma",
      email: "faculty.math@rrce.org",
      dept: "Basic Science (Teaching in BCA)",
      leaveType: "CASUAL",
      dates: "29-Sep-2026 to 30-Sep-2026",
      reason: "Presenting research paper at IISc Bangalore symposium",
      affectedSlot: "Monday 09:00 - 10:00 (Discrete Mathematics, Room LH-204)",
      isApproved: false,
    },
    {
      id: "leave-stu-02",
      applicantType: "STUDENT",
      name: "Gagan R (1RR25BC007)",
      email: "1RR25BC007@rrce.org",
      dept: "BCA Semester 1",
      leaveType: "ON_DUTY_EVENT",
      dates: "Today",
      reason: "Selected for Inter-College Hackathon at BMSCE",
      affectedSlot: "Today's scheduled classes",
      isApproved: false,
    },
  ]);

  const [substituteFaculty, setSubstituteFaculty] = useState("fac-bca");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Moderation State
  const [examModeration, setExamModeration] = useState({
    id: "exam-cie1-math",
    course: "25BC101 - Discrete Mathematical Structures",
    examType: "CIE_1 (Internal Assessment)",
    status: "SUBMITTED_TO_HOD",
    maxMarks: 50,
    submissionsCount: 9,
    avgScore: 41.2,
    verified: false,
  });

  useEffect(() => {
    fetchHodData();
  }, []);

  const fetchHodData = async () => {
    const res = await apiRequest("/hod/leaves/pending");
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      setPendingLeaves(
        res.data.map((l: any) => ({
          id: l.id,
          applicantType: l.applicant.studentProfile ? "STUDENT" : "FACULTY",
          name: `${l.applicant.firstName} ${l.applicant.lastName}`,
          email: l.applicant.email,
          dept: l.applicant.departmentId || "Department of BCA",
          leaveType: l.leaveType,
          dates: `${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}`,
          reason: l.reason,
          affectedSlot: "Scheduled lecture slots during leave dates",
          isApproved: l.status === "APPROVED",
        }))
      );
    }
  };

  const runClashDetection = async () => {
    const res = await apiRequest("/timetable/slot", {
      method: "POST",
      body: JSON.stringify({
        courseOfferingId: "off-bca-math",
        dayOfWeek: testDay,
        startTimeMinutes: testStartTime,
        endTimeMinutes: testEndTime,
        roomNumber: testRoom,
      }),
    });

    if (res.status === 409 || res.error) {
      const detail = res.clashDetail || {};
      setClashResult({
        hasClash: true,
        layer: detail.layer || 1,
        type: detail.type || "TIMETABLE_CLASH",
        message: detail.message || res.error || "HTTP 409 Conflict: Timetable Clash Detected across Faculty/Room/Section.",
      });
      return;
    }

    for (const slot of timetableSlots) {
      if (slot.dayOfWeek !== testDay) continue;

      const overlap = testStartTime < slot.endTime && testEndTime > slot.startTime;
      if (!overlap) continue;

      if (slot.facultyId === testFacultyId) {
        setClashResult({
          hasClash: true,
          layer: 1,
          type: "FACULTY_CLASH",
          message: `Layer 1 (Faculty Collision): Prof. Ananya Sharma is already booked for ${slot.courseName} (${slot.time}) in Room ${slot.room}. A teacher cannot be at two places simultaneously.`,
        });
        return;
      }

      if (slot.room.toUpperCase() === testRoom.toUpperCase()) {
        setClashResult({
          hasClash: true,
          layer: 2,
          type: "ROOM_CLASH",
          message: `Layer 2 (Room Collision): Physical room ${testRoom} is already booked for ${slot.courseName} from ${slot.time}.`,
        });
        return;
      }

      if (slot.section === testSection) {
        setClashResult({
          hasClash: true,
          layer: 3,
          type: "SECTION_CLASH",
          message: `Layer 3 (Section Collision): BCA Section ${testSection} already has lecture (${slot.courseName}) from ${slot.time}.`,
        });
        return;
      }
    }

    setClashResult({
      hasClash: false,
      message: "✓ All 3 Layers Clear: No collisions detected across Faculty, Room, or Section.",
    });
  };

  const handleApproveFacultyLeave = async (leaveId: string) => {
    await apiRequest(`/hod/leaves/${leaveId}/approve-faculty`, {
      method: "POST",
      body: JSON.stringify({
        substitutions: [
          {
            timetableSlotId: "slot-1",
            substituteFacultyId: substituteFaculty,
            date: new Date().toISOString().split("T")[0],
          },
        ],
      }),
    });

    setPendingLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, isApproved: true } : l))
    );
    setActionNotice(
      "Faculty leave approved! Mandatory substitution mapped to Prof. Chethan Kumar. Time slot reassigned in master schedule."
    );
  };

  const handleApproveStudentLeave = async (leaveId: string) => {
    await apiRequest(`/hod/leaves/${leaveId}/approve-student`, {
      method: "POST",
    });

    setPendingLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, isApproved: true } : l))
    );
    setActionNotice(
      "Student on-duty leave approved! Affected lecture periods automatically marked as EXCUSED."
    );
  };

  const handleVerifyMarks = async () => {
    await apiRequest("/hod/exams/exam-cie1-math/verify", {
      method: "POST",
    });

    setExamModeration((prev) => ({
      ...prev,
      status: "VERIFIED_BY_HOD",
      verified: true,
    }));
    setActionNotice(
      "CIE marks verified by HOD! Status forwarded to Principal for final publication and locking."
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">HOD Workspace (Department of BCA)</h1>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              Departmental Scope
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Timetable control with 3-layer clash detection, leave approvals with mandatory substitution, and CIE marks moderation.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "timetable"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            3-Layer Timetable Grid
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "leaves"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Leave &amp; Substitution Inbox
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "moderation"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            CIE Mark Moderation
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs text-emerald-700 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: 3-Layer Clash Detection & Timetable Grid */}
      {activeTab === "timetable" && (
        <div className="space-y-6">
          {/* Clash Detection Simulator */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  3-Layer Timetable Clash Detection Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluates lecture schedules against Layer 1 (Faculty), Layer 2 (Physical Room), and Layer 3 (Student Section).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Faculty</label>
                <select
                  value={testFacultyId}
                  onChange={(e) => setTestFacultyId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="fac-math">Prof. Ananya Sharma (Math)</option>
                  <option value="fac-bca">Prof. Chethan Kumar (BCA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                <input
                  type="text"
                  value={testRoom}
                  onChange={(e) => setTestRoom(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={testStartTime}
                  onChange={(e) => {
                    const st = parseInt(e.target.value, 10);
                    setTestStartTime(st);
                    setTestEndTime(st + 60);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value={540}>09:00 - 10:00 (Slot 1 Overlap)</option>
                  <option value={570}>09:30 - 10:30 (Mid-Period Clash)</option>
                  <option value={600}>10:00 - 11:00 (Slot 2 Overlap)</option>
                  <option value={660}>11:00 - 12:00 (Clear / Free Slot)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={runClashDetection}
                  className="w-full py-2 px-3 rounded-md font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                >
                  Run 3-Layer Clash Check
                </button>
              </div>
            </div>

            {clashResult && (
              <div
                className={`p-3.5 rounded-md border text-xs font-medium leading-relaxed ${
                  clashResult.hasClash
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {clashResult.hasClash ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    {clashResult.hasClash && (
                      <span className="font-bold text-rose-900 uppercase tracking-wider block mb-0.5">
                        HTTP 409 Conflict Alert ({clashResult.type})
                      </span>
                    )}
                    <span>{clashResult.message}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Master Schedule Table */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active BCA Section A Timetable</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Day</th>
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-4 py-2.5">Course Code &amp; Title</th>
                    <th className="px-4 py-2.5">Assigned Faculty</th>
                    <th className="px-4 py-2.5">Room</th>
                    <th className="px-4 py-2.5">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timetableSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{slot.day}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-700">{slot.time}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-slate-500 mr-2">{slot.courseCode}</span>
                        <span className="font-medium text-slate-800">{slot.courseName}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{slot.faculty}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{slot.room}</td>
                      <td className="px-4 py-2.5 text-slate-500">Sec {slot.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Leave & Substitution Inbox */}
      {activeTab === "leaves" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Leave Approvals &amp; Mandatory Substitutions
            </h3>
            <p className="text-xs text-slate-500">
              Faculty leave requires assigning a substitute teacher. Student leave marks periods as EXCUSED.
            </p>
          </div>

          <div className="space-y-3">
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{leave.name}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        leave.applicantType === "FACULTY"
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {leave.applicantType}
                    </span>
                    <span className="text-xs text-amber-700 font-mono font-semibold">
                      {leave.leaveType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Reason: </span>
                    {leave.reason}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Affected Period: </span>
                    <span className="font-mono text-slate-800">{leave.affectedSlot}</span>
                  </p>
                </div>

                {leave.applicantType === "FACULTY" && !leave.isApproved && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">
                        Substitute Faculty:
                      </label>
                      <select
                        value={substituteFaculty}
                        onChange={(e) => setSubstituteFaculty(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900"
                      >
                        <option value="fac-bca">Prof. Chethan Kumar (BCA)</option>
                        <option value="fac-cse">Prof. Divya Narayanan (CSE)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleApproveFacultyLeave(leave.id)}
                      className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm"
                    >
                      Assign Substitute &amp; Approve
                    </button>
                  </div>
                )}

                {leave.applicantType === "STUDENT" && !leave.isApproved && (
                  <button
                    onClick={() => handleApproveStudentLeave(leave.id)}
                    className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm"
                  >
                    Approve &amp; Mark EXCUSED
                  </button>
                )}

                {leave.isApproved && (
                  <div className="flex items-center space-x-1 text-emerald-700 text-xs font-medium bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>APPROVED</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: CIE Mark Moderation */}
      {activeTab === "moderation" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Internal CIE Mark Moderation</h3>
              <p className="text-xs text-slate-500">
                Review internal assessment submissions forwarded by faculty before elevating to Principal for locking.
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border ${
                examModeration.verified
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              Status: {examModeration.status}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900">{examModeration.course}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {examModeration.examType} • Max Marks: {examModeration.maxMarks} • Cohort Submissions: {examModeration.submissionsCount} • Average Score: {examModeration.avgScore}/50
              </div>
            </div>

            {!examModeration.verified ? (
              <button
                onClick={handleVerifyMarks}
                className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm flex items-center space-x-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Verify &amp; Forward to Principal</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>VERIFIED BY HOD (Pending Principal Release)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
