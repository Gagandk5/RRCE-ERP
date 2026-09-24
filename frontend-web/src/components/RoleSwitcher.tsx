"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  DEMO_PERSONAS,
  UserSession,
  getStoredUser,
  setStoredUser,
  setStoredToken,
  API_BASE,
} from "@/lib/api";
import {
  ShieldAlert,
  UserCheck,
  ChevronDown,
  Building2,
  KeyRound,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface RoleSwitcherProps {
  onTriggerPasswordReset?: () => void;
}

export default function RoleSwitcher({ onTriggerPasswordReset }: RoleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // Default to Principal on first load
      handleSelectPersona(DEMO_PERSONAS[0]);
    }
  }, []);

  const handleSelectPersona = async (persona: (typeof DEMO_PERSONAS)[0]) => {
    setLoadingRole(persona.role);
    setIsOpen(false);

    try {
      // Try live backend switch first
      const res = await fetch(`${API_BASE}/auth/demo-switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: persona.role }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setStoredToken(data.accessToken);
        setStoredUser(data.user);
        setCurrentUser(data.user);
      } else {
        // Fallback for static demonstration
        const mockUser: UserSession = {
          id: `usr-${persona.role.toLowerCase()}`,
          username: persona.email.split("@")[0],
          email: persona.email,
          role: persona.role,
          firstName: persona.name.split(" ")[0],
          lastName: persona.name.split(" ").slice(1).join(" "),
          isPasswordResetRequired: persona.role === "STUDENT", // Gagan requires password reset
          departmentName: persona.dept,
          studentProfile:
            persona.role === "STUDENT"
              ? {
                id: "stu-gagan-007",
                usn: "1RR25BC007",
                usnYear: 25,
                usnBranch: "BC",
                usnSequence: 7,
                currentSemester: 1,
                quota: "CET",
              }
              : undefined,
          facultyProfile:
            persona.role === "FACULTY"
              ? {
                id: "fac-math-014",
                employeeCode: "RRCE-FAC-014",
                designation: "Associate Professor",
              }
              : undefined,
        };
        setStoredToken(`mock-token-${persona.role}`);
        setStoredUser(mockUser);
        setCurrentUser(mockUser);
      }

      // Automatically navigate to role portal
      router.push(persona.route);
    } catch (e) {
      console.error("Failed to switch persona", e);
    } finally {
      setLoadingRole(null);
    }
  };

  const activePersona =
    DEMO_PERSONAS.find((p) => p.role === currentUser?.role) || DEMO_PERSONAS[0];

  return (
    <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Institution Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/40">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">RRCE ERP</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  VTU / AICTE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                RajaRajeswari College of Engineering
              </p>
            </div>
          </div>

          {/* Persona Switcher Dropdown */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 bg-slate-800/90 hover:bg-slate-750 px-4 py-2 rounded-xl border border-slate-700/80 shadow-inner transition-all duration-200"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Demo Role:
                    </span>
                    <span className="text-sm font-bold text-white">
                      {activePersona.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {activePersona.name} ({activePersona.dept})
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-xl z-50">
                  <div className="px-4 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Institutional Persona</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
                    {DEMO_PERSONAS.map((persona) => {
                      const isSelected = currentUser?.role === persona.role;
                      return (
                        <button
                          key={persona.role}
                          onClick={() => handleSelectPersona(persona)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-start space-x-3 ${isSelected ? "bg-amber-500/10 border-l-4 border-amber-500" : ""
                            }`}
                        >
                          <div
                            className={`mt-0.5 p-1.5 rounded-lg ${isSelected
                                ? "bg-amber-500 text-slate-950 font-bold"
                                : "bg-slate-800 text-slate-400"
                              }`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-semibold ${isSelected ? "text-amber-400" : "text-slate-200"
                                  }`}
                              >
                                {persona.label}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {persona.badge}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 font-medium">
                              {persona.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {persona.dept}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Trigger for Password Reset Dialog */}
            {currentUser?.isPasswordResetRequired && (
              <button
                type="button"
                onClick={onTriggerPasswordReset}
                className="flex items-center space-x-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold animate-bounce"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Required</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

