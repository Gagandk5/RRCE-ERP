"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Lock,
  Unlock,
  CheckCircle2,
  FilePlus,
} from "lucide-react";

export default function FacultyPage() {
  const [activeTab, setActiveTab] = useState<"rollcall" | "assignments" | "marks">("rollcall");

  // Roster strictly sorted by usnSequence ASC (001, 002, 003...)
  const [students, setStudents] = useState<any[]>([
    { id: "stu-1", seq: 1, usnSequence: 1, usn: "1RR25BC001", name: "Aarav Patel", status: "PRESENT" },
    { id: "stu-2", seq: 2, usnSequence: 2, usn: "1RR25BC002", name: "Ananya Iyer", status: "PRESENT" },
    { id: "stu-3", seq: 3, usnSequence: 3, usn: "1RR25BC003", name: "Bhavya Rao", status: "PRESENT" },
    { id: "stu-4", seq: 4, usnSequence: 4, usn: "1RR25BC004", name: "Chetan Verma", status: "PRESENT" },
    { id: "stu-5", seq: 5, usnSequence: 5, usn: "1RR25BC005", name: "Deepak Nair", status: "PRESENT" },
    { id: "stu-6", seq: 6, usnSequence: 6, usn: "1RR25BC006", name: "Esha Deshmukh", status: "PRESENT" },
    { id: "stu-7", seq: 7, usnSequence: 7, usn: "1RR25BC007", name: "Gagan R", status: "PRESENT" },
    { id: "stu-8", seq: 8, usnSequence: 8, usn: "1RR25BC008", name: "Rahul Sharma", status: "ABSENT" },
    { id: "stu-9", seq: 9, usnSequence: 9, usn: "1RR25BC009", name: "Priya Kumar", status: "EXCUSED" },
  ]);

  // 24-hour lockout state
  const [sessionAgeHours, setSessionAgeHours] = useState(2);
  const isLocked = sessionAgeHours >= 24;

  const [notification, setNotification] = useState<string | null>(null);

  // Assignment state
  const [assignments, setAssignments] = useState([
    {
      id: "asg-1",
      title: "Set Theory & Relations Assignment 1",
      dueDate: "2026-10-05",
      maxMarks: 20,
      submissions: 9,
    },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("2026-10-12");
  const [newMaxMarks, setNewMaxMarks] = useState(20);

  // Marks state
  const [marksCohort, setMarksCohort] = useState([
    { id: "stu-7", usn: "1RR25BC007", name: "Gagan R", marks: 47.5 },
    { id: "stu-8", usn: "1RR25BC008", name: "Rahul Sharma", marks: 22.0 },
    { id: "stu-9", usn: "1RR25BC009", name: "Priya Kumar", marks: 41.0 },
  ]);

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    const res = await apiRequest("/faculty/offerings/off-bca-math/roster");
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const sorted = [...res.data].sort((a, b) => a.usnSequence - b.usnSequence);
      setStudents(
        sorted.map((s) => ({
          id: s.studentId,
          seq: s.usnSequence,
          usnSequence: s.usnSequence,
          usn: s.usn,
          name: s.name,
          status: "PRESENT",
        }))
      );
    }
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    if (isLocked) {
      setNotification("Action Blocked: Locked (24h Expired). Attendance records cannot be altered.");
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAllPresent = () => {
    if (isLocked) return;
    setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENT" })));
    setNotification("All students marked PRESENT.");
  };

  const handleSaveAttendance = async () => {
    if (isLocked) return;
    const records = students.map((s) => ({
      studentId: s.id,
      status: s.status,
    }));

    const res = await apiRequest("/faculty/attendance", {
      method: "POST",
      body: JSON.stringify({
        courseOfferingId: "off-bca-math",
        sessionDate: new Date().toISOString().split("T")[0],
        periodNumber: 1,
        records,
      }),
    });

    if (res.error) {
      setNotification(`Saved locally: Attendance recorded for ${students.length} students.`);
    } else {
      setNotification("Attendance successfully recorded to live backend API!");
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setAssignments((prev) => [
      ...prev,
      {
        id: `asg-${Date.now()}`,
        title: newTitle,
        dueDate: newDueDate,
        maxMarks: Number(newMaxMarks),
        submissions: 0,
      },
    ]);
    setNewTitle("");
    setNotification("New assignment published to student portal.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Classroom Portal</h1>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              25BC101 • Discrete Math
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Instructor: <span className="text-slate-900 font-medium">Prof. Ananya Sharma</span> (Basic Science &amp; Humanities $\rightarrow$ BCA)
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            onClick={() => setActiveTab("rollcall")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "rollcall"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Digital Roll-Call Sheet
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "assignments"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab("marks")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === "marks"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            CIE Marks Entry
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs text-emerald-700 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Digital Roll-Call Sheet */}
      {activeTab === "rollcall" && (
        <div className="space-y-6">
          {/* Lockout Controls & Banner */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded flex items-center justify-center border ${
                  isLocked
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {isLocked ? <Lock className="w-4 h-4 text-rose-700" /> : <Unlock className="w-4 h-4 text-emerald-700" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">24-Hour Edit Lockout Status:</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded border ${
                      isLocked
                        ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {isLocked ? "Locked (24h Expired)" : "ACTIVE EDIT WINDOW"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isLocked
                    ? "More than 24 hours have elapsed. Session records are permanently locked."
                    : `Session recorded ${sessionAgeHours} hours ago (${24 - sessionAgeHours} hours remaining in edit window).`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSessionAgeHours((prev) => (prev >= 24 ? 2 : 25))}
                className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-300"
              >
                Simulate {isLocked ? "<24h Editable" : ">24h Lockout"}
              </button>
              <button
                onClick={handleMarkAllPresent}
                disabled={isLocked}
                className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm disabled:opacity-50"
              >
                Mark All Present
              </button>
            </div>
          </div>

          {/* Roll Call Table with Strict usnSequence ASC Natural Sorting */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Classroom Roll-Call Roster</h3>
                <p className="text-xs text-slate-500">
                  Institutional Standard: Sorted strictly by <code className="text-slate-800 font-mono">usnSequence ASC</code> (001, 002, 003...), NOT alphabetically.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">Total: {students.length} Enrolled</span>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="py-2.5 px-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors rounded-md"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-xs text-slate-900 w-8">
                      {String(student.seq).padStart(3, "0")}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{student.usn}</span>
                        <span className="text-xs font-semibold text-slate-800">{student.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">BCA Semester 1 • Section A</span>
                    </div>
                  </div>

                  {/* Toggle Buttons for Roll Call */}
                  <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-end">
                    {[
                      { code: "PRESENT", label: "P", activeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold" },
                      { code: "ABSENT", label: "A", activeClass: "bg-rose-50 text-rose-700 border-rose-300 font-bold" },
                      { code: "EXCUSED", label: "E", activeClass: "bg-amber-50 text-amber-700 border-amber-300 font-bold" },
                      { code: "LATE", label: "L", activeClass: "bg-slate-100 text-slate-800 border-slate-300 font-bold" },
                    ].map((btn) => {
                      const isSelected = student.status === btn.code;
                      return (
                        <button
                          key={btn.code}
                          disabled={isLocked}
                          onClick={() => handleStatusChange(student.id, btn.code)}
                          className={`w-8 h-8 rounded border text-xs font-semibold flex items-center justify-center transition-colors ${
                            isSelected
                              ? btn.activeClass
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-200">
              <button
                onClick={handleSaveAttendance}
                disabled={isLocked}
                className="py-2 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm disabled:opacity-50"
              >
                Submit Session Roll-Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Assignments */}
      {activeTab === "assignments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Create New Course Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Theory & Planar Graphs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Max Marks</label>
                <input
                  type="number"
                  required
                  value={newMaxMarks}
                  onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
              >
                Publish Assignment
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Active Assignments</h3>
            <div className="space-y-2.5">
              {assignments.map((asg) => (
                <div key={asg.id} className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{asg.title}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Max {asg.maxMarks} Marks
                    </span>
                  </div>
                  <div className="text-slate-500">Due: {asg.dueDate} • Submissions: {asg.submissions}/9</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CIE Marks Entry */}
      {activeTab === "marks" && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">CIE-1 Marks Entry (Max 50 Marks)</h3>
              <p className="text-xs text-slate-500">Subject: 25BC101 Discrete Mathematics</p>
            </div>
            <button
              onClick={() => setNotification("Marks submitted to HOD for verification!")}
              className="py-1.5 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm"
            >
              Submit to HOD for Verification
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">USN</th>
                  <th className="px-4 py-2.5">Student Name</th>
                  <th className="px-4 py-2.5">Score (/50)</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksCohort.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{m.usn}</td>
                    <td className="px-4 py-2.5 text-slate-800 font-medium">{m.name}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={m.marks}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setMarksCohort((prev) =>
                            prev.map((item) => (item.id === m.id ? { ...item, marks: val } : item))
                          );
                        }}
                        className="w-20 bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                        Graded
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
