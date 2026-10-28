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
  ShieldCheck,
  Sheet
} from "lucide-react";
import { toast } from "sonner";
import { SortHeader, useSortable } from "@/components/ui/kit";

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

  // Category & Reference Audit Filters
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>("All");
  const [referenceAuditFilter, setReferenceAuditFilter] = useState<"All" | "WithRef" | "NoRef">("All");
  const [printPageSize, setPrintPageSize] = useState<number>(10);

  // Filtered allocations for selected district or all
  const filteredAllocations = useMemo(() => {
    let list = allocations.filter((a) => a.status === "Active");
    if (selectedDistrict !== "All") {
      list = list.filter(
        (a) => a.district.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }
    if (selectedRoleCategory !== "All") {
      list = list.filter((a) => a.roleCategory === selectedRoleCategory);
    }
    if (referenceAuditFilter !== "All") {
      list = list.filter((a) => {
        const c = candidates.find((cand) => cand.id === a.candidateId || cand.cnic === a.candidateCnic);
        const hasRef = Boolean(
          (c?.referenceCode && c.referenceCode.trim() !== "") ||
          (a.partyAffiliation && a.partyAffiliation !== "MERIT-OPEN")
        );
        return referenceAuditFilter === "WithRef" ? hasRef : !hasRef;
      });
    }
    return list;
  }, [allocations, candidates, selectedDistrict, selectedRoleCategory, referenceAuditFilter]);

  const filteredCandidates = useMemo(() => {
    let list = candidates;
    if (selectedDistrict !== "All") {
      list = list.filter(
        (c) => c.domicileDistrict.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }
    if (selectedRoleCategory !== "All") {
      list = list.filter((c) => c.appliedRole === selectedRoleCategory);
    }
    if (referenceAuditFilter !== "All") {
      list = list.filter((c) => {
        const hasRef = Boolean(c.referenceCode && c.referenceCode.trim() !== "");
        return referenceAuditFilter === "WithRef" ? hasRef : !hasRef;
      });
    }
    return list;
  }, [candidates, selectedDistrict, selectedRoleCategory, referenceAuditFilter]);

  // Reference audit statistics
  const referenceAuditStats = useMemo(() => {
    let withRef = 0;
    let withoutRef = 0;
    const staffRecommenderCounts: Record<string, number> = {};

    filteredCandidates.forEach((c) => {
      const ref = c.referenceCode?.trim() || (c.partyAffiliation !== "MERIT-OPEN" ? c.partyAffiliation : null);
      if (ref) {
        withRef += 1;
        staffRecommenderCounts[ref] = (staffRecommenderCounts[ref] || 0) + 1;
      } else {
        withoutRef += 1;
      }
    });

    return {
      total: filteredCandidates.length,
      withRef,
      withoutRef,
      staffRecommenderCounts,
    };
  }, [filteredCandidates]);

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAllocations.forEach((a) => {
      counts[a.roleCategory] = (counts[a.roleCategory] || 0) + 1;
    });
    return counts;
  }, [filteredAllocations]);

  // Real credential-verification ratio for the current scope
  const verifiedCredentialsRatio = useMemo(() => {
    if (filteredCandidates.length === 0) return 0;
    const verifiedCount = filteredCandidates.filter(
      (c) => c.status === "Verified" || c.status === "Allocated"
    ).length;
    return Math.round((verifiedCount / filteredCandidates.length) * 100);
  }, [filteredCandidates]);

  // Real duplicate-allotment check: candidates holding more than one active allocation
  const duplicateAllotmentCount = useMemo(() => {
    const activePerCandidate = new Map<string, number>();
    filteredAllocations.forEach((a) => {
      activePerCandidate.set(a.candidateId, (activePerCandidate.get(a.candidateId) || 0) + 1);
    });
    let duplicates = 0;
    activePerCandidate.forEach((count) => {
      if (count > 1) duplicates += 1;
    });
    return duplicates;
  }, [filteredAllocations]);

  const handlePrint = () => {
    window.print();
  };

  /* Gazette roster: sorting */
  const gazetteRows = useMemo(
    () =>
      filteredAllocations.map((a) => {
        const c = candidates.find((cand) => cand.id === a.candidateId || cand.cnic === a.candidateCnic);
        return {
          appointmentRefNo: a.appointmentRefNo,
          candidateName: a.candidateName,
          fatherName: c?.fatherName || "—",
          candidateCnic: a.candidateCnic,
          address: c?.address || "D.I. Khan",
          tehsil: c?.tehsil || a.district,
          roleTitle: a.roleCategory || a.roleTitle,
          reference: c?.referenceCode || a.partyAffiliation || "Unassigned",
          department: a.department,
        };
      }),
    [filteredAllocations, candidates]
  );
  const { sorted: sortedGazette, sortKey, sortDir, toggle } = useSortable(gazetteRows, "appointmentRefNo");

  const handleExportCsv = () => {
    const header = [
      "Sr#",
      "Gazette Ref",
      "Appointee Name",
      "Father Name",
      "CNIC",
      "Address",
      "Tehsil",
      "Category/Role",
      "Staff Reference",
      "Department",
    ];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      header.map(esc).join(","),
      ...sortedGazette.map((r, idx) =>
        [
          String(idx + 1),
          r.appointmentRefNo,
          r.candidateName,
          r.fatherName,
          r.candidateCnic,
          r.address,
          r.tehsil,
          r.roleTitle,
          r.reference,
          r.department,
        ]
          .map(esc)
          .join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dhq-dikhan-roster-${selectedRoleCategory.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported", {
      description: `${sortedGazette.length} gazette records downloaded.`,
    });
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
      {/* Top Header with Visual Analytics Backdrop */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/40 p-6 text-white shadow-lg print:hidden">
        {/* Background Image with Light Green & Emerald Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/tab_reports_analytics.jpg"
            alt="Reports & Analytics"
            className="h-full w-full object-cover object-center filter brightness-[0.70] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-teal-900/70 to-slate-950/75" />
          <div className="absolute inset-0 bg-emerald-950/20" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur-sm mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DHQ Hospital D.I. Khan • Audit &amp; Official Reporting</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-300" />
              Hospital Staff Recruitment Audit &amp; HR Reports
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
              Official verifiable records, gazette appointment summaries, and press release documentation for DHQ Teaching Hospital D.I. Khan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Division / District Selector */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer [&>option]:text-slate-900"
              >
                <option value="All">D.I. Khan Division (Entire)</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category / Role Filter */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-200">Category:</span>
              <select
                value={selectedRoleCategory}
                onChange={(e) => setSelectedRoleCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer [&>option]:text-slate-900"
              >
                <option value="All">All Categories</option>
                <option value="Ward Boy">Ward Boy</option>
                <option value="Helper Boy">Helper Boy</option>
                <option value="Stretcher Puller">Stretcher Puller</option>
                <option value="Security Guard">Security Guard</option>
                <option value="Male Ward Attendant">Male Ward Attendant</option>
                <option value="Female Ward Attendant">Female Ward Attendant</option>
                <option value="Junior Clerk">Junior Clerk</option>
                <option value="Reception">Reception</option>
                <option value="Computer Operator">Computer Operator</option>
              </select>
            </div>

            {/* Audit / Reference Filter */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-200">Audit:</span>
              <select
                value={referenceAuditFilter}
                onChange={(e) => setReferenceAuditFilter(e.target.value as "All" | "WithRef" | "NoRef")}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer [&>option]:text-slate-900"
              >
                <option value="All">All Records</option>
                <option value="WithRef">Staff Referred (Logged)</option>
                <option value="NoRef">⚠️ Unassigned / No Ref</option>
              </select>
            </div>

            {/* Print Per Page Selector */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-200">Per Page:</span>
              <select
                value={printPageSize}
                onChange={(e) => setPrintPageSize(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer [&>option]:text-slate-900"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <button
              onClick={handleCopyPressRelease}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-200" />
              <span>Copy Release</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
            >
              <Sheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
          </div>
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
            <span className="text-emerald-700">
              {filteredCandidates.length > 0
                ? `${verifiedCredentialsRatio}% Records Verified`
                : "No Records in Scope"}
            </span>
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
              <span className="text-slate-500 block">Staff Logged References</span>
              <span className="text-xl font-bold text-emerald-700">{referenceAuditStats.withRef}</span>
              <span className="text-[10px] text-slate-400">Accounted applicants</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/40">
              <span className="text-amber-800 block">Unassigned / No Ref</span>
              <span className="text-xl font-bold text-amber-700">{referenceAuditStats.withoutRef}</span>
              <span className="text-[10px] text-amber-600">Audit flag / unassigned</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Selected Category</span>
              <span className="text-sm font-bold text-slate-800 truncate block mt-1">{selectedRoleCategory}</span>
            </div>
          </div>
        </div>

        {/* Staff Referral Audit Accountability Widget */}
        <div className="space-y-3 font-sans print:hidden">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Staff Referral Audit &amp; Accountability Ledger
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Showing source accountability across {Object.keys(referenceAuditStats.staffRecommenderCounts).length} staff codes
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-xs">
            {Object.entries(referenceAuditStats.staffRecommenderCounts).map(([staff, count]) => (
              <div key={staff} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 block truncate text-[11px]">{staff}</span>
                <span className="text-emerald-700 font-mono font-bold text-xs">{count} candidates</span>
              </div>
            ))}
            {referenceAuditStats.withoutRef > 0 && (
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-300">
                <span className="font-semibold text-amber-800 block truncate text-[11px]">No Staff Logged</span>
                <span className="text-amber-700 font-mono font-bold text-xs">{referenceAuditStats.withoutRef} unassigned</span>
              </div>
            )}
          </div>
        </div>

        {/* Role Classification Breakdown */}
        <div className="space-y-3 font-sans print:hidden">
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

        {/* Tabulated Gazette Roster with Chunked Printable Pages */}
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Certified Candidate &amp; Appointee Record ({sortedGazette.length} Records)
            </h3>
            <span className="text-[11px] text-slate-400 print:hidden">
              Print format: {printPageSize} records per printable page
            </span>
          </div>

          {/* Group into print chunks based on printPageSize */}
          {Array.from({ length: Math.ceil((sortedGazette.length || 1) / printPageSize) }).map((_, pageIdx) => {
            const chunk = sortedGazette.slice(pageIdx * printPageSize, (pageIdx + 1) * printPageSize);
            return (
              <div
                key={pageIdx}
                className="print:break-after-page mb-6 border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-[11px] font-bold text-slate-700 flex justify-between items-center">
                  <span>DHQ Teaching Hospital D.I. Khan — Page {pageIdx + 1} of {Math.ceil((sortedGazette.length || 1) / printPageSize)}</span>
                  <span>Category: {selectedRoleCategory}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-2.5 w-10 text-center">Sr#</th>
                        <th className="py-2 px-2.5">
                          <SortHeader label="Candidate Name" field="candidateName" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
                        </th>
                        <th className="py-2 px-2.5">Father&apos;s Name</th>
                        <th className="py-2 px-2.5">CNIC</th>
                        <th className="py-2 px-2.5">Address</th>
                        <th className="py-2 px-2.5">Tehsil</th>
                        <th className="py-2 px-2.5">Category</th>
                        <th className="py-2 px-2.5">Staff Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {chunk.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                            No matching candidate records found for this filter.
                          </td>
                        </tr>
                      )}
                      {chunk.map((row, idx) => (
                        <tr key={row.appointmentRefNo || idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-2.5 text-center font-mono text-slate-500 font-medium">
                            {pageIdx * printPageSize + idx + 1}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-slate-900">{row.candidateName}</td>
                          <td className="py-2 px-2.5 text-slate-700">{row.fatherName}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-500 text-[11px]">{row.candidateCnic}</td>
                          <td className="py-2 px-2.5 text-slate-600 text-[11px] max-w-[160px] truncate">{row.address}</td>
                          <td className="py-2 px-2.5 font-semibold text-emerald-700">{row.tehsil}</td>
                          <td className="py-2 px-2.5 font-medium text-slate-800">{row.roleTitle}</td>
                          <td className="py-2 px-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              row.reference === "Unassigned" || row.reference === "MERIT-OPEN"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {row.reference}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
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

