"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Application Error</h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          The system encountered an unexpected condition. Your session is preserved. Try reloading the view or returning to the portal selector.
        </p>

        {error.message && (
          <div className="mb-6 p-3 bg-slate-100 rounded-xl text-left">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Diagnostic Details:
            </span>
            <code className="text-xs font-mono text-slate-800 break-all">{error.message}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Page</span>
          </button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
