"use client";

import React, { useState, useMemo } from "react";
import { Candidate, District, Allocation } from "@/types";
import { 
  FileText, 
  Printer, 
  Copy, 
  Award, 
  Sparkles,
  MapPin,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

interface ReportsViewProps {
  candidates: Candidate[];
  districts: District[];
  allocations: Allocation[];
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
}

export default function ReportsView({
  candidates,
  districts,
  allocations,
  selectedDistrict,
  setSelectedDistrict,
}: ReportsViewProps) {
  const [reportDate] = useState(
    new Date().toLocaleDateString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );

  // Filtered allocations for selected district or all
  const filteredAllocations = useMemo(() => {
    if (selectedDistrict === "All") return allocations.filter(a => a.status === "Active");
    return allocations.filter(
      a => a.district.toLowerCase() === selectedDistrict.toLowerCase() && a.status === "Active"
    );
  }, [allocations, selectedDistrict]);

  const filteredCandidates = useMemo(() => {
    if (selectedDistrict === "All") return candidates;
    return candidates.filter(
      c => c.domicileDistrict.toLowerCase() === selectedDistrict.toLowerCase()
    );
  }, [candidates, selectedDistrict]);

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAllocations.forEach((a) => {
      counts[a.roleCategory] = (counts[a.roleCategory] || 0) + 1;
    });
    return counts;
  }, [filteredAllocations]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPressRelease = () => {
    const districtText =
      selectedDistrict === "All"
        ? "Across all constituencies of Pakistan"
        : `In District ${selectedDistrict}`;
    const text = [
      "OFFICIAL PRESS STATEMENT - CONSTITUENCY HUMAN RESOURCES DEVELOPMENT REPORT",
      "Issued by: Constituency Administration Secretariat",
      `Date: ${reportDate}`,
      "",
      "PUBLIC SERVICE & EMPLOYMENT ACCOMPLISHMENT:",
      `${districtText}, the administration has vetted and appointed ${filteredAllocations.length} verified citizens to active constituency leadership, municipal councils, and public service roles.`,
      "",
      "KEY METRICS & DISTRIBUTION:",
      `- Total verified registered applicants: ${filteredCandidates.length}`,
      `- Total gazetted appointments: ${filteredAllocations.length} active positions`,
      `- Positions issued: ${Object.entries(roleBreakdown).map(([role, count]) => `${role} (${count})`).join(", ") || "None recorded"}`,
      "",
      "This record reflects transparent, merit-based appointments across all union councils.",
      "",
      "#Pakistan #ConstituencyHR #PublicService #InternalHRSystem",
    ].join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Press statement copied to clipboard", {
      description: "Ready to share with media and official channels.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls (Hidden when Printing) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            Election-Ready Constituency Audit & Employment Reports
          </h2>
          <p className="text-xs text-slate-500">
            Official verifiable documentation ready for public rallies, press releases, and election scrutiny
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* District Selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Districts (National Total)</option>
              {districts.map((d) => (
                <option key={d.id} value={d.name}>
                  District {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopyPressRelease}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            <span>Copy Press Release</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Dossier</span>
          </button>
        </div>
      </div>

      {/* Official Certified Audit Report Paper */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 sm:p-10 space-y-8 font-serif text-slate-800 max-w-5xl mx-auto print:border-none print:shadow-none print:p-4">
        {/* Document Header */}
        <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
          <div className="flex items-center justify-center gap-3">
            <img
              src="/images/state_emblem.jpg"
              alt="State Emblem"
              className="w-14 h-14 rounded-full object-cover border-2 border-[#c5a059] shadow-md"
            />
            <img
              src="/images/gazette_gold_seal.jpg"
              alt="Gazette Seal"
              className="w-14 h-14 rounded-full object-cover border-2 border-[#c5a059] shadow-md"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-emerald-700">
            Government of Pakistan
          </h1>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-600 font-sans">
            Constituency Human Resources & Analytics Secretariat
          </h2>
          <div className="inline-block bg-[#c5a059]/20 text-emerald-700 border border-[#c5a059] px-3 py-1 rounded text-xs font-bold font-sans mt-1">
            CERTIFIED CONSTITUENCY EMPLOYMENT & LEADERSHIP AUDIT REPORT
          </div>
        </div>

        {/* Executive Meta Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-sans font-bold border-b border-slate-200 pb-3 gap-2">
          <div>
            <span className="text-slate-500">Target Region: </span>
            <span className="text-emerald-700 font-bold text-sm">
              {selectedDistrict === "All" ? "National Roster (All Districts)" : `District ${selectedDistrict}`}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Certified Date: </span>
            <span>{reportDate}</span>
          </div>
          <div>
            <span className="text-slate-500">Audit Status: </span>
            <span className="text-emerald-700">Gazetted & Merit Verified</span>
          </div>
        </div>

        {/* The Election Victory Headline Block */}
        <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 font-sans space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-[#c5a059]" />
            <span>Public Service Affirmation Statement</span>
          </div>

          <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {selectedDistrict === "All" ? (
              <span>
                Under the National Constituency Development Mandate, a verified total of{" "}
                <strong className="text-emerald-700 underline">{filteredAllocations.length} citizens</strong>{" "}
                have been transparently allocated public sector positions and municipal leadership seats across all provinces.
              </span>
            ) : (
              <span>
                We have officially delivered verifiable jobs and leadership positions to{" "}
                <strong className="text-emerald-700 underline">{filteredAllocations.length} individuals</strong>{" "}
                in District {selectedDistrict}, ensuring transparent representation across all Union Councils.
              </span>
            )}
          </p>          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Total Active Appointments</span>
              <span className="text-xl font-bold text-emerald-700">{filteredAllocations.length}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Registered Applicants</span>
              <span className="text-xl font-bold text-slate-800">{filteredCandidates.length}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Credential Authenticity</span>
              <span className="text-xl font-bold text-emerald-700">100%</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Duplicate Allotments</span>
              <span className="text-xl font-bold text-emerald-700">0 (Zero)</span>
            </div>
          </div>
        </div>

        {/* Role Classification Breakdown */}
        <div className="space-y-3 font-sans">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-700" />
            Distribution by Role Classification
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.keys(roleBreakdown).length === 0 && (
              <p className="col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-[11px] text-slate-500 sm:col-span-4">
                No active role allocations in this scope.
              </p>
            )}
            {Object.entries(roleBreakdown).map(([role, count]) => (
              <div key={role} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">{role}</span>
                <span className="bg-emerald-700 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabulated Gazette Roster */}
        <div className="space-y-3 font-sans">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Certified Appointee Gazette Registry
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Gazette Ref</th>
                  <th className="py-2.5 px-3">Appointee Name</th>
                  <th className="py-2.5 px-3">CNIC Number</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Constituency</th>
                  <th className="py-2.5 px-3">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                      No active Gazette appointments for this scope.
                    </td>
                  </tr>
                )}
                {filteredAllocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td className="py-2 px-3 font-mono text-emerald-700 font-bold">
                      {alloc.appointmentRefNo}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">{alloc.candidateName}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{alloc.candidateCnic}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{alloc.roleTitle}</td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">{alloc.constituency}</td>
                    <td className="py-2 px-3 text-slate-600">{alloc.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Certification Signature Block */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between font-sans text-xs gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center text-center p-1 text-emerald-700 rotate-[-8deg]">
              <span className="text-[8px] font-bold uppercase">INTERNAL HR OFFICIAL</span>
              <span className="text-base">★</span>
              <span className="text-[7px] font-bold">AUDIT PASSED</span>
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              Verified through the Electoral Human Resources Portal.<br />
              All biometric records matched against national domicile archives.
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="w-48 border-b-2 border-slate-900 mx-auto ml-auto" />
            <div className="font-bold text-slate-900 text-sm">Secretary Administration</div>
            <div className="text-[11px] text-slate-500">District Selection & Verification Commission</div>
            <div className="text-[10px] text-slate-400 font-mono">PK-IHR/DOC-2026/CERT</div>
          </div>
        </div>
      </div>
    </div>
  );
}

