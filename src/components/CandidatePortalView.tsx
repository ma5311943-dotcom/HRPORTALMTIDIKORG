"use client";

import React from "react";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  Fingerprint,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Allocation, Candidate, District } from "@/types";
import { UserSession } from "@/lib/auth";
import {
  CANDIDATE_STATUS_STYLES,
  PARTY_LABELS,
  PARTY_STYLES,
  formatPkDate,
} from "@/lib/ui";

interface CandidatePortalViewProps {
  user: UserSession;
  candidate: Candidate | null;
  allocation?: Allocation;
  districts: District[];
  onViewLetter: (allocation: Allocation) => void;
}

export default function CandidatePortalView({
  user,
  candidate,
  allocation,
  districts,
  onViewLetter,
}: CandidatePortalViewProps) {
  if (!candidate) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <Fingerprint className="mx-auto mb-2 h-8 w-8 text-amber-600" />
        <h2 className="text-sm font-bold text-amber-950">Candidate record not found</h2>
        <p className="mt-1 text-xs text-amber-800">
          Your session is active, but the enrolment record could not be loaded. Please refresh the
          page or contact the constituency helpdesk.
        </p>
      </div>
    );
  }

  const districtRecord = districts.find((d) => d.name === candidate.domicileDistrict);
  const steps = [
    { label: "Record registered", complete: true },
    {
      label: "NADRA CNIC verified",
      complete: candidate.status !== "Registered",
    },
    {
      label: "Seat allocation issued",
      complete: candidate.status === "Allocated",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="bg-flag-green relative overflow-hidden rounded-2xl p-5 text-white shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={candidate.photoUrl || "/images/candidate_portrait.jpg"}
              alt={candidate.fullName}
              className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/40 object-cover shadow-md sm:h-20 sm:w-20"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
                  Candidate Portal
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    CANDIDATE_STATUS_STYLES[candidate.status]
                  }`}
                >
                  {candidate.status}
                </span>
              </div>
              <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">{candidate.fullName}</h1>
              <p className="text-xs text-emerald-100/80">
                {candidate.constituency} • District {candidate.domicileDistrict}
              </p>
              <p className="mt-1 font-mono text-[11px] text-emerald-100/70">
                CNIC {candidate.cnic} • Enrolment {candidate.id}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-3 text-[11px] backdrop-blur-sm">
            <ShieldCheck className="h-5 w-5 text-pak-gold-soft" />
            <div>
              <div className="font-bold text-white">Verified session</div>
              <div className="text-emerald-100/70">Read-only candidate access</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <UserRound className="h-4 w-4 text-emerald-700" />
            Registration particulars
          </h2>

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            {[
              { label: "Father / Guardian", value: candidate.fatherName, icon: UserRound },
              { label: "Date of birth", value: candidate.dob, icon: CalendarDays },
              { label: "Gender", value: candidate.gender, icon: UserRound },
              { label: "Phone", value: candidate.phone, icon: Phone },
              { label: "Email", value: candidate.email, icon: Mail },
              { label: "Tehsil", value: candidate.tehsil, icon: MapPin },
            ].map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <Icon className="h-3 w-3" />
                    {field.label}
                  </div>
                  <div className="truncate font-semibold text-slate-800">{field.value || "—"}</div>
                </div>
              );
            })}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
              <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <MapPin className="h-3 w-3" />
                Permanent address
              </div>
              <div className="font-semibold text-slate-800">{candidate.address || "—"}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
            <span className={`rounded-full border px-2 py-0.5 font-bold ${PARTY_STYLES[candidate.partyAffiliation]}`}>
              {PARTY_LABELS[candidate.partyAffiliation]}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold">
              Domicile: {candidate.domicileDistrict}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold">
              Quota: {districtRecord ? `${districtRecord.allocatedCount}/${districtRecord.totalQuota}` : "—"}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <GraduationCap className="h-4 w-4 text-emerald-700" />
            Academic record
          </h2>
          <div className="space-y-2 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Matriculation
              </div>
              <div className="font-semibold text-slate-800">
                {candidate.matricDetails.grade} • {candidate.matricDetails.passingYear}
              </div>
              <div className="text-[10px] text-slate-500">{candidate.matricDetails.board}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Intermediate
              </div>
              <div className="font-semibold text-slate-800">
                {candidate.fscDetails.grade} • {candidate.fscDetails.passingYear}
              </div>
              <div className="text-[10px] text-slate-500">
                {candidate.fscDetails.group} • {candidate.fscDetails.board}
              </div>
            </div>
            {(candidate.higherEducation ?? []).map((education, index) => (
              <div key={`${education.degreeName}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {education.level}
                </div>
                <div className="font-semibold text-slate-800">{education.degreeName}</div>
                <div className="text-[10px] text-slate-500">
                  {education.institute} • {education.passingYear} • {education.grade}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <Award className="h-4 w-4 text-emerald-700" />
            Allocation &amp; appointment
          </h2>

          {allocation ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-bold text-emerald-950">{allocation.roleTitle}</div>
                  <p className="mt-1 text-xs text-emerald-800">
                    {allocation.department} • District {allocation.district} ({allocation.constituency})
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-700">
                    Ref {allocation.appointmentRefNo} • {formatPkDate(allocation.allocatedDate)}
                  </p>
                </div>
                <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {allocation.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onViewLetter(allocation)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-800"
              >
                <FileText className="h-3.5 w-3.5" />
                View Gazette Notification
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <BadgeCheck className="mx-auto mb-1.5 h-6 w-6 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">No active allocation yet</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Your verified record remains in the national merit pool for upcoming district quota
                allocations.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Verification timeline
          </h2>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={step.label} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    step.complete
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {step.complete ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                </span>
                <div>
                  <div className={`text-xs font-semibold ${step.complete ? "text-slate-800" : "text-slate-400"}`}>
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {step.complete ? "Completed" : "Pending"}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[10px] leading-relaxed text-slate-500">
            Signed in as <span className="font-semibold text-slate-700">{user.name}</span>. Contact
            the constituency helpdesk for corrections to your enrolment record.
          </div>
        </section>
      </div>
    </div>
  );
}
