"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Award,
  MessageSquare,
  FileText,
  Shield,
  MapPin,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { UserSession } from "@/lib/auth";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  districts: string[];
  unreadCount?: number;
  user: UserSession;
  onLogout: () => void;
  onOpenSwitchRole: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedDistrict,
  setSelectedDistrict,
  districts,
  unreadCount = 0,
  user,
  onLogout,
  onOpenSwitchRole,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-PK", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " PKT"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const canBrowseCandidates =
    user.permissions.canRegisterCandidates ||
    user.permissions.canAllocateSeats ||
    user.permissions.canGenerateReports;

  const navItems = [
    {
      id: "dashboard",
      label: user.isCandidate ? "My Applicant Portal" : "Analytics Dashboard",
      icon: Building2,
      desc: user.isCandidate ? "Application & appointment status" : "DHQ staff KPIs & quota tracking",
      badge: 0,
    },
    ...(canBrowseCandidates
      ? [
          {
            id: "candidates",
            label: "Applicant Registry",
            icon: Users,
            desc: "NADRA-verified staff applicants",
            badge: 0,
          },
        ]
      : []),
    ...(user.permissions.canAllocateSeats || user.permissions.canRevokeAllocations
      ? [
          {
            id: "allocation",
            label: "Staff Appointment",
            icon: Award,
            desc: "DHQ role assignments & orders",
            badge: 0,
          },
        ]
      : []),
    ...(user.permissions.canSendMessage
      ? [
          {
            id: "chat",
            label: "Internal Memos",
            icon: MessageSquare,
            desc: "Official hospital notices",
            badge: unreadCount,
          },
        ]
      : []),
    ...(user.permissions.canGenerateReports
      ? [
          {
            id: "reports",
            label: "HR Reports",
            icon: FileText,
            desc: "Staff rosters & audits",
            badge: 0,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Container — Dribbble Dark-Green Dashboard Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#072418] text-slate-200 border-r border-[#0d3b28] shadow-2xl transition-all duration-300 ease-in-out print:hidden ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-72 max-w-[85vw] lg:w-20" : "w-72 max-w-[85vw]"}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#0d3b28] flex items-center justify-between gap-2 bg-[#072418] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#1b5e3f] overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/images/state_emblem.jpg"
                alt="State Emblem"
                className="w-full h-full object-cover"
              />
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white uppercase">
                    DHQ Hospital
                  </span>
                  <span className="bg-[#10b981] text-[#052e16] text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                    HR
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/70 font-medium truncate">
                  Teaching Hospital D.I. Khan
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-emerald-300/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Current User Profile Card */}
        <div className="p-3 border-b border-[#0d3b28] bg-[#051c13]">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#1b5e3f] ring-2 ring-[#072418]"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#072418]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {user.name}
                  </div>
                  <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-[#0d3b28] text-emerald-300 border border-[#1b5e3f] truncate max-w-full">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[10px] text-emerald-200/60 pt-1.5 border-t border-[#0d3b28]">
                <span className="truncate max-w-[170px]" title={user.department}>
                  {user.department}
                </span>
                <button
                  onClick={onOpenSwitchRole}
                  className="text-emerald-300 hover:text-white hover:underline font-bold shrink-0 cursor-pointer"
                >
                  Switch
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-1">
              <button
                onClick={onOpenSwitchRole}
                title={`Signed in as ${user.name} (${user.role}). Click to switch role.`}
                className="relative cursor-pointer group"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#1b5e3f]"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#072418]" />
              </button>
            </div>
          )}
        </div>

        {/* Constituency Scope Selector */}
        {!user.isCandidate && (!isCollapsed ? (
          <div className="p-3 border-b border-[#0d3b28]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#10b981]" />
                Active Jurisdiction
              </span>
              <span className="text-[9px] text-emerald-400/60 font-mono">{districts.length} Districts</span>
            </div>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-[#051c13] text-emerald-100 text-xs font-semibold rounded-xl px-2.5 py-2 border border-[#1b5e3f] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 focus:border-[#10b981] cursor-pointer appearance-none pr-7 truncate transition-colors"
              >
                <option value="All" className="bg-[#072418] text-white">All Districts (National Master Roster)</option>
                {districts.map((d) => (
                  <option key={d} value={d} className="bg-[#072418] text-white">
                    District {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="p-2 border-b border-[#0d3b28] flex justify-center" title={`Scope: ${selectedDistrict}`}>
            <div className="w-8 h-8 rounded-lg bg-[#0d3b28] border border-[#1b5e3f] flex items-center justify-center text-[#10b981]">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        ))}

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5 custom-scrollbar">
          {!isCollapsed && (
            <div className="px-2.5 pb-1.5 text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">
              System Modules
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`relative w-full flex items-center rounded-xl transition-all text-left cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-[#10b981] text-[#052e16] font-extrabold shadow-md shadow-emerald-950/60"
                    : "text-emerald-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-[#052e16]" : "text-emerald-300/70 group-hover:text-emerald-200"
                  }`}
                />

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="text-[10px] font-black min-w-4 h-4 px-1 rounded-full bg-red-500 text-white flex items-center justify-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={`text-[10px] truncate leading-tight ${
                        isActive ? "text-[#052e16]/80 font-semibold" : "text-emerald-300/50"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                )}

                {isCollapsed && item.badge && item.badge > 0 ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & Status Section */}
        <div className="p-3 border-t border-[#0d3b28] bg-[#051c13] space-y-2 shrink-0">
          <button
            onClick={onLogout}
            title="Sign Out of Portal"
            className={`w-full flex items-center rounded-xl text-red-300 hover:text-white bg-red-950/50 hover:bg-red-900/60 border border-red-900/40 transition-all text-xs font-semibold cursor-pointer ${
              isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
            }`}
          >
            <LogOut className="w-4 h-4 text-red-400 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>

          {!isCollapsed && (
            <div className="pt-2 text-[10px] text-emerald-200/50 flex items-center justify-between border-t border-[#0d3b28]">
              <div className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#10b981]" />
                <span>{currentTime || "PKT"}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-emerald-400/60">
                <Shield className="w-3 h-3 text-[#10b981]" />
                <span>AES-256</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
