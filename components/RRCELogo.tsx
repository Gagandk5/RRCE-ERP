import React from "react";

interface RRCELogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  lightText?: boolean;
}

export default function RRCELogo({
  className = "",
  size = "md",
  showText = true,
  lightText = false,
}: RRCELogoProps) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* RRCE Official Emblem (Blue & Gold Crest with Gear, Book & Globe) */}
      <div className={`relative ${dimensions} shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Gold Shield Border */}
          <path
            d="M50 5 L90 20 V55 C90 75 50 95 50 95 C50 95 10 75 10 55 V20 L50 5 Z"
            fill="#0F2942"
            stroke="#D97706"
            strokeWidth="4"
          />

          {/* Inner Golden Ring */}
          <circle cx="50" cy="45" r="30" stroke="#F59E0B" strokeWidth="2.5" fill="#0A192F" />

          {/* Engineering Gear (Technological Advancement) */}
          <g stroke="#D97706" strokeWidth="2" fill="none">
            <circle cx="50" cy="45" r="18" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M50 24 V28 M50 62 V66 M29 45 H33 M67 45 H71 M35 30 L38 33 M62 57 L65 60 M35 60 L38 57 M62 30 L65 33" strokeWidth="2.5" />
          </g>

          {/* Academic Open Book (Knowledge) */}
          <path
            d="M36 50 C42 47 48 48 50 51 C52 48 58 47 64 50 V60 C58 57 52 58 50 61 C48 58 42 57 36 60 Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="1.5"
          />

          {/* Global Meridian / Globe (Globally Competent Professionals) */}
          <path d="M38 45 C42 40 58 40 62 45" stroke="#60A5FA" strokeWidth="1.5" />
          <path d="M42 38 C46 34 54 34 58 38" stroke="#60A5FA" strokeWidth="1.2" />

          {/* Star of Excellence */}
          <path d="M50 16 L52 20 L56 20 L53 23 L54 27 L50 24 L46 27 L47 23 L44 20 L48 20 Z" fill="#FBF1C7" />
        </svg>
      </div>

      {/* Institutional Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-extrabold tracking-tight text-base sm:text-lg ${lightText ? "text-white" : "text-slate-900"}`}>
              RRCE <span className="text-amber-500 font-black">ERP</span>
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/30 uppercase tracking-widest">
              Autonomous
            </span>
          </div>
          <span className={`text-[10px] font-medium tracking-wide ${lightText ? "text-slate-300" : "text-slate-500"}`}>
            Rajarajeswari College of Engineering • Bengaluru
          </span>
        </div>
      )}
    </div>
  );
}
