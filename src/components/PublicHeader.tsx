"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, UserPlus, Lock, Menu, X, Home } from "lucide-react";

interface PublicHeaderProps {
  activePage?: "home" | "login" | "signup";
}

const NAV_ITEMS = [
  { hash: "#overview", label: "System Overview" },
  { hash: "#cnic-verify", label: "Verify CNIC" },
  { hash: "#roles", label: "Role Portals" },
  { hash: "#provinces", label: "Provincial Ledgers" },
  { hash: "#compliance", label: "National Standards" },
];

export default function PublicHeader({ activePage = "home" }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getHref = (hash: string) => (activePage === "home" ? hash : `/${hash}`);

  return (
    <>
      <div className="bg-[#072418] text-white border-b border-[#0d3b28]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/images/state_emblem.jpg"
              alt="State Emblem of Pakistan"
              className="h-4 w-4 shrink-0 rounded-full border border-[#1b5e3f] object-cover"
            />
            <span className="truncate text-[10px] font-bold tracking-wide text-white sm:text-[11px]">
              GOVERNMENT OF KHYBER PAKHTUNKHWA • HEALTH DEPARTMENT
            </span>
            <span className="hidden text-emerald-600 xl:inline">•</span>
            <span className="hidden text-[11px] text-emerald-200/80 xl:inline">
              DHQ Teaching Hospital D.I. Khan
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3 font-mono text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#10b981]" />
              <span className="hidden sm:inline">DHQ Hospital Recruitment</span>
            </div>
            <span className="hidden text-emerald-700 sm:inline">|</span>
            <span className="hidden text-emerald-300/70 md:inline">Session 2026</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="DHQ Hospital HR Home">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/state_emblem.jpg"
                alt="State Emblem of Pakistan"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-800 sm:text-lg">
                  HR Portal <span className="text-emerald-700">MMTI</span>
                </span>
                <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 sm:inline-block">
                  D.I. Khan
                </span>
              </div>
              <p className="hidden text-[11px] font-medium leading-none text-slate-500 md:block">
                DHQ Teaching Hospital Staff Recruitment &amp; Management Portal
              </p>
            </div>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-0.5 text-xs font-semibold text-slate-600 lg:flex xl:gap-2 xl:text-sm"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.hash}
                href={getHref(item.hash)}
                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/signup"
              className={`hidden items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all sm:inline-flex ${
                activePage === "signup"
                  ? "border-[#1b5e3f] bg-[#072418] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#10b981] hover:bg-emerald-50"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Register</span>
            </Link>
            <Link
              href="/login"
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all hover:scale-[1.02] ${
                activePage === "login"
                  ? "bg-[#10b981] text-[#052e16] font-black"
                  : "bg-[#072418] hover:bg-[#10b981] text-white hover:text-[#052e16] border border-[#1b5e3f]"
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="rounded-xl p-2 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="public-mobile-nav"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            id="public-mobile-nav"
            className="animate-in slide-in-from-top-2 space-y-1 border-t border-slate-200 bg-white px-4 py-3 shadow-md duration-150 lg:hidden"
          >
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Home className="h-3.5 w-3.5 text-emerald-700" />
              Public Home
            </Link>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.hash}
                href={getHref(item.hash)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 border-t border-slate-100 pt-2">
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-800"
              >
                Register
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 rounded-xl bg-emerald-700 px-3 py-2 text-center text-xs font-bold text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
