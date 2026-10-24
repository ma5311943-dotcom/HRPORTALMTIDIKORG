"use client";

import React, { useMemo } from "react";
import { SystemAnalytics, Candidate, Allocation, RoleCategory, PoliticalParty } from "@/types";
import { 
  Users, 
  CheckCircle2, 
  MapPin, 
  Award, 
  FileCheck, 
  ChevronRight, 
  Sparkles, 
  Building,
  Flag,
  Share2
} from "lucide-react";
import { toast } from "sonner";

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

  // Current scope calculations
  const districtFilteredAllocations = useMemo(() => {
    if (selectedDistrict === "All") return allocations;
    return allocations.filter(a => a.district.toLowerCase() === selectedDistrict.toLowerCase());
  }, [allocations, selectedDistrict]);

  const activeAllocationsCount = useMemo(() => {
    return districtFilteredAllocations.filter(a => a.status === "Active").length;
  }, [districtFilteredAllocations]);

  const districtFilteredCandidates = useMemo(() => {
    if (selectedDistrict === "All") return candidates;
    return candidates.filter(c => c.domicileDistrict.toLowerCase() === selectedDistrict.toLowerCase());
  }, [candidates, selectedDistrict]);

  const verifiedCandidatesCount = useMemo(() => {
    return districtFilteredCandidates.filter(c => c.status === "Verified" || c.status === "Allocated").length;
  }, [districtFilteredCandidates]);

  const verificationRatio = useMemo(() => {
    if (districtFilteredCandidates.length === 0) return 0;
    return Math.round((verifiedCandidatesCount / districtFilteredCandidates.length) * 100);
  }, [districtFilteredCandidates, verifiedCandidatesCount]);

  const handleShareStat = () => {
    const text = selectedDistrict === "All"
      ? `Internal HR System National Report: ${analytics.totalAllocated} verified constituency positions and public jobs have been allocated across Pakistan.`
      : `Internal HR System District Report: ${activeAllocationsCount} citizens have been appointed to constituency roles in District ${selectedDistrict}.`;

    navigator.clipboard.writeText(text);
    toast.success("Constituency Achievement copied to clipboard!", {
      description: text,
    });
  };

  const roleColors: Record<RoleCategory, string> = {
    "MNA": "bg-purple-100 text-purple-800 border-purple-300",
    "MPA": "bg-indigo-100 text-indigo-800 border-indigo-300",
    "District Chairperson": "bg-emerald-100 text-emerald-800 border-emerald-300",
    "Union Council Chairman": "bg-green-100 text-green-800 border-green-300",
    "Councilor": "bg-teal-100 text-teal-800 border-teal-300",
    "Civil Administration Officer": "bg-blue-100 text-blue-800 border-blue-300",
    "Committee Head": "bg-amber-100 text-amber-800 border-amber-300",
    "Public Sector Staff": "bg-slate-100 text-slate-800 border-slate-300",
  };

  const partyBadges: Record<PoliticalParty, { bg: string; text: string }> = {
    "PTI": { bg: "bg-red-50 text-red-700 border-red-200", text: "PTI" },
    "PMLN": { bg: "bg-green-50 text-emerald-800 border-emerald-200", text: "PML-N" },
    "PPP": { bg: "bg-rose-50 text-rose-800 border-rose-200", text: "PPP" },
    "JUI-F": { bg: "bg-amber-50 text-amber-800 border-amber-200", text: "JUI-F" },
    "MQM-P": { bg: "bg-orange-50 text-orange-800 border-orange-200", text: "MQM-P" },
    "JI": { bg: "bg-teal-50 text-teal-800 border-teal-200", text: "JI" },
    "ANP": { bg: "bg-red-100 text-red-900 border-red-300", text: "ANP" },
    "TLP": { bg: "bg-emerald-100 text-emerald-900 border-emerald-300", text: "TLP" },
    "Independent": { bg: "bg-slate-100 text-slate-700 border-slate-300", text: "Independent" },
  };

  return (
    <div className="space-y-6">
      {/* Election Victory & Campaign Service Showcase Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-7 shadow-sm border border-slate-200">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-50 blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-300" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Election-Ready Public Service Tally</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {selectedDistrict === "All" ? (
                <span>
                  Delivering Public Employment & Leadership:{" "}
                  <span className="text-emerald-700">
                    {analytics.totalAllocated} Appointments
                  </span>{" "}
                  Nationwide
                </span>
              ) : (
                <span>
                  District {selectedDistrict}:{" "}
                  <span className="text-emerald-700">
                    {activeAllocationsCount} Citizens
                  </span>{" "}
                  Appointed to Public Roles
                </span>
              )}
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">
              Transparent, merit-verified record of community leaders, councilors, civil administration liaisons, and public sector employment across all union councils.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleShareStat}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Copy Public Statement</span>
            </button>

            {canGenerateReports && (
              <button
                onClick={() => onNavigateTab("reports")}
                className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {selectedDistrict === "All" ? "Total Registered" : `Registered (${selectedDistrict})`}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {districtFilteredCandidates.length}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-700 font-bold">{verifiedCandidatesCount} verified</span> on NADRA protocol
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Allocations
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {activeAllocationsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-700 font-bold">Gazette Notified</span> & Active
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Regional Districts
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {analytics.totalDistricts} Districts
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              Across Punjab, Sindh, KPK, Balochistan & ICT
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Credential Verification
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {verificationRatio}%
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              Matric & FSc Academic Authenticated
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Quota & Regional Distribution (Spans 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-700" />
                District-Wise Job & Seat Quota Execution
              </h3>
              <p className="text-xs text-slate-500">
                Tracking assigned constituency hires against authorized regional thresholds
              </p>
            </div>

            {canAllocateSeats && (
              <button
                onClick={() => onNavigateTab("allocation")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>Manage Allocations</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* District Bars */}
          <div className="mt-5 space-y-4">
            {analytics.districtStats.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                No district quota data available for this scope.
              </p>
            )}
            {analytics.districtStats.map((stat) => (
              <div 
                key={stat.district} 
                onClick={() => setSelectedDistrict(stat.district)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedDistrict === stat.district 
                    ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200" 
                    : "bg-slate-50/70 hover:bg-white border-slate-200 hover:border-emerald-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-semibold mb-1.5">
                  <span className="text-slate-800 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    District {stat.district}
                    {selectedDistrict === stat.district && (
                      <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <span className="text-slate-600 font-mono">
                    <strong className="text-emerald-700 font-bold">{stat.allocated}</strong> / {stat.quota} ({stat.percentage}%)
                  </span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Category Breakdown & Political Alignment (1 Column) */}
        <div className="space-y-6">
          {/* Role Distribution Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-[#c5a059]" />
              Role Category Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Breakdown of leadership and administrative roles
            </p>

            <div className="space-y-2.5">
              {Object.keys(analytics.roleStats).length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
                  No role allocations recorded yet.
                </p>
              )}
              {(Object.keys(analytics.roleStats) as RoleCategory[]).map((role) => {
                const count = analytics.roleStats[role];
                return (
                  <div key={role} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none">
                    <span className="text-slate-700 font-medium truncate pr-2">
                      {role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${roleColors[role]}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Political Party Alignment Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Flag className="w-5 h-5 text-emerald-700" />
              Political Party Affiliations
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registered candidate roster by political alignment
            </p>

            <div className="grid grid-cols-2 gap-2">
              {Object.keys(analytics.partyStats).length === 0 && (
                <p className="col-span-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
                  No party affiliation data recorded yet.
                </p>
              )}
              {(Object.keys(analytics.partyStats) as PoliticalParty[]).map((party) => {
                const count = analytics.partyStats[party];
                const badge = partyBadges[party] || { bg: "bg-slate-50 text-slate-700 border-slate-200", text: party };
                return (
                  <div
                    key={party}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold ${badge.bg}`}
                  >
                    <span>{badge.text}</span>
                    <span className="font-mono font-bold text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Allocations Gazette Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              Recent Gazette Allocations & Appointments
            </h3>
            <p className="text-xs text-slate-500">
              Verified record-keeping to prevent duplicate job assignments per district
            </p>
          </div>

          {canAllocateSeats && (
            <button
              onClick={() => onNavigateTab("allocation")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer self-start sm:self-auto"
            >
              + New Appointment
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Ref No.</th>
                <th className="py-3 px-4">Candidate & CNIC</th>
                <th className="py-3 px-4">District / Seat</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Party</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {districtFilteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                    No Gazette allocations recorded for this scope yet.
                  </td>
                </tr>
              )}
              {districtFilteredAllocations.slice(0, 6).map((alloc) => {
                const candidate = candidates.find(c => c.id === alloc.candidateId);
                const partyBadge = partyBadges[alloc.partyAffiliation] || { bg: "bg-slate-100 text-slate-700 border-slate-200", text: alloc.partyAffiliation };
                return (
                  <tr key={alloc.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {alloc.appointmentRefNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={candidate?.photoUrl || "/images/cand_hamza.jpg"}
                          alt={alloc.candidateName}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-400/30 shadow-2xs shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{alloc.candidateName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{alloc.candidateCnic}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{alloc.district}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">{alloc.constituency}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{alloc.roleTitle}</div>
                      <div className="text-[11px] text-slate-500">{alloc.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${partyBadge.bg}`}>
                        {partyBadge.text}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {alloc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {candidate && (
                        <button
                          onClick={() => onSelectCandidate(candidate)}
                          className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                        >
                          View Dossier
                        </button>
                      )}
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

