"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  ArrowRight,
  Lock,
  FileCheck2,
  AlertCircle,
  Check,
  Fingerprint,
  UserPlus,
  Landmark,
  Users,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import { District, PoliticalParty } from "@/types";
import { ROLE_PRESETS } from "@/lib/auth";
import { PARTY_LABELS, PARTY_STYLES } from "@/lib/ui";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

interface PublicVerification {
  fullName: string;
  fatherName: string;
  cnic: string;
  domicileDistrict: string;
  constituency: string;
  status: string;
  partyAffiliation: PoliticalParty;
  matricDetails: { board: string; passingYear: number; grade: string };
  fscDetails: { board: string; passingYear: number; group: string; grade: string };
  allocation: {
    roleTitle: string;
    department: string;
    district: string;
    constituency: string;
    appointmentRefNo: string;
    allocatedDate: string;
  } | null;
}

interface PublicOverview {
  districts: District[];
  stats: {
    totalCandidates: number;
    totalVerified: number;
    totalAllocated: number;
    totalDistricts: number;
    totalQuota: number;
    quotaAlignment: number;
  };
}

interface LandingPageProps {
  onOpenLogin: (roleKey?: string) => void;
  overview: PublicOverview;
}

export default function LandingPage({
  onOpenLogin,
  overview,
}: LandingPageProps) {
  const { districts, stats } = overview;
  const [cnicQuery, setCnicQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<PublicVerification | null | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeHeroVisual, setActiveHeroVisual] = useState<"banner" | "parliament">("banner");

  const sampleCnics = [
    { label: "Hamza Tariq (Lahore)", cnic: "35201-1849204-1" },
    { label: "Syeda Zainab (Rawalpindi)", cnic: "37405-7281920-4" },
    { label: "Farhan Soomro (Karachi)", cnic: "42101-8172635-5" },
    { label: "Jahangir Khan (Peshawar)", cnic: "17301-6382910-7" },
  ];

  const verifyCnic = async (value: string) => {
    const clean = value.trim().replace(/[^0-9-]/g, "");
    if (!clean) return;

    setHasSearched(true);
    setIsSearching(true);
    setSearchResult(undefined);
    try {
      const response = await fetch("/api/public/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic: clean }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Verification service is unavailable.");
      }
      setSearchResult((payload.data as PublicVerification | null) ?? null);
    } catch {
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCnicSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void verifyCnic(cnicQuery);
  };

  const handleQuickSampleCnic = (cnic: string) => {
    setCnicQuery(cnic);
    void verifyCnic(cnic);
  };

  const candidateAllocation = searchResult?.allocation ?? null;
  const totalAllocated = stats.totalAllocated;
  const totalVerified = stats.totalVerified;
  const quotaAlignment = stats.quotaAlignment;

  return (
    <div className="min-h-screen bg-[#f7f8f6] font-sans text-slate-900">
      <PublicHeader activePage="home" />

      {/* HERO — deep green field with white typography, echoing the national flag */}
      <section id="overview" className="bg-flag-green relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 top-10 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-5 text-center lg:col-span-7 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-pak-gold" />
                <span>Constituency Human Capital Framework • Pakistan 2026</span>
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.9rem] xl:text-5xl">
                Constituency Human Capital,
                <span className="block text-pak-gold-soft">Verified &amp; Delivered.</span>
              </h1>

              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-emerald-50/85 sm:text-base lg:mx-0">
                A unified sovereign portal connecting National Assembly constituencies, NADRA CNIC
                verification, district employment quotas, and official Gazette appointment
                notifications.
              </p>

              <div className="flex flex-col items-center justify-center gap-2.5 pt-2 sm:flex-row lg:justify-start">
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLogin();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-emerald-900 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl sm:w-auto sm:text-sm"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Access Official Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10 sm:w-auto sm:text-sm"
                >
                  <UserPlus className="h-3.5 w-3.5 text-pak-gold-soft" />
                  <span>Register Candidate</span>
                </Link>

                <a
                  href="#cnic-verify"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold text-emerald-100 transition-all hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Fingerprint className="h-3.5 w-3.5" />
                  <span>Verify CNIC</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-emerald-50 lg:justify-start">
                {[
                  "142 National Constituencies",
                  "NADRA CNIC Verification",
                  "Gazette Generator",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-pak-gold-soft" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mt-2 lg:col-span-5 lg:mt-0">
              <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-emerald-950 shadow-2xl ring-1 ring-white/10">
                <div className="relative h-72 w-full overflow-hidden sm:h-96">
                  <img
                    src={
                      activeHeroVisual === "banner"
                        ? "/images/hero_dashboard_banner.jpg"
                        : "/images/parliament_house.jpg"
                    }
                    alt="Pakistan Digital HRM Platform and Parliament House"
                    className="h-full w-full transform object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#012413]/95 via-[#012413]/35 to-transparent" />
                </div>

                <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-black/60 p-1 shadow-md backdrop-blur-md">
                    {(["banner", "parliament"] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setActiveHeroVisual(view)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold capitalize transition-all ${
                          activeHeroVisual === view
                            ? "bg-white text-emerald-900 shadow-sm"
                            : "text-slate-200 hover:text-white"
                        }`}
                      >
                        {view === "banner" ? "Platform" : "Parliament"}
                      </button>
                    ))}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur-md">
                    <img
                      src="/images/state_emblem.jpg"
                      alt="State Emblem"
                      className="h-3.5 w-3.5 rounded-full object-cover"
                    />
                    <span>Govt of Pakistan</span>
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 p-2 text-white">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-pak-gold" />
                    <span className="truncate text-[10px] font-bold uppercase tracking-wider text-white/75">
                      {activeHeroVisual === "banner"
                        ? "Digital HRM Network • Islamabad HQ"
                        : "Parliament House of Pakistan"}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold leading-tight sm:text-sm">
                    {activeHeroVisual === "banner"
                      ? "Constituency Human Resources & Analytics Platform"
                      : "Central Parliamentary Assembly & Quota Secretariat"}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-emerald-100/80">
                    Transparent governance, merit-based allocation &amp; talent management
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live metrics */}
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:mt-14 sm:gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/20 bg-white p-4 text-center shadow-sm sm:p-5">
              <div className="text-2xl font-bold text-emerald-800 sm:text-3xl">
                {stats.totalCandidates}+
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 sm:text-xs">
                Candidates Registered
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                {totalVerified} NADRA-Verified
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white p-4 text-center shadow-sm sm:p-5">
              <div className="text-2xl font-bold text-emerald-800 sm:text-3xl">
                {districts.length}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 sm:text-xs">
                Districts Covered
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                All 4 Provinces + ICT
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white p-4 text-center shadow-sm sm:p-5">
              <div className="text-2xl font-bold text-amber-700 sm:text-3xl">{totalAllocated}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 sm:text-xs">
                Official Allocations
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                Active Gazette Appointments
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white p-4 text-center shadow-sm sm:p-5">
              <div className="text-2xl font-bold text-emerald-800 sm:text-3xl">
                {quotaAlignment}%
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 sm:text-xs">
                Quota Alignment
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                Merit-Compliant Allocation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CNIC VERIFICATION */}
      <section id="cnic-verify" className="border-b border-slate-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Citizen Transparency Portal
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              National CNIC Candidate Verification
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Verify registration status, domicile district, academic records, and allocated public
              sector appointments.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-emerald-950 shadow-xl">
                <img
                  src="/images/nadra_biometric_card.jpg"
                  alt="NADRA Biometric Smart CNIC Verification"
                  className="h-64 w-full object-cover sm:h-72"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#012413]/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-200">
                    <Fingerprint className="h-4 w-4 animate-pulse text-pak-gold" />
                    <span>Real-time Biometric Security Protocol</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/80">
                    Matches 13-digit CNIC against official constituency quota registers
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <form onSubmit={handleCnicSearch} className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-emerald-700" />
                    <label htmlFor="cnic-search" className="sr-only">
                      CNIC number
                    </label>
                    <input
                      id="cnic-search"
                      type="text"
                      value={cnicQuery}
                      onChange={(e) => setCnicQuery(e.target.value)}
                      placeholder="Enter 13-digit CNIC (e.g. 35201-1849204-1)"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 font-mono text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span>{isSearching ? "Verifying..." : "Verify Record"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Test Sample CNICs:</span>
                  {sampleCnics.map((sample) => (
                    <button
                      key={sample.cnic}
                      type="button"
                      onClick={() => handleQuickSampleCnic(sample.cnic)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:text-[11px]"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>

                <div aria-live="polite">
                  {hasSearched && (
                    <div className="animate-in fade-in mt-5 border-t border-slate-200 pt-5 duration-200">
                      {isSearching ? (
                        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                          <Search className="h-5 w-5 shrink-0 animate-pulse text-emerald-700" />
                          <span>Checking the national candidate registry...</span>
                        </div>
                      ) : searchResult ? (
                        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500 bg-white p-4 shadow-sm sm:p-5">
                          <div className="absolute right-0 top-0 rounded-bl-xl bg-emerald-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                            Record Verified
                          </div>

                          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                              <BadgeCheck className="h-8 w-8" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">
                                  {searchResult.fullName}
                                </h3>
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                                  {searchResult.cnic}
                                </span>
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                  {searchResult.status}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                    PARTY_STYLES[searchResult.partyAffiliation]
                                  }`}
                                >
                                  {PARTY_LABELS[searchResult.partyAffiliation]}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600">
                                S/O or D/O: <strong>{searchResult.fatherName}</strong> • Domicile:{" "}
                                <strong>{searchResult.domicileDistrict}</strong> • Constituency:{" "}
                                <strong>{searchResult.constituency}</strong>
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                <span>
                                  Matric: <strong>{searchResult.matricDetails.grade}</strong> (
                                  {searchResult.matricDetails.passingYear})
                                </span>
                                <span>
                                  FSc: <strong>{searchResult.fscDetails.grade}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          {candidateAllocation ? (
                            <div className="mt-3.5 -mx-4 -mb-4 rounded-b-xl border-t border-emerald-300 bg-emerald-50 p-3 sm:-mx-5 sm:-mb-5 sm:p-4">
                              <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                                <div className="space-y-0.5 text-xs">
                                  <div className="text-xs font-bold text-emerald-900 sm:text-sm">
                                    Official Gazette Allocation: {candidateAllocation.roleTitle}
                                  </div>
                                  <p className="text-emerald-800">
                                    Department: <strong>{candidateAllocation.department}</strong> •
                                    District: <strong>{candidateAllocation.district}</strong> (
                                    {candidateAllocation.constituency})
                                  </p>
                                  <p className="font-mono text-[11px] text-emerald-700">
                                    Ref: <strong>{candidateAllocation.appointmentRefNo}</strong> •
                                    Date: {candidateAllocation.allocatedDate}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                              <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-700" />
                              <span>
                                Candidate record is verified in the national merit pool for upcoming
                                district quota seat allocations.
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                          <div>
                            <span className="font-bold">
                              No candidate found with CNIC &quot;{cnicQuery}&quot;.{" "}
                            </span>
                            <span>
                              Please check the 13-digit CNIC or use one of the sample records above.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLE PORTALS */}
      <section id="roles" className="border-b border-slate-200 bg-[#f7f8f6] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Constitutional Hierarchy
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Role-Based Portals &amp; Access Points
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Every parliamentary and civil administrative role has dedicated credentials and
              tailored authorizations.
              <br className="hidden sm:block" />
              <span className="mt-1 inline-block rounded-lg bg-white px-2 py-1 font-mono text-[11px] font-semibold text-emerald-800 ring-1 ring-slate-200">
                Demo rule: enter the role key as both username and password
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
              <div
                key={key}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`truncate rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${preset.badgeColor}`}
                    >
                      {preset.badge}
                    </span>
                    <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                      {key}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={preset.avatar}
                      alt={preset.name}
                      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover shadow-sm"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-900">{preset.name}</h3>
                      <p className="truncate text-[11px] font-semibold text-emerald-800">
                        {preset.title}
                      </p>
                    </div>
                  </div>

                  <p className="mb-3.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                    {preset.description}
                  </p>

                  <div className="mb-4 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px]">
                    <div className="flex justify-between gap-2 text-slate-500">
                      <span>User / Email</span>
                      <strong className="truncate text-slate-700">{key}</strong>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-500">
                      <span>Password</span>
                      <strong className="truncate text-slate-700">{key}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/login?role=${key}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenLogin(key);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-800"
                  >
                    <span>Instant Login</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    href={`/login?role=${key}`}
                    className="w-full rounded-lg border border-slate-200 py-1.5 text-center text-xs font-semibold text-slate-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    Open Login Portal
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVINCIAL LEDGERS */}
      <section id="provinces" className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Federation Quotas
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Provincial Allocation Distribution
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              National Assembly formula tracking candidate vacancies across Punjab, Sindh, Khyber
              Pakhtunkhwa, Balochistan &amp; Islamabad.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {districts.map((dist) => {
              const pct = dist.totalQuota > 0 ? Math.round((dist.allocatedCount / dist.totalQuota) * 100) : 0;
              return (
                <div
                  key={dist.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                      District {dist.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {dist.province}
                    </span>
                  </div>

                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900">
                      {dist.allocatedCount}{" "}
                      <span className="text-xs font-normal text-slate-500">/ {dist.totalQuota} seats</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-800">{pct}%</span>
                  </div>

                  <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{dist.constituencies.length} constituencies</span>
                    <span className="font-mono font-semibold text-slate-700">
                      e.g. {dist.constituencies[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section id="compliance" className="border-b border-slate-200 bg-[#f7f8f6] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Security &amp; Integrity
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              National Standards Compliance
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Built to constitutional standards under Election Commission and Cabinet Division
              guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg">
              <div className="relative h-44 overflow-hidden rounded-xl border border-slate-200">
                <img
                  src="/images/assembly_hall.jpg"
                  alt="National Assembly Debating Hall"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-xs font-bold text-white">
                  Parliamentary Assembly
                </span>
              </div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Landmark className="h-4 w-4 text-emerald-700" />
                Transparent Quota Allocation Matrix
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Zero ghost candidates. Every applicant record is verified against domicile
                certificates, educational boards, and the CNIC registry.
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg">
              <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src="/images/gazette_gold_seal.jpg"
                  alt="Official Gazette Gold Seal"
                  className="h-32 w-32 rounded-full border-2 border-pak-gold object-cover shadow-xl"
                />
                <span className="absolute bottom-2.5 left-3 text-xs font-bold text-slate-700">
                  Official Gazette Seal
                </span>
              </div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <BadgeCheck className="h-4 w-4 text-emerald-700" />
                Gazette Notification Generator
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Generate authenticated appointment notification letters with QR authentication
                codes, candidate photos, and gazette reference IDs.
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg">
              <div className="relative h-44 overflow-hidden rounded-xl border border-slate-200">
                <img
                  src="/images/parliament_house.jpg"
                  alt="Parliament House Islamabad"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-xs font-bold text-white">
                  Federal Network
                </span>
              </div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Inter-Agency Protected Communications
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Direct, encrypted internal communication between MNAs, MPAs, District
                Commissioners, and Public Sector Staff.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ready to enrol or verify a record?</h3>
                <p className="text-xs text-slate-500">
                  Registration takes less than two minutes and issues an official enrolment ID.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Link
                href="/signup"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100 sm:flex-none"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Register Candidate
              </Link>
              <Link
                href="/login"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-800 sm:flex-none"
              >
                <Lock className="h-3.5 w-3.5" />
                Portal Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
