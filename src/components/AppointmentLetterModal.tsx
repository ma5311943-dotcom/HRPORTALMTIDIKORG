"use client";

import React from "react";
import { Allocation } from "@/types";
import { X, Printer, Copy, Award } from "lucide-react";
import { toast } from "sonner";

interface AppointmentLetterModalProps {
  allocation: Allocation | null;
  onClose: () => void;
}

export default function AppointmentLetterModal({
  allocation,
  onClose,
}: AppointmentLetterModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.classList.add("printing-gazette");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("printing-gazette");
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!allocation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
GOVERNMENT OF PAKISTAN
CONSTITUENCY ADMINISTRATION SECRETARIAT
OFFICIAL GAZETTE APPOINTMENT NOTIFICATION

Ref No: ${allocation.appointmentRefNo}
Date of Issue: ${allocation.allocatedDate}

Subject: OFFICIAL NOTIFICATION OF CONSTITUENCY APPOINTMENT

In pursuance of the Constituency Human Resources Program and under the authority of the District Selection Committee, the following appointment is hereby notified:

1. Appointee Name: ${allocation.candidateName}
2. National Identity (CNIC): ${allocation.candidateCnic}
3. Assigned Role: ${allocation.roleTitle}
4. Role Category: ${allocation.roleCategory}
5. Department / Board: ${allocation.department}
6. Constituency Alignment: ${allocation.constituency} (${allocation.district})
7. Political Affiliation: ${allocation.partyAffiliation}
8. Tenure: ${allocation.tenureMonths} Months
9. Monthly Honorarium: ${allocation.salaryOrStipend || "Gov Allowance"}
10. Status: ${allocation.status}

Issued by: ${allocation.allocatedBy}
    `;

    navigator.clipboard.writeText(text);
    toast.success("Gazette Notification copied to clipboard!");
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:static print:block print:p-0 print:bg-white print:overflow-visible animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Official Gazette Appointment Notification"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-4 print:border-none print:shadow-none print:my-0 print:max-h-none print:max-w-none print:overflow-visible flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden in Print) */}
        <div className="bg-white px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 border-t-4 border-t-emerald-600 print:hidden shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Official Gazette Notification</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Memorandum Body */}
        <div className="p-4 sm:p-7 space-y-4 text-slate-800 font-serif leading-relaxed overflow-y-auto m-2.5 rounded-xl border-2 border-slate-300 print:overflow-visible print:m-0 print:p-0 print:border-0 print:rounded-none">
          {/* Letterhead */}
          <div className="text-center space-y-1 border-b-2 border-slate-300 pb-3">
            <div className="flex items-center justify-center gap-3">
              <img
                src="/images/state_emblem.jpg"
                alt="State Emblem of Pakistan"
                className="w-10 h-10 rounded-full object-cover border border-[#c5a059] shadow-xs"
              />
              <img
                src="/images/gazette_gold_seal.jpg"
                alt="Gazette Seal"
                className="w-10 h-10 rounded-full object-cover border border-[#c5a059] shadow-xs"
              />
            </div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-emerald-800">
              Government of Pakistan
            </h2>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 font-sans">
              Constituency Human Resources & Administration Secretariat
            </h3>
            <p className="text-[10px] text-slate-500 font-sans">
              Official Appointment Gazette Ledger • Section 4(B) Local Quota Rules
            </p>
          </div>

          {/* Reference & Date */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans font-bold pt-1">
            <div>
              <span className="text-slate-500">Ref: </span>
              <span className="font-mono text-emerald-800 font-bold">{allocation.appointmentRefNo}</span>
            </div>
            <div>
              <span className="text-slate-500">Date: </span>
              <span>{allocation.allocatedDate}</span>
            </div>
          </div>

          {/* Notification Title */}
          <div className="text-center py-1">
            <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-300 font-sans text-xs font-bold uppercase px-3 py-1 rounded">
              Gazette Notification of Public Appointment
            </span>
          </div>

          {/* Core Recital Text */}
          <p className="text-xs text-justify font-sans leading-relaxed text-slate-700">
            In exercise of the powers conferred by the <em>Constituency Human Resources Framework Act</em> and upon the scrutiny of the District Scrutiny Committee, the competent authority is pleased to notify the official appointment of the candidate specified hereunder:
          </p>

          {/* Particulars Table */}
          <div className="bg-white border border-slate-300 rounded-lg p-3 text-xs font-sans space-y-1.5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1.5 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">1. Appointee Full Name</span>
                <span className="font-bold text-slate-900">{allocation.candidateName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">2. National CNIC</span>
                <span className="font-mono font-bold text-emerald-800">{allocation.candidateCnic}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1.5 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">3. Designated Role</span>
                <span className="font-bold text-emerald-800">{allocation.roleTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">4. Category</span>
                <span className="font-semibold text-slate-800">{allocation.roleCategory}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1.5 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">5. Assigned Constituency</span>
                <span className="font-bold text-slate-900">{allocation.constituency} ({allocation.district})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">6. Party Alignment</span>
                <span className="font-semibold text-slate-800">{allocation.partyAffiliation}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">7. Tenure</span>
                <span className="font-semibold text-slate-800">{allocation.tenureMonths} Months</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">8. Monthly Honorarium</span>
                <span className="font-bold text-emerald-800">{allocation.salaryOrStipend || "Gov Allowance"}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-4 flex items-center justify-between text-xs font-sans">
            <div className="text-center space-y-1">
              <img
                src="/images/gazette_gold_seal.jpg"
                alt="Gold Seal"
                className="w-12 h-12 mx-auto rounded-full object-cover border border-[#c5a059]"
              />
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                Official Digital Seal
              </span>
            </div>

            <div className="text-right space-y-0.5">
              <div className="font-bold text-slate-900 border-b border-slate-400 pb-1">
                {allocation.allocatedBy}
              </div>
              <p className="text-[10px] text-slate-500">
                District Selection Authority
              </p>
              <p className="text-[9px] text-emerald-800 font-mono font-bold">
                Status: {allocation.status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
