"use client";

import { useState } from "react";
import { navItems } from "@/lib/dummy-data";
import { NavIcon } from "@/components/icons/NavIcons";

type SidebarProps = {
  activeItem?: string;
};

export function Sidebar({ activeItem = "Dashboard" }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Amazon AI</p>
          <p className="truncate text-xs text-slate-400">Seller Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.label === activeItem;
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <NavIcon
                name={item.icon}
                className={`h-5 w-5 shrink-0 ${isActive ? "text-orange-400" : ""}`}
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">
            MJ
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Meet Joshi</p>
            <p className="truncate text-xs text-slate-400">Pro Seller</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-slate-900 p-2 text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

<aside
  className={`sticky top-0 z-50 flex h-screen w-64 flex-col bg-[#0f172a] transition-transform duration-300 lg:translate-x-0 ${
    mobileOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
  <button
    type="button"
    onClick={() => setMobileOpen(false)}
    className="absolute right-3 top-4 rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
    aria-label="Close menu"
  >
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>

  {sidebarContent}
</aside>
    </>
  );
}
