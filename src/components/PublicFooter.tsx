"use client";

import React from "react";
import Link from "next/link";
import { Lock, ShieldCheck, Phone, Mail, MapPin } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden text-white print:hidden">
      {/* Background with image & balanced emerald/slate overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/parliament_house.jpg"
          alt="DHQ Secretariat"
          className="h-full w-full object-cover object-bottom filter brightness-[0.45] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-emerald-950/75 to-slate-900/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-emerald-500/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/15 pb-7 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/25 bg-white shadow-sm">
              <img
                src="/images/state_emblem.jpg"
                alt="State Emblem of Pakistan"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                DHQ Hospital HR System
              </h4>
              <p className="text-[11px] text-emerald-100/75">
                DHQ Teaching Hospital • Dera Ismail Khan, KP
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/90 transition-all hover:border-white/40 hover:bg-white/10"
            >
              Public Home
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/90 transition-all hover:border-white/40 hover:bg-white/10"
            >
              Candidate Enrolment
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-900 shadow-sm transition-all hover:bg-emerald-50"
            >
              <Lock className="h-3 w-3" />
              Portal Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 text-[11px] text-emerald-50/80 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
              <ShieldCheck className="h-3.5 w-3.5" />
              Legal Compliance
            </div>
            <p className="leading-relaxed">
              Operating pursuant to the Government of KP Health Department, DHQ Hospital Recruitment
              Rules and Civil Servants Act 2026.
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
              Secured System
            </div>
            <p className="leading-relaxed">
              AES-256 Encrypted • TLS 1.3 Transport • NADRA CNIC Verification • Zero Political Plain-Text Policy
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
              Support Helpline
            </div>
            <p className="space-y-1 leading-relaxed">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" /> 0966-710001
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0" /> hr@dhqhospitaldikhm.pk
              </span>
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
              Hospital Address
            </div>
            <p className="flex items-start gap-1.5 leading-relaxed">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              DHQ Teaching Hospital, Civil Hospital Road, Dera Ismail Khan, KP.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/15 pt-4 text-center text-[11px] text-emerald-100/60 sm:flex-row sm:text-left">
          <p>© 2026 DHQ Hospital HR System • Government of Khyber Pakhtunkhwa • All Rights Reserved.</p>
          <p className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-pak-gold" />
            DHQ-DI-KHAN-01 • Secured Session
          </p>
        </div>
      </div>
    </footer>
  );
}
