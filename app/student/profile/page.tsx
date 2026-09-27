"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Mail, Phone, MapPin, Building } from "lucide-react";

export default function StudentProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      let currentUser: any = null;
      if (meRes.ok) {
        const d = await meRes.json();
        currentUser = d.user;
      }

      if (currentUser?.studentProfile) {
        setStudent({
          ...currentUser.studentProfile,
          user: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            phone: currentUser.phone,
            email: currentUser.email,
          },
        });
        setLoading(false);
        return;
      }

      const stRes = await fetch("/api/students?dept=BCA");
      if (stRes.ok) {
        const sData = await stRes.json();
        const roster = sData.students || [];

        const targetUsn = (currentUser?.usn || currentUser?.username || "").toLowerCase().trim();
        const match = roster.find((s: any) => (s.usn || "").toLowerCase().trim() === targetUsn) || roster[0];
        setStudent(match);
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  }

  function formatDateOfBirth(rawDob: any): string {
    if (!rawDob) return "14 Dec 2007";
    try {
      const date = typeof rawDob === "string" ? new Date(rawDob) : rawDob;
      if (isNaN(date.getTime())) return "14 Dec 2007";
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "14 Dec 2007";
    }
  }

  return (
    <div className="space-y-6 text-xs text-zinc-900 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-zinc-900 tracking-tight">
            Proctor & VTU Registration Dossier
          </h1>
          <p className="text-xs text-zinc-500 font-mono">
            Rajarajeswari College of Engineering • Academic Registry
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded">
          Status: Regular Enrolled
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PERSONAL & ACADEMIC DOSSIER */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs space-y-0">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 text-xs">
              Student Registration Details
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              VTU Autonomous 2025 Scheme
            </span>
          </div>

          <div className="p-4 space-y-3 font-mono">
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-sans">Full Name:</span>
              <strong className="text-zinc-900 font-sans">{student?.user?.firstName || "Gagan"} {student?.user?.lastName || "D K"}</strong>
            </div>

            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-sans">University Seat Number (USN):</span>
              <strong className="text-zinc-900 font-bold">{student?.usn || "1RR25BC007"}</strong>
            </div>

            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-sans">Date of Birth:</span>
              <strong className="text-zinc-900 font-medium">{formatDateOfBirth(student?.dateOfBirth)}</strong>
            </div>

            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-sans">Admission Quota:</span>
              <strong className="text-zinc-900 font-sans font-medium">{student?.quota || "KCET"}</strong>
            </div>

            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-sans">Roll Sequence Number:</span>
              <strong className="text-zinc-900 font-bold">#{String(student?.usnSequence || 7).padStart(3, "0")}</strong>
            </div>

            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-sans">Blood Group:</span>
              <strong className="text-zinc-900 font-medium font-sans">O+ Positive</strong>
            </div>

            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-sans">Mobile Contact:</span>
              <strong className="text-zinc-900 font-medium">{student?.user?.phone || "+91 8971115212"}</strong>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500 font-sans">Registered Email:</span>
              <strong className="text-zinc-900 font-medium font-sans">{student?.user?.email || "1rr25bc007@rrce.org"}</strong>
            </div>
          </div>
        </div>

        {/* FACULTY PROCTOR ASSIGNMENT CARD */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs space-y-0">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 text-xs">
              Assigned Faculty Proctor / Mentor
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Mentorship Division
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-800 text-sm">
                PG
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Dr. Praveen Gowda</h3>
                <p className="text-zinc-500 text-xs">Professor & Head, Department of Computer Applications</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Department Cabin: <strong>BCA HOD Office, 2nd Floor, Main Block</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="font-mono">Email: <strong>hod.bca@rrce.org</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="font-mono">Internal Extension: <strong>Ext. 204</strong></span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 leading-relaxed">
              <strong>Proctor Mentorship Role:</strong> Your faculty proctor is responsible for academic counseling, attendance monitoring, CIE review, and authorizing examination hall ticket eligibility.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
