"use client";

import { useState } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tooltip?: string;
  color?: "default" | "red" | "amber" | "green" | "blue";
}

const colorMap = {
  default: "bg-white/[0.04] border-white/[0.06]",
  red: "bg-[rgba(255,23,63,0.08)] border-[rgba(255,23,63,0.15)]",
  amber: "bg-[rgba(250,130,0,0.06)] border-[rgba(250,130,0,0.12)]",
  green: "bg-[rgba(34,255,153,0.06)] border-[rgba(34,255,153,0.12)]",
  blue: "bg-[rgba(0,119,255,0.08)] border-[rgba(0,119,255,0.15)]",
};

const valueColorMap = {
  default: "text-white",
  red: "text-[#FF9592]",
  amber: "text-[#FFCA16]",
  green: "text-[rgba(70,254,165,0.83)]",
  blue: "text-[#70B8FF]",
};

export function StatCard({ label, value, sub, tooltip, color = "default" }: StatCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`rounded-lg border px-4 py-3 relative ${colorMap[color]}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className="text-[11px] uppercase tracking-wider text-white/40">
          {label}
        </div>
        {tooltip && (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center cursor-help text-[9px] text-white/30">
              ?
            </div>
            {showTooltip && (
              <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-52 px-3 py-2 rounded-md bg-[rgba(22,23,26,0.98)] border border-white/[0.1] text-[11px] text-white/60 leading-relaxed shadow-lg">
                {tooltip}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white/[0.1]" />
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`text-2xl font-semibold font-mono ${valueColorMap[color]}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}
