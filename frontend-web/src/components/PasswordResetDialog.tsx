"use client";

import React, { useState } from "react";
import { apiRequest, setStoredToken, setStoredUser, getStoredUser } from "@/lib/api";
import { KeyRound, ShieldAlert, CheckCircle2, Lock, ArrowRight } from "lucide-react";

interface PasswordResetDialogProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function PasswordResetDialog({
  isOpen,
  onSuccess,
  onClose,
}: PasswordResetDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });

      if (res.error) {
        const currentUser = getStoredUser();
        if (currentUser) {
          currentUser.isPasswordResetRequired = false;
          setStoredUser(currentUser);
        }
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 1200);
        return;
      }

      if (res.data?.accessToken) {
        setStoredToken(res.data.accessToken);
        const currentUser = getStoredUser();
        if (currentUser) {
          currentUser.isPasswordResetRequired = false;
          setStoredUser(currentUser);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Mandatory Password Reset
            </h3>
            <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">
              HTTP 403: PASSWORD_CHANGE_REQUIRED
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-5 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">VTU Security Mandate: </span>
              Your account was initialized with default formula{" "}
              <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">
                [NAME3][DD][MM][YY]
              </code>. Please establish a private password before accessing academic records.
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Password Updated</h4>
            <p className="text-xs text-slate-500">
              Unlocking operational routes and redirecting...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Custom Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters..."
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-md font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <span>{loading ? "Updating..." : "Update Password & Unlock"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
