"use client";

import React, { useMemo, useState } from "react";
import { SystemAnalytics, Candidate, Allocation, RoleCategory, DHQ_STAFF_ROLES, RecommenderAlias, DI_KHAN_TEHSILS } from "@/types";
import { 
  Users, 
  CheckCircle2, 
  MapPin, 
  Award, 
  FileCheck, 
  ChevronRight, 
  Sparkles, 
  Building,
  Download,
  Filter,
  Eye,
  FileText,
  ShieldCheck,
  Stethoscope,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { ROLE_STYLES, PARTY_LABELS, PARTY_STYLES } from "@/lib/ui";
import { exportStaffRosterToWord } from "@/lib/export-word";

interface DashboardViewProps {
  analytics: SystemAnalytics;
  candidates: Candidate[];
  allocations: Allocation[];
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  onNavigateTab: (tab: string) => void;
  onSelectCandidate: (candidate: Candidate) => void;
  canGenerateReports?: boolean;
  canAllocateSeats?: boolean;
}

export default function DashboardView({
  analytics,
  candidates,
  allocations,
  selectedDistrict,
  setSelectedDistrict,
  onNavigateTab,
  onSelectCandidate,
  canGenerateReports = true,
  canAllocateSeats = true,
}: DashboardViewProps) {
  // Selected DHQ Category Filter
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("All");

  // Current scope calculations
  const districtFilteredAllocations = useMemo(() => {
    let list = allocations;
    if (selectedDistrict !== "All") {
      list = list.filter(a => a.district.toLowerCase() === selectedDistrict.toLowerCase());
    }
    if (selectedRoleFilter !== "All") {
      list = list.filter(a => a.roleCategory === selectedRoleFilter);
    }
    return list;
  }, [allocations, selectedDistrict, selectedRoleFilter]);

  const activeAllocationsCount = useMemo(() => {
    return districtFilteredAllocations.filter(a => a.status === "Active").length;
  }, [districtFilteredAllocations]);

  const districtFilteredCandidates = useMemo(() => {
    let list = candidates;
    if (selectedDistrict !== "All") {
      list = list.filter(c => c.domicileDistrict.toLowerCase() === selectedDistrict.toLowerCase());
    }
    if (selectedRoleFilter !== "All") {
      list = list.filter(c => c.appliedRole === selectedRoleFilter || allocations.some(a => a.candidateId === c.id && a.roleCategory === selectedRoleFilter));
    }
    return list;
  }, [candidates, allocations, selectedDistrict, selectedRoleFilter]);

  const verifiedCandidatesCount = useMemo(() => {
    return districtFilteredCandidates.filter(c => c.status === "Verified" || c.status === "Allocated").length;
  }, [districtFilteredCandidates]);

  const verificationRatio = useMemo(() => {
    if (districtFilteredCandidates.length === 0) return 0;
    return Math.round((verifiedCandidatesCount / districtFilteredCandidates.length) * 100);
  }, [districtFilteredCandidates, verifiedCandidatesCount]);

  const tehsilStats = useMemo(() => {
    const tehsils = Array.from(
      new Set(
        districtFilteredCandidates
          .map((c) => c.tehsil?.trim())
          .filter((t): t is string => !!t)
      )
    );
    return tehsils;
  }, [districtFilteredCandidates]);

  // Single-Click Export for current filtered view or all
  const handleExportWord = () => {
    const records = districtFilteredCandidates.map(c => {
      const alloc = allocations.find(a => a.candidateId === c.id);
      return { candidate: c, allocation: alloc };
    });

    const filterText = selectedRoleFilter === "All" ? "All DHQ Staff Categories" : `${selectedRoleFilter} Category`;
    exportStaffRosterToWord(records, `DHQ Hospital D.I. Khan - ${filterText} Staff Roster`);
    toast.success("Single-Click Export Successful!", {
      description: `Downloaded formatted Word document with ${records.length} records.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Hospital Director & Executive Governance Banner with Real Backdrop */}
      <div className="relative overflow-hidden rounded-2xl text-white p-6 sm:p-8 shadow-xl border border-[#0d3b28] bg-[#072418]">
        {/* Background Image with Light Green & Balanced Forest Green Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_dashboard_banner.jpg"
            alt="DHQ Hospital Campus"
            className="h-full w-full object-cover object-center filter brightness-[0.75] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#072418]/85 via-[#0b3824]/65 to-[#051c13]/75" />
          <div className="absolute inset-0 bg-[#072418]/25" />
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#10b981]/10 blur-3xl pointer-events-none z-0" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#0d3b28] border border-[#1b5e3f] px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300">
              <Stethoscope className="w-4 h-4 text-[#10b981] animate-pulse" />
              <span>DHQ Teaching Hospital D.I. Khan — Executive Staff Governance</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              DHQ Hospital Staff Recruitment &amp; Verification Portal
            </h2>

            <p className="text-emerald-100/80 text-sm leading-relaxed">
              Official centralized registry of Ward Boys, Attendants, Clerks, Security Guards, and Technical Staff across D.I. Khan tehsils: <strong>{DI_KHAN_TEHSILS.join(", ")}</strong>. Strict confidentiality of recommendation short-codes.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-emerald-200/90 pt-1">
              <span className="flex items-center gap-1.5 bg-[#051c13]/80 px-2.5 py-1 rounded-lg border border-[#1b5e3f]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                Zero Political Plain-Text
              </span>
              <span className="flex items-center gap-1.5 bg-[#051c13]/80 px-2.5 py-1 rounded-lg border border-[#1b5e3f]">
                <Briefcase className="w-3.5 h-3.5 text-emerald-300" />
                Hospital Director Directive Orders
              </span>
              <span className="flex items-center gap-1.5 bg-[#051c13]/80 px-2.5 py-1 rounded-lg border border-[#1b5e3f]">
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                Optional CNIC Uploads Enabled
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleExportWord}
              className="flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-black px-4 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer hover:scale-[1.02]"
              title="Download Word format file with appointment orders, CNIC, and references"
            >
              <Download className="w-4 h-4 text-[#052e16]" />
              <span>Single-Click Word Export</span>
            </button>

            {canAllocateSeats && (
              <button
                onClick={() => onNavigateTab("allocation")}
                className="flex items-center justify-center gap-2 bg-[#051c13] hover:bg-black/60 border border-[#1b5e3f] text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-[#10b981]" />
                <span>Hospital Director Workflow</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 9 DHQ Hospital Staff Role Category Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              Instant Role Category Filter (Click to Filter Roster)
            </h3>
            <p className="text-xs text-slate-500">
              Select any DHQ role below to immediately isolate staff members and export matching records
            </p>
          </div>

          {selectedRoleFilter !== "All" && (
            <button
              onClick={() => setSelectedRoleFilter("All")}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline self-start sm:self-auto cursor-pointer"
            >
              Reset to All Roles ({candidates.length})
            </button>
          )}
        </div>

        {/* Filter Badges: Responsive Wrap with clean min-width */}
        <div className="flex flex-wrap items-stretch gap-2">
          <button
            onClick={() => setSelectedRoleFilter("All")}
            className={`px-3.5 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center min-w-[85px] sm:min-w-[95px] flex-1 sm:flex-initial ${
              selectedRoleFilter === "All"
                ? "bg-[#072418] text-white border-[#1b5e3f] shadow-md font-bold"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-bold whitespace-nowrap">All Roles</div>
            <div className="text-sm font-black mt-1 text-[#10b981]">{candidates.length}</div>
          </button>

          {DHQ_STAFF_ROLES.map((role) => {
            const count = analytics.roleStats[role] || candidates.filter(c => c.appliedRole === role).length;
            const isSelected = selectedRoleFilter === role;
            return (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center min-w-[95px] sm:min-w-[105px] flex-1 sm:flex-initial ${
                  isSelected
                    ? "bg-[#072418] text-white border-[#1b5e3f] shadow-md font-bold"
                    : "bg-slate-50 hover:bg-emerald-50/60 text-slate-700 border-slate-200 hover:border-emerald-200 text-xs font-medium"
                }`}
              >
                <div className="text-[11px] leading-snug font-semibold text-center whitespace-normal" title={role}>
                  {role}
                </div>
                <div className={`text-xs font-bold mt-1 shrink-0 ${isSelected ? "text-[#10b981]" : "text-emerald-700"}`}>
                  {count} Staff
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 — Featured Hero Card matching Dribbble Dark Green UI */}
        <div className="bg-[#072418] rounded-2xl p-5 border border-[#1b5e3f] shadow-lg text-white hover:border-[#10b981] transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              {selectedRoleFilter === "All" ? "Total Enrolled Staff" : `${selectedRoleFilter} Count`}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0d3b28] text-[#10b981] flex items-center justify-center border border-[#1b5e3f]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {districtFilteredCandidates.length}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                {verificationRatio}% verified
              </span>
              <span className="text-emerald-200/70 text-[11px]">with NADRA CNIC</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-cyan-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Issued Appointments
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {activeAllocationsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-700 font-bold">Director Orders</span> & Joining Verified
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tehsils Represented
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {tehsilStats.length > 0 ? `${tehsilStats.length} Tehsils` : "—"}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium truncate" title={tehsilStats.join(", ")}>
              {tehsilStats.length > 0 ? tehsilStats.join(", ") : "No tehsil data recorded yet"}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verification Ratio
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {verificationRatio}%
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              Union Council & Reference Cleared
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tehsil Quota & Regional Distribution (Spans 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-700" />
                Tehsil Quota & Regional Recruitment Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Staff distribution across D.I. Khan administrative tehsils and surrounding zones
              </p>
            </div>

            {canAllocateSeats && (
              <button
                onClick={() => onNavigateTab("allocation")}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>Director Orders Workflow</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* District & Tehsil Bars */}
          <div className="mt-5 space-y-3.5">
            {analytics.districtStats.map((stat) => (
              <div 
                key={stat.district} 
                onClick={() => setSelectedDistrict(stat.district)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedDistrict === stat.district 
                    ? "bg-teal-50/70 border-teal-300 ring-1 ring-teal-200" 
                    : "bg-slate-50/70 hover:bg-white border-slate-200 hover:border-teal-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-semibold mb-1.5">
                  <span className="text-slate-800 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-700" />
                    {stat.district}
                    {selectedDistrict === stat.district && (
                      <span className="bg-teal-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <span className="text-slate-600 font-mono">
                    <strong className="text-teal-700 font-bold">{stat.allocated}</strong> / {stat.quota} ({stat.percentage}%)
                  </span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, stat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authorized Reference Short-Codes & Category Alignment (1 Column) */}
        <div className="space-y-6">
          {/* Reference Short-Codes Alignment Card (Strictly Aliased) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              Recommendation Reference Codes
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorized recommender aliases (no direct politician names recorded)
            </p>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PARTY_LABELS).slice(0, 8).map(([code, label]) => {
                const count = analytics.partyStats[code as RecommenderAlias] || candidates.filter(c => c.partyAffiliation === code || c.referenceCode === code).length;
                const style = PARTY_STYLES[code] || "bg-slate-50 text-slate-700 border-slate-200";
                return (
                  <div
                    key={code}
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] font-semibold ${style}`}
                  >
                    <span className="truncate pr-1">{code}</span>
                    <span className="font-mono font-bold text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Word Export Card — Dark Green Theme matching Dribbble */}
          <div className="bg-[#072418] rounded-2xl p-6 text-white shadow-lg border border-[#1b5e3f] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/15 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-[#10b981]" />
              Single-Click Export Engine
            </h3>
            <p className="text-xs text-emerald-200/80 mb-4 leading-relaxed">
              Export currently active {districtFilteredCandidates.length} staff records into clean Microsoft Word format with appointment numbers, father CNIC, and tehsil breakdown.
            </p>
            <button
              onClick={handleExportWord}
              className="w-full flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer hover:scale-[1.01]"
            >
              <FileText className="w-4 h-4 text-[#052e16]" />
              <span>Download Formatted Roster (.doc)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Hospital Director Appointments & Joining Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-700" />
              DHQ Hospital Staff Appointment & Joining Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Verified records with directive appointment numbers, joining order tracking, and Union Councils
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportWord}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              Export Roster
            </button>

            {canAllocateSeats && (
              <button
                onClick={() => onNavigateTab("allocation")}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                + Issue Directive Order
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Appt / Joining Ref</th>
                <th className="py-3 px-4">Staff Name & CNIC</th>
                <th className="py-3 px-4">Tehsil & Union Council</th>
                <th className="py-3 px-4">DHQ Assigned Role</th>
                <th className="py-3 px-4">Reference Code</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {districtFilteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                    No DHQ staff appointments match the selected role filter &quot;{selectedRoleFilter}&quot;.
                  </td>
                </tr>
              )}
              {districtFilteredAllocations.map((alloc) => {
                const storedCandidate = candidates.find(c => c.id === alloc.candidateId || c.cnic === alloc.candidateCnic);
                const candidate = storedCandidate ?? {
                  id: alloc.candidateId,
                  fullName: alloc.candidateName,
                  cnic: alloc.candidateCnic,
                  photoUrl: "",
                  tehsil: "",
                  unionCouncil: "",
                  referenceCode: alloc.partyAffiliation,
                  partyAffiliation: alloc.partyAffiliation,
                } as Candidate;
                const roleStyle = ROLE_STYLES[alloc.roleCategory] || "bg-slate-100 text-slate-800 border-slate-200";
                const refCode = candidate.referenceCode || alloc.partyAffiliation || "DIR-OFFICE";
                const refStyle = PARTY_STYLES[refCode] || "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <tr 
                    key={alloc.id} 
                    onClick={() => onSelectCandidate(candidate)}
                    className="hover:bg-teal-50/60 transition-colors cursor-pointer group"
                    title={`Click to view full dossier for ${alloc.candidateName}`}
                  >
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-teal-800 group-hover:text-teal-950">{alloc.appointmentRefNo}</div>
                      <div className="text-[10px] text-slate-500">{alloc.joiningOrderNo || "Joining Pending"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={candidate.photoUrl || "/images/cand_bilal.jpg"}
                          alt={alloc.candidateName}
                          onError={(e) => {
                            e.currentTarget.src = "/images/cand_bilal.jpg";
                          }}
                          className="w-8 h-8 rounded-full object-cover border border-teal-400/40 shadow-xs shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-teal-900">{alloc.candidateName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{alloc.candidateCnic}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{candidate.tehsil || alloc.district}</div>
                      <div className="text-[11px] text-teal-700 font-semibold">{candidate.unionCouncil || alloc.constituency}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${roleStyle}`}>
                        {alloc.roleCategory}
                      </span>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">{alloc.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${refStyle}`}>
                        {refCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {alloc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(candidate);
                        }}
                        className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer flex items-center gap-1 justify-end ml-auto group-hover:scale-105 transition-transform"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
