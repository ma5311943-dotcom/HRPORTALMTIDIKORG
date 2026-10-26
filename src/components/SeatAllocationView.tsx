"use client";

import React, { useState } from "react";
import { Candidate, District, Allocation, RoleCategory, DHQ_STAFF_ROLES } from "@/types";
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface SeatAllocationViewProps {
  candidates: Candidate[];
  districts: District[];
  allocations: Allocation[];
  onAllocationCreated: (newAlloc: Allocation) => void;
  onAllocationRevoked: (allocId: string) => void;
  onViewLetter: (alloc: Allocation) => void;
  canRevokeAllocations?: boolean;
  canAllocateSeats?: boolean;
  preSelectedCandidate?: Candidate | null;
  onClearPreSelectedCandidate?: () => void;
}

export default function SeatAllocationView({
  candidates,
  districts,
  allocations,
  onAllocationCreated,
  onAllocationRevoked,
  onViewLetter,
  canRevokeAllocations = true,
  canAllocateSeats = true,
  preSelectedCandidate,
  onClearPreSelectedCandidate,
}: SeatAllocationViewProps) {
  const [showAllocateModal, setShowAllocateModal] = useState<boolean>(
    Boolean(preSelectedCandidate) && canAllocateSeats
  );
  const [searchAllocQuery, setSearchAllocQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterDistrict, setFilterDistrict] = useState("All");

  // Allocation Form State
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    preSelectedCandidate?.id || ""
  );
  const [roleCategory, setRoleCategory] = useState<RoleCategory>("Ward Boy");
  const [roleTitle, setRoleTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [district, setDistrict] = useState<string>(preSelectedCandidate?.domicileDistrict || districts[0]?.name || "");
  const [constituency, setConstituency] = useState<string>(preSelectedCandidate?.constituency || "");
  const [tenureMonths, setTenureMonths] = useState<number>(24);
  const [allocatedBy, setAllocatedBy] = useState("");
  const [salaryOrStipend, setSalaryOrStipend] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revocation confirmation state
  const [revokeTarget, setRevokeTarget] = useState<Allocation | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  // Candidates available for allocation (excluding those already active)
  const availableCandidates = candidates.filter(
    (c) => c.status !== "Allocated" || c.id === selectedCandidateId
  );

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const closeAllocateModal = () => {
    setShowAllocateModal(false);
    onClearPreSelectedCandidate?.();
  };

  // When candidate changes, auto-fill district & constituency from their profile
  const handleCandidateSelect = (candId: string) => {
    setSelectedCandidateId(candId);
    const cand = candidates.find((c) => c.id === candId);
    if (cand) {
      setDistrict(cand.domicileDistrict);
      setConstituency(cand.constituency);
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      toast.error("Please select a candidate to allocate.");
      return;
    }

    if (!roleTitle) {
      toast.error("Please enter a specific Role Title / Designation.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        candidateId: selectedCandidateId,
        roleCategory,
        roleTitle,
        department,
        district,
        constituency,
        tenureMonths,
        allocatedBy,
        salaryOrStipend,
        remarks,
      };

      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to allocate position.");
      }

      onAllocationCreated(data.data);

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#047857", "#c5a059", "#34d399", "#ffffff"],
        });
      } catch {
        // Confetti is a non-critical enhancement.
      }

      toast.success("Position Allocated Successfully!", {
        description: `${data.data.candidateName} appointed as ${roleTitle} (${district}).`
      });

      closeAllocateModal();
      setRoleTitle("");
      setRemarks("");
      setSelectedCandidateId("");
    } catch (err: unknown) {
      toast.error("Allocation Blocked", {
        description: err instanceof Error ? err.message : "Unable to create the appointment."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = (allocId: string) => {
    const target = allocations.find((a) => a.id === allocId) || null;
    setRevokeTarget(target);
    setRevokeReason("");
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    if (revokeReason.trim().length < 3) {
      toast.error("Please provide a brief reason for revocation.");
      return;
    }

    setIsRevoking(true);
    try {
      const res = await fetch(`/api/allocations/${revokeTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", reason: revokeReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onAllocationRevoked(revokeTarget.id);
      toast.info("Appointment Revoked & Roster Updated", {
        description: "Candidate status has returned to Verified.",
      });
      setRevokeTarget(null);
      setRevokeReason("");
    } catch (err: unknown) {
      toast.error("Failed to revoke appointment", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredAllocations = allocations.filter((a) => {
    const matchesSearch =
      a.candidateName.toLowerCase().includes(searchAllocQuery.toLowerCase()) ||
      a.candidateCnic.includes(searchAllocQuery) ||
      a.roleTitle.toLowerCase().includes(searchAllocQuery.toLowerCase()) ||
      a.appointmentRefNo.toLowerCase().includes(searchAllocQuery.toLowerCase());

    const matchesRole = filterRole === "All" || a.roleCategory === filterRole;
    const matchesDistrict = filterDistrict === "All" || a.district === filterDistrict;

    return matchesSearch && matchesRole && matchesDistrict;
  });

  const selectedDistrictObj = districts.find((d) => d.name === district);

  return (
    <div className="space-y-6">
      {/* Top Header with Visual Staff Allocation Imagery */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-900/40 p-6 text-white shadow-lg">
        {/* Background Image with Light Green & Emerald Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/tab_seat_allocation.jpg"
            alt="Seat and Staff Allocation"
            className="h-full w-full object-cover object-center filter brightness-[0.70] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/85 via-emerald-950/70 to-slate-950/75" />
          <div className="absolute inset-0 bg-teal-950/20" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur-sm mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Hospital Director Executive Orders • Appointment Division</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-cyan-300" />
              DHQ Hospital Staff — Appointment &amp; Job Allocation
            </h2>
            <p className="text-xs text-teal-100/80 mt-1 max-w-xl">
              Issue verified appointment &amp; joining order numbers, allocate official DHQ designations, and enforce strict duplicate prevention.
            </p>
          </div>

          {canAllocateSeats && (
            <button
              onClick={() => setShowAllocateModal(true)}
              className="flex shrink-0 items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>+ Allocate Seat / Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Allocation Modal Form */}
      {showAllocateModal && canAllocateSeats && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={closeAllocateModal}
        >
          <div 
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 border-t-4 border-t-emerald-600 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">New Official Seat / Job Allocation</h3>
                <p className="text-[11px] text-slate-500">
                  Assign verified applicants to DHQ hospital staff positions
                </p>
              </div>
              <button
                onClick={closeAllocateModal}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
                aria-label="Close allocation form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs">
              {/* Select Candidate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Verified Candidate <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedCandidateId}
                  onChange={(e) => handleCandidateSelect(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                >
                  <option value="">-- Choose Candidate from Verified Roster --</option>
                  {availableCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} • CNIC: {c.cnic} • District: {c.domicileDistrict} ({c.partyAffiliation})
                    </option>
                  ))}
                </select>

                {selectedCandidate && (
                  <div className="mt-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-xs flex items-center gap-3">
                    <img
                      src={selectedCandidate.photoUrl}
                      alt={selectedCandidate.fullName}
                      onError={(e) => {
                        e.currentTarget.src = "/images/councilor_portrait.jpg";
                      }}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{selectedCandidate.fullName}</div>
                      <div className="text-slate-500 text-[11px]">
                        Party: <span className="font-bold text-emerald-700">{selectedCandidate.partyAffiliation}</span> • Domicile: {selectedCandidate.domicileDistrict} ({selectedCandidate.constituency})
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Role Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={roleCategory}
                    onChange={(e) => setRoleCategory(e.target.value as RoleCategory)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
                  >
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Designation / Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward Boy Grade-I / Senior Computer Operator"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department & Regional Alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Wing <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DHQ Teaching Hospital D.I. Khan"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Constituency
                  </label>
                  <select
                    value={constituency}
                    onChange={(e) => setConstituency(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-700"
                  >
                    {selectedDistrictObj?.constituencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tenure & Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tenure Duration (Months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stipend / Honorarium
                  </label>
                  <input
                    type="text"
                    value={salaryOrStipend}
                    onChange={(e) => setSalaryOrStipend(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issuing Authority <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. District Selection Board"
                    value={allocatedBy}
                    onChange={(e) => setAllocatedBy(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Official Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add merit notes, notification particulars, or selection-board observations..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Duplicate Prevention Guard Notice */}
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Anti-Duplication Enforcement:</strong> The system automatically blocks duplicate assignments for candidates with active roles, ensuring transparent and equitable constituency distribution.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeAllocateModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Issuing Gazette..." : "Issue Official Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search appointments by Appointee, Ref No., CNIC, or Role Title..."
              value={searchAllocQuery}
              onChange={(e) => setSearchAllocQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
            >
              <option value="All">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
            >
              <option value="All">All Staff Roles</option>
              {DHQ_STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
          <table className="w-full min-w-[760px] lg:min-w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-2.5 sm:px-3">Ref Number</th>
                <th className="py-2.5 px-2.5 sm:px-3">Appointee Details</th>
                <th className="py-2.5 px-2.5 sm:px-3">Role & Category</th>
                <th className="py-2.5 px-2.5 sm:px-3">District / Seat</th>
                <th className="py-2.5 px-2.5 sm:px-3 hidden xl:table-cell">Issuing Authority</th>
                <th className="py-2.5 px-2.5 sm:px-3">Status</th>
                <th className="py-2.5 px-2.5 sm:px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                    No appointment records match the selected search and filters.
                  </td>
                </tr>
              )}
              {filteredAllocations.map((alloc) => {
                const cand = candidates.find((c) => c.id === alloc.candidateId);
                return (
                  <tr key={alloc.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-2.5 sm:px-3 font-mono font-bold text-emerald-700 text-[11px] whitespace-nowrap">
                      {alloc.appointmentRefNo}
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={cand?.photoUrl || "/images/cand_hamza.jpg"}
                          alt={alloc.candidateName}
                          onError={(e) => {
                            e.currentTarget.src = "/images/councilor_portrait.jpg";
                          }}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-[150px]">{alloc.candidateName}</div>
                          <div className="text-[10px] font-mono text-slate-500 truncate max-w-[170px]">
                            {alloc.candidateCnic} • <span className="font-semibold text-emerald-800">{alloc.partyAffiliation}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3">
                      <div className="font-semibold text-slate-900 text-[11px] leading-tight">{alloc.roleTitle}</div>
                      <span className="inline-block mt-0.5 text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold border border-slate-200">
                        {alloc.roleCategory}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-[11px]">{alloc.district}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">{alloc.constituency}</div>
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3 hidden xl:table-cell">
                      <div className="text-slate-800 text-[11px] truncate max-w-[170px]">{alloc.allocatedBy}</div>
                      <div className="text-[10px] text-slate-400">Date: {alloc.allocatedDate}</div>
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          alloc.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {alloc.status === "Active" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        {alloc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewLetter(alloc)}
                          title="View Official Gazette Notification"
                          className="text-emerald-700 hover:text-[#064e3b] font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Gazette</span>
                        </button>

                        {alloc.status === "Active" && canRevokeAllocations && (
                          <button
                            onClick={() => handleRevoke(alloc.id)}
                            title="Revoke Appointment"
                            className="text-red-500 hover:text-red-700 text-[10px] font-semibold cursor-pointer ml-1"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => {
              if (!isRevoking) setRevokeTarget(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="revoke-title" className="text-sm font-bold text-slate-900">
                    Revoke appointment?
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    This action returns the candidate to the verified merit pool.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                disabled={isRevoking}
                aria-label="Close revocation dialog"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="font-bold text-slate-900">{revokeTarget.candidateName}</div>
                <div className="mt-0.5 text-slate-600">{revokeTarget.roleTitle}</div>
                <div className="mt-1 font-mono text-[10px] text-slate-500">
                  {revokeTarget.appointmentRefNo} • {revokeTarget.district} ({revokeTarget.constituency})
                </div>
              </div>

              <div>
                <label htmlFor="revoke-reason" className="mb-1 block text-xs font-semibold text-slate-700">
                  Reason for revocation <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="revoke-reason"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  maxLength={240}
                  autoFocus
                  placeholder="e.g. Tenure completed, resignation, or administrative transfer"
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {["Tenure completed", "Resignation", "Administrative transfer"].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRevokeReason(reason)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-800"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                disabled={isRevoking}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmRevoke()}
                disabled={isRevoking}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {isRevoking ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
