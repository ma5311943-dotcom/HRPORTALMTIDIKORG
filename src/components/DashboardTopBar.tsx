"use client";

import React from "react";
import {
  Menu,
  MapPin,
  Globe2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { UserSession } from "@/lib/auth";

interface DashboardTopBarProps {
  activeTab: string;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  districts: string[];
  user: UserSession;
  onOpenMobileMenu: () => void;
  onOpenSwitchRole: () => void;
  onLogout: () => void;
  onGoToLandingPage: () => void;
  unreadCount?: number;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Constituency Analytics & Quota Monitor",
    subtitle: "Real-time verification indices, candidate allocations, and district thresholds",
  },
  candidates: {
    title: "Candidate Registration & Verified Roster",
    subtitle: "Biometric and NADRA CNIC matched talent archives for election constituencies",
  },
  allocation: {
    title: "Parliamentary Seat & Public Job Allocation",
    subtitle: "Meritocratic quota distribution with official Gazette notification issuance",
  },
  chat: {
    title: "Inter-Agency Parliamentary Communications",
    subtitle: "Protected communications network for MNAs, MPAs, Commissioners and Staff",
  },
  reports: {
    title: "Election-Ready Ledgers & Gazette Audits",
    subtitle: "Printable constituency breakdown, party distributions, and legal compliance records",
  },
};

export default function DashboardTopBar({
  activeTab,
  selectedDistrict,
  setSelectedDistrict,
  districts,
  user,
  onOpenMobileMenu,
  onOpenSwitchRole,
  onLogout,
  onGoToLandingPage,
  unreadCount = 0,
}: DashboardTopBarProps) {
  const currentInfo =
    user.isCandidate && activeTab === "dashboard"
      ? {
          title: "My Candidate Record",
          subtitle: "Enrolment particulars, verification progress, and allocation status",
        }
      : TAB_TITLES[activeTab] || {
          title: "Constituency Human Resources Portal",
          subtitle: "Government of Pakistan Official Administration System",
        };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 print:hidden">
      {/* Utility bar — Dark Green UI */}
      <div className="hidden sm:flex bg-[#072418] text-emerald-200/80 text-[11px] py-1.5 px-4 lg:px-6 items-center justify-between border-b border-[#0d3b28]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shrink-0" />
          <span className="font-bold text-white tracking-wide truncate">
            <span className="xl:hidden">GOVT OF KPK • DHQ HOSPITAL</span>
            <span className="hidden xl:inline">GOVERNMENT OF KHYBER PAKHTUNKHWA • DHQ HOSPITAL HR SYSTEM</span>
          </span>
          <span className="text-emerald-500/40 hidden md:inline">|</span>
          <span className="truncate hidden md:inline text-[11px]">
            Signed in: <strong className="text-white">{user.name}</strong> <span className="hidden lg:inline">({user.role})</span>
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onGoToLandingPage}
            className="flex items-center gap-1 text-emerald-200/80 hover:text-white cursor-pointer font-medium"
          >
            <Globe2 className="w-3 h-3 text-[#10b981]" />
            <span>Landing Page</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Hamburger & Module Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate flex items-center gap-2">
              <span className="truncate">{currentInfo.title}</span>
              <span className="hidden md:inline-block shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Scope: {selectedDistrict === "All" ? "National" : selectedDistrict}
              </span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: District Quick Selector & User Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-2.5 py-1.5 border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            {user.isCandidate ? (
              <span className="text-xs font-semibold text-slate-700 max-w-[140px] truncate">
                {user.district}
              </span>
            ) : (
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[140px]"
                aria-label="Select district scope"
              >
                <option value="All">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    District {d}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={onGoToLandingPage}
            title="Public landing page"
            className="sm:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <Globe2 className="w-4 h-4" />
          </button>

          <div
            title={`Active session: ${user.name} (${user.role})`}
            className="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user.name.split(" ")[0]}
              </div>
              <div className="text-[10px] text-slate-500 leading-none">
                {user.role.split(" ")[0]}
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
