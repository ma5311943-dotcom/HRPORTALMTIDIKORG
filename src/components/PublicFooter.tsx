"use client";

import React from "react";
import Link from "next/link";
import { Lock, ShieldCheck, Phone, Mail, MapPin } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-flag-green mt-auto text-white print:hidden">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
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
                Internal HR System
              </h4>
              <p className="text-[11px] text-emerald-100/75">
                Government of Pakistan • Central Secretariat, Islamabad
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
              Operating pursuant to the Civil Servants Act and Parliamentary Constituency Human
              Resource Allocation Rules 2026.
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
              Secured Node
            </div>
            <p className="leading-relaxed">
              Islamabad Federal Server Cluster #4 • Encryption: 256-bit AES • Digital Signature:
              National PKI Authority.
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
              Support Helpline
            </div>
            <p className="space-y-1 leading-relaxed">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" /> 051-9201020
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0" /> secretariat@internalhr.gov.pk
              </span>
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-pak-gold-soft">
              Secretariat
            </div>
            <p className="flex items-start gap-1.5 leading-relaxed">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              Redressal Wing, Room 412, National Assembly, Islamabad.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/15 pt-4 text-center text-[11px] text-emerald-100/60 sm:flex-row sm:text-left">
          <p>© 2026 Internal HR System. Islamic Republic of Pakistan. All Rights Reserved.</p>
          <p className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-pak-gold" />
            Node PK-04 • Verified Session
          </p>
        </div>
      </div>
    </footer>
  );
}
