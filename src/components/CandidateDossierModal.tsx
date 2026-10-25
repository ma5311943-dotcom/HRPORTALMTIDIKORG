"use client";

import React from "react";
import { toast } from "sonner";
import { Candidate, Allocation } from "@/types";
import { 
  X, 
  Award, 
  GraduationCap, 
  MapPin, 
  Phone, 
  FileCheck, 
  ShieldCheck, 
  Building
} from "lucide-react";

interface CandidateDossierModalProps {
  candidate: Candidate | null;
  allocation?: Allocation;
  onClose: () => void;
  onAllocate?: (candidate: Candidate) => void;
}

export default function CandidateDossierModal({
  candidate,
  allocation,
  onClose,
  onAllocate,
}: CandidateDossierModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!candidate) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-dossier-title"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Candidate Header */}
        <div className="bg-white p-4 sm:p-5 relative border-b border-slate-200 border-t-4 border-t-emerald-600 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            {/* Candidate Photo */}
            <div className="relative shrink-0">
              <img
                src={candidate.photoUrl || "/images/cand_hamza.jpg"}
                alt={candidate.fullName}
                onError={(e) => {
                  e.currentTarget.src = "/images/councilor_portrait.jpg";
                }}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-slate-200 shadow-sm bg-slate-100"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 id="candidate-dossier-title" className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {candidate.fullName}
                </h3>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  {candidate.partyAffiliation}
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {candidate.status}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-mono">
                CNIC: {candidate.cnic} • S/D/W of {candidate.fatherName}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {candidate.constituency} ({candidate.domicileDistrict})
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {candidate.phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs">
          {/* Active Job Allocation Record (If Allocated) */}
          {allocation && (
            <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                  <Award className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Current Official Appointment</span>
                </div>
                <span className="font-mono text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded">
                  {allocation.appointmentRefNo}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Role Designation</span>
                  <span className="font-bold text-slate-900">{allocation.roleTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Department / Board</span>
                  <span className="font-semibold text-slate-800">{allocation.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Honorarium / Stipend</span>
                  <span className="font-bold text-emerald-700">{allocation.salaryOrStipend || "Gov Allowance"}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Issuing Authority</span>
                  <span className="font-semibold text-slate-800">{allocation.allocatedBy}</span>
                </div>
              </div>
            </div>
          )}

          {/* Regional Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider flex items-center gap-1">
              <Building className="w-3 h-3 text-emerald-600" />
              Regional & Domicile Alignment
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Domicile District</span>
                <span className="font-bold text-slate-800">{candidate.domicileDistrict}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Constituency</span>
                <span className="font-bold text-emerald-700">{candidate.constituency}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Tehsil</span>
                <span className="font-bold text-slate-800">{candidate.tehsil || "Urban"}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Union Council</span>
                <span className="font-bold text-slate-800">{candidate.unionCouncil || "General"}</span>
              </div>
              <div className="col-span-2 sm:col-span-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Residential Address</span>
                <span className="font-medium text-slate-800">{candidate.address}</span>
              </div>
            </div>
          </div>

          {/* Academic Credentials */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              Academic Credentials & Proof Records
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Matriculation */}
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 mb-1">
                  <span className="font-bold text-slate-800 text-[11px]">Matriculation (SSC)</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div><strong>Board:</strong> {candidate.matricDetails.board}</div>
                  <div><strong>Year / Grade:</strong> {candidate.matricDetails.passingYear} • {candidate.matricDetails.grade}</div>
                  <div className="pt-1.5 flex items-center justify-between gap-1 text-[10px]">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold truncate max-w-[170px]">
                      <span className="text-[8px] bg-red-600 text-white font-bold px-1 rounded uppercase">PDF</span>
                      <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{candidate.matricDetails.documentUrl || "matric_verified.pdf"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toast.success("Document Verified", { description: "Matriculation official DMC record matched." })}
                      className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      View Record
                    </button>
                  </div>
                </div>
              </div>

              {/* FSc */}
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 mb-1">
                  <span className="font-bold text-slate-800 text-[11px]">Intermediate (HSSC)</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div><strong>Board:</strong> {candidate.fscDetails.board} ({candidate.fscDetails.group})</div>
                  <div><strong>Year / Grade:</strong> {candidate.fscDetails.passingYear} • {candidate.fscDetails.grade}</div>
                  <div className="pt-1.5 flex items-center justify-between gap-1 text-[10px]">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold truncate max-w-[170px]">
                      <span className="text-[8px] bg-red-600 text-white font-bold px-1 rounded uppercase">PDF</span>
                      <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{candidate.fscDetails.documentUrl || "fsc_verified.pdf"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toast.success("Document Verified", { description: "Intermediate official DMC record matched." })}
                      className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      View Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-mono break-all">
            Candidate ID: {candidate.id}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>

            {candidate.status !== "Allocated" && onAllocate && (
              <button
                onClick={() => {
                  onClose();
                  onAllocate(candidate);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Allocate Seat</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
