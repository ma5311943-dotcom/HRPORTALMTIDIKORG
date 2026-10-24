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
      label: user.isCandidate ? "My Candidate Portal" : "Analytics Dashboard",
      icon: Building2,
      desc: user.isCandidate ? "Enrolment & allocation status" : "Constituency quotas & KPIs",
      badge: 0,
    },
    ...(canBrowseCandidates
      ? [
          {
            id: "candidates",
            label: "Candidate Registry",
            icon: Users,
            desc: "Verified NADRA records",
            badge: 0,
          },
        ]
      : []),
    ...(user.permissions.canAllocateSeats || user.permissions.canRevokeAllocations
      ? [
          {
            id: "allocation",
            label: "Seat & Job Allocation",
            icon: Award,
            desc: "Appointments & gazettes",
            badge: 0,
          },
        ]
      : []),
    ...(user.permissions.canSendMessage
      ? [
          {
            id: "chat",
            label: "Inter-Agency Comms",
            icon: MessageSquare,
            desc: "Official messages",
            badge: unreadCount,
          },
        ]
      : []),
    ...(user.permissions.canGenerateReports
      ? [
          {
            id: "reports",
            label: "Gazette Reports",
            icon: FileText,
            desc: "Audits & quota summaries",
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

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white text-slate-700 border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out print:hidden ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-72 max-w-[85vw] lg:w-20" : "w-72 max-w-[85vw]"}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-white shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              <img
                src="/images/state_emblem.jpg"
                alt="State Emblem"
                className="w-full h-full object-cover"
              />
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                    Internal HR
                  </span>
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    System
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  National HR & Constituency Portal
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Current User Profile Card */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 ring-2 ring-white"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user.name}
                  </div>
                  <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 truncate max-w-full">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/70">
                <span className="truncate max-w-[170px]" title={user.department}>
                  {user.department}
                </span>
                <button
                  onClick={onOpenSwitchRole}
                  className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold shrink-0 cursor-pointer"
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
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 ring-2 ring-white"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            </div>
          )}
        </div>

        {/* Constituency Scope Selector */}
        {!user.isCandidate && (!isCollapsed ? (
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Active Jurisdiction
              </span>
              <span className="text-[9px] text-slate-400 font-mono">{districts.length} Districts</span>
            </div>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-white text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer appearance-none pr-7 truncate transition-colors"
              >
                <option value="All">All Districts (National Master Roster)</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    District {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="p-2 border-b border-slate-100 flex justify-center" title={`Scope: ${selectedDistrict}`}>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        ))}

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                className={`relative w-full flex items-center rounded-lg transition-all text-left cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border-l-[3px] border-emerald-600"
                    : "text-slate-600 border-l-[3px] border-transparent hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"
                  }`}
                />

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="text-[10px] font-bold min-w-4 h-4 px-1 rounded-full bg-red-500 text-white flex items-center justify-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={`text-[10px] truncate leading-tight ${
                        isActive ? "text-emerald-600/80" : "text-slate-400"
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
        <div className="p-3 border-t border-slate-100 bg-white space-y-2 shrink-0">
          <button
            onClick={onLogout}
            title="Sign Out of Portal"
            className={`w-full flex items-center rounded-lg text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all text-xs font-semibold cursor-pointer ${
              isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
            }`}
          >
            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>

          {!isCollapsed && (
            <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>{currentTime || "PKT"}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px]">
                <Shield className="w-3 h-3 text-emerald-600" />
                <span>AES-256</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
