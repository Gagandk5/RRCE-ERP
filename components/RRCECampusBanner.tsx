import React from "react";

interface RRCECampusBannerProps {
  className?: string;
}

export default function RRCECampusBanner({ className = "" }: RRCECampusBannerProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-md ${className}`}>
      {/* Background Graphic depicting RRCE Campus Main Building */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-blue-950/80 z-10" />

      {/* SVG Campus Building Architecture Background */}
      <svg
        className="absolute right-0 bottom-0 opacity-20 w-full h-full object-cover pointer-events-none"
        viewBox="0 0 800 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Academic Dome & Pillars */}
        <path d="M350 200 H450 V300 H350 Z" fill="#D97706" opacity="0.3" />
        <path d="M340 180 L400 130 L460 180 Z" fill="#F59E0B" opacity="0.4" />
        {/* Clock Tower Dome */}
        <circle cx="400" cy="110" r="18" fill="#F59E0B" stroke="#D97706" strokeWidth="2" opacity="0.5" />
        <rect x="396" y="90" width="8" height="15" fill="#D97706" />

        {/* Left Wing Building */}
        <rect x="150" y="210" width="180" height="90" fill="#1E3A8A" opacity="0.4" />
        <rect x="170" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />
        <rect x="210" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />
        <rect x="250" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />
        <rect x="290" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />

        {/* Right Wing Building */}
        <rect x="470" y="210" width="180" height="90" fill="#1E3A8A" opacity="0.4" />
        <rect x="490" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />
        <rect x="530" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />
        <rect x="570" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />
        <rect x="610" y="230" width="25" height="35" rx="3" fill="#60A5FA" opacity="0.2" />

        {/* Grand Arch Entrance Pillars */}
        <rect x="370" y="240" width="12" height="60" fill="#FFFFFF" opacity="0.3" />
        <rect x="418" y="240" width="12" height="60" fill="#FFFFFF" opacity="0.3" />
        <path d="M370 240 C370 220 430 220 430 240 Z" fill="#F59E0B" opacity="0.4" />
      </svg>

      {/* Banner Foreground Overlay */}
      <div className="relative z-20 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Autonomous Institute under VTU Belagavi • AICTE Approved
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Rajarajeswari College of Engineering
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mysore Road, Bengaluru, Karnataka 560074 • NAAC &apos;A+&apos; Accredited Campus
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center min-w-[100px]">
            <span className="block text-lg font-black text-amber-400">2006</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Established</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center min-w-[100px]">
            <span className="block text-lg font-black text-blue-400">NAAC A+</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Accredited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
