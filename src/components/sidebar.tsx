"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Overview",
    href: "/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Rules",
    href: "/rules",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L14.5 4.5V11.5L8 15L1.5 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 8L14.5 4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 8L1.5 4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 8V15" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Signal Quality",
    href: "/quality",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 8V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] border-r border-white/[0.06] bg-[rgba(22,23,26,0.92)] flex flex-col">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-bold">
            S
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Sentinel
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
            >
              <span className={isActive ? "text-white" : "text-white/40"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="text-[11px] text-white/30 px-2.5">
          Trust & Safety Platform
        </div>
      </div>
    </aside>
  );
}
