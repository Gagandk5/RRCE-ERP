"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Layers } from "lucide-react";

export default function HodError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("HOD Portal Error:", error);
  }, [error]);

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-md">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Department Desk Error</h2>
        <p className="text-xs text-slate-600 mb-6">
          Could not load the department governance or lockout override desk.
        </p>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Desk</span>
          </button>
          <Link
            href="/hod"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>HOD Desk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
