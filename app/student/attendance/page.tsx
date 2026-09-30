"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarDays, RefreshCw } from "lucide-react";

type SubjectSummary = {
  code: string;
  name: string;
  held: number;
  attended: number;
  absent: number;
  excused: number;
  percentage: number;
};

type AttendanceData = {
  records: Array<{
    id: string;
    date: string;
    status: "PRESENT" | "ABSENT" | "EXCUSED";
    subject: { code: string; name: string };
  }>;
  subjects: SubjectSummary[];
  totalHeld: number;
  totalAttended: number;
};

export default function StudentAttendancePage() {
  const [data, setData] = useState<AttendanceData>({ records: [], subjects: [], totalHeld: 0, totalAttended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(async (backgroundRefresh = false) => {
    if (!backgroundRefresh) setLoading(true);
    try {
      const response = await fetch("/api/student/attendance", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load attendance.");
      setData(payload);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
    const refreshTimer = window.setInterval(() => void loadAttendance(true), 10000);
    return () => window.clearInterval(refreshTimer);
  }, [loadAttendance]);

  const overallPercentage = data.totalHeld
    ? Number(((data.totalAttended / data.totalHeld) * 100).toFixed(1))
    : 0;

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/60 pb-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-zinc-900">Attendance Ledger &amp; Eligibility</h1>
          <p className="mt-0.5 text-xs text-zinc-400">Live subject totals · updated automatically</p>
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 font-mono text-xs font-semibold text-emerald-700">
          Aggregate: {overallPercentage}%
        </span>
      </div>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span><button type="button" onClick={() => void loadAttendance()} className="font-semibold underline underline-offset-2">Retry</button></div>}

      <section className="space-y-5 rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Subject-wise attendance</h2>
            <p className="mt-0.5 text-xs text-zinc-400">{data.totalAttended} attended out of {data.totalHeld} recorded classes</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400"><RefreshCw className="h-3 w-3" />Refreshes every 10 seconds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead className="border-b border-zinc-100 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              <tr><th className="px-4 pb-3">Subject &amp; code</th><th className="px-4 pb-3 text-center">Attended</th><th className="px-4 pb-3 text-center">Percentage</th><th className="px-4 pb-3 text-center">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {data.subjects.map((subject) => {
                const eligible = subject.percentage >= 75;
                return <tr key={subject.code} className="transition-colors hover:bg-zinc-50/60">
                  <td className="px-4 py-4"><div className="text-sm font-semibold text-zinc-900">{subject.name}</div><div className="mt-0.5 font-mono text-xs text-zinc-400">{subject.code}</div></td>
                  <td className="px-4 py-4 text-center font-mono font-semibold text-zinc-800">{subject.attended} / {subject.held}</td>
                  <td className={`px-4 py-4 text-center font-mono text-sm font-bold ${eligible ? "text-zinc-900" : "text-rose-600"}`}>{subject.percentage.toFixed(1)}%</td>
                  <td className="px-4 py-4 text-center"><span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${eligible ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>{eligible ? "On Track" : "Below 75%"}</span></td>
                </tr>;
              })}
              {!loading && data.subjects.length === 0 && <tr><td colSpan={4} className="px-4 py-14 text-center"><CalendarDays className="mx-auto h-5 w-5 text-zinc-300" /><p className="mt-3 text-sm font-medium text-zinc-700">No attendance records yet</p><p className="mt-1 text-xs text-zinc-400">Your class attendance will appear here after faculty submits it.</p></td></tr>}
              {loading && <tr><td colSpan={4} className="px-4 py-12 text-center text-xs text-zinc-400">Loading attendance…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7">
        <div className="border-b border-zinc-100 pb-4"><h2 className="text-sm font-semibold text-zinc-900">Recent class records</h2><p className="mt-0.5 text-xs text-zinc-400">Most recent attendance entries</p></div>
        {data.records.length ? <div className="divide-y divide-zinc-100">{data.records.slice(0, 10).map((record) => <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-xs font-semibold text-zinc-800">{record.subject.name}</p><p className="mt-1 font-mono text-[11px] text-zinc-400">{record.subject.code} · {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${record.date}T00:00:00Z`))}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${record.status === "PRESENT" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : record.status === "EXCUSED" ? "border-amber-100 bg-amber-50 text-amber-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>{record.status}</span></div>)}</div> : <p className="py-8 text-center text-xs text-zinc-400">No recent class records.</p>}
      </section>
    </div>
  );
}
