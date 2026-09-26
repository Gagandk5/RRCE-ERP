"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, Lock, ArrowRight } from "lucide-react";

interface PasswordResetModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  username?: string;
  firstName?: string;
}

export default function PasswordResetModal({
  isOpen,
  onSuccess,
  username,
  firstName,
}: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setError(data.error || "Password update failed.");
      }
    } catch {
      setError("Failed to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full shadow-lg border border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-3 text-amber-700 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200">
            <KeyRound className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Mandatory First Login Reset</h2>
            <p className="text-xs text-slate-500">Security Invariant: Account Protection</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-5 text-xs text-amber-900 leading-relaxed">
          <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Default Password Formula Expired
          </div>
          Your account was provisioned with the standard formula:
          <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded mx-1">
            [NAME_3_UPPER][DD][MM][YY]
          </span>
          (e.g. <code className="font-mono font-bold">AMI080707</code>). You must set a permanent confidential password to proceed.
        </div>

        {error && (
          <div className="mb-4 text-xs bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2 animate-bounce" />
            <h3 className="text-base font-bold text-slate-900">Password Updated Successfully!</h3>
            <p className="text-xs text-slate-500 mt-1">Directing you to your portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter at least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Encrypting & Saving..."
              ) : (
                <>
                  <span>Save Password & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
