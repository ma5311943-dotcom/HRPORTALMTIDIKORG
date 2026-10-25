"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { ROLE_PRESETS } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/ui";
import type { Candidate } from "@/types";
import { toast } from "sonner";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

type LoginMode = "officer" | "candidate";

function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRole = searchParams.get("role") || "admin";
  const initialRole = ROLE_PRESETS[requestedRole] ? requestedRole : "admin";
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const initialMode: LoginMode =
    searchParams.get("mode") === "candidate" ? "candidate" : "officer";

  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [selectedPreset, setSelectedPreset] = useState(initialRole);
  const [identifier, setIdentifier] = useState(initialRole);
  const [password, setPassword] = useState(initialRole);
  const [candidateCnic, setCandidateCnic] = useState("");
  const [candidatePassword, setCandidatePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePreset = ROLE_PRESETS[selectedPreset] || ROLE_PRESETS.admin;

  const presetOptions = useMemo(
    () => Object.entries(ROLE_PRESETS).map(([key, preset]) => ({ key, preset })),
    []
  );

  const handleSelectRole = (roleKey: string) => {
    setSelectedPreset(roleKey);
    setIdentifier(roleKey);
    setPassword(roleKey);
    setErrorMsg(null);
  };

  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Invalid credentials.");
      toast.success(`Access granted: ${data.data.name}`, {
        description: `Signed in as ${data.data.title}`,
      });
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Invalid credentials. Use role key as both username and password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (candidateCnic.replace(/[^0-9]/g, "").length !== 13) {
      setErrorMsg("Please enter your complete 13-digit CNIC (e.g. 35201-1234567-1).");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic: candidateCnic, password: candidatePassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Unable to verify your credentials.");
      const candidate = data.data as Candidate;
      toast.success(`Welcome, ${candidate.fullName}`, {
        description: `Record verified for ${candidate.constituency}.`,
      });
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setErrorMsg(null);
  };

  /* ───────────── render ───────────── */
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xl lg:grid lg:grid-cols-5">
      {/* ── Left panel ── */}
      <aside className="relative flex flex-col justify-between overflow-hidden p-5 text-white lg:col-span-2">
        {/* Background Image with Light Green Tint & Modern Hospital Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/landing_hero_governance.jpg"
            alt="DHQ Hospital Complex"
            className="h-full w-full object-cover object-center filter brightness-[0.55] contrast-[1.08]"
          />
          {/* Light-green emerald duotone tint overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-teal-900/75 to-slate-900/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-emerald-500/15" />
        </div>

        {/* decorative rings */}
        <span className="pointer-events-none absolute -right-14 -top-14 z-0 h-48 w-48 rounded-full border border-white/10" />
        <span className="pointer-events-none absolute -bottom-10 -left-10 z-0 h-40 w-40 rounded-full border border-white/10" />

        {/* top: branding + copy */}
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/30 bg-white/95 shadow-md backdrop-blur-sm">
              <img
                src="/images/state_emblem.jpg"
                alt="Government of Pakistan"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-pak-gold-soft">
                Official Gateway
              </p>
              <p className="text-sm font-extrabold leading-tight">DHQ Hospital HR</p>
            </div>
          </div>

          <h2 className="text-xl font-extrabold leading-snug">
            DHQ Teaching Hospital
            <span className="block text-pak-gold-soft">D.I. Khan</span>
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-emerald-50/80">
            Staff recruitment, CNIC verification, appointment orders &amp; full audit trail — one portal.
          </p>

          <ul className="mt-5 space-y-2 text-[10px] text-emerald-50/85">
            {[
              "NADRA CNIC verification & duplicate detection",
              "9 DHQ staff roles across 5 D.I. Khan tehsils",
              "Single-click Word export for appointment orders",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pak-gold-soft" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* bottom: stats + demo hint */}
        <div className="relative z-10 mt-6">
          <div className="grid grid-cols-3 gap-1.5 border-t border-white/15 pt-4 text-center">
            {[
              { v: "9", l: "Staff Roles" },
              { v: "5", l: "Tehsils" },
              { v: "24/7", l: "Audit" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-white/15 bg-white/8 py-2">
                <div className="text-base font-bold">{s.v}</div>
                <div className="text-[9px] text-emerald-100/70">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-white/15 bg-black/15 px-3 py-2 text-[10px] leading-relaxed text-emerald-50/75">
            <span className="font-bold text-pak-gold-soft">Demo:</span> use any role key as both
            username &amp; password — e.g.{" "}
            <span className="font-mono font-bold">admin</span>.
          </p>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="bg-white lg:col-span-3">
        {/* mode tabs */}
        <div className="border-b border-slate-100 px-4 pt-4">
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-0.5">
            {(
              [
                { id: "officer", label: "Officer Portal", icon: ShieldCheck },
                { id: "candidate", label: "Applicant Portal", icon: Fingerprint },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => switchMode(id)}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  mode === id
                    ? "bg-white text-emerald-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {mode === "officer" ? (
            <div role="tabpanel">
              {/* role preset */}
              <div className="mb-3">
                <label
                  htmlFor="role-preset"
                  className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Select official role
                </label>
                <div className="relative">
                  <select
                    id="role-preset"
                    value={selectedPreset}
                    onChange={(e) => handleSelectRole(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  >
                    {presetOptions.map(({ key, preset }) => (
                      <option key={key} value={key}>
                        {preset.badge} — {preset.name}
                      </option>
                    ))}
                  </select>
                  <KeyRound className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>

                {/* role card */}
                <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                  <img
                    src={activePreset.avatar}
                    alt={activePreset.name}
                    className="h-8 w-8 shrink-0 rounded-lg border border-white object-cover shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-emerald-950">
                      {activePreset.name}
                    </p>
                    <p className="truncate text-[10px] text-emerald-700">{activePreset.title}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    {activePreset.defaultDistrict}
                  </span>
                </div>
              </div>

              <form onSubmit={handleOfficerLogin} className="space-y-3">
                {/* username */}
                <div>
                  <label
                    htmlFor="officer-id"
                    className="mb-1 block text-[11px] font-semibold text-slate-600"
                  >
                    Username / Email
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      id="officer-id"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setErrorMsg(null);
                      }}
                      required
                      placeholder="e.g. admin"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>

                {/* password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="officer-password"
                      className="text-[11px] font-semibold text-slate-600"
                    >
                      Password
                    </label>
                    <span className="text-[9px] text-slate-400">Demo: same as role key</span>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      id="officer-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      required
                      placeholder="Password"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 font-mono text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && <ErrorAlert message={errorMsg} />}

                {/* quick chips + submit on same row */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-1">
                    {["admin", "director", "ms", "clerk", "operator"].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectRole(key)}
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold transition-all cursor-pointer ${
                          selectedPreset === key
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div role="tabpanel">
              <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Fingerprint className="h-3.5 w-3.5 text-emerald-700" />
                  Applicant Record Access
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-emerald-800">
                  Sign in with your CNIC used during enrolment. Default password is your 13-digit
                  CNIC without dashes.
                </p>
              </div>

              <form onSubmit={handleCandidateLogin} className="space-y-3">
                <div>
                  <label
                    htmlFor="candidate-cnic"
                    className="mb-1 block text-[11px] font-semibold text-slate-600"
                  >
                    National CNIC
                  </label>
                  <div className="relative">
                    <Fingerprint className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      id="candidate-cnic"
                      type="text"
                      inputMode="numeric"
                      autoComplete="username"
                      value={candidateCnic}
                      onChange={(e) => {
                        setCandidateCnic(e.target.value);
                        setErrorMsg(null);
                      }}
                      required
                      maxLength={15}
                      placeholder="35201-1234567-1"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 font-mono text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="candidate-password"
                      className="text-[11px] font-semibold text-slate-600"
                    >
                      Portal Password
                    </label>
                    <span className="text-[9px] text-slate-400">Default: CNIC digits</span>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      id="candidate-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={candidatePassword}
                      onChange={(e) => {
                        setCandidatePassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      required
                      placeholder="Portal password"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 font-mono text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && <ErrorAlert message={errorMsg} />}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline"
                  >
                    <UserPlus className="h-3 w-3" />
                    New applicant? Enrol here
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Access Portal
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* footer links */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
            <Link href="/" className="font-medium transition-colors hover:text-emerald-700">
              ← Return home
            </Link>
            <span className="font-mono tracking-tight">AES-256 · TLS 1.3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-800"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef1ee] font-sans text-slate-900">
      <PublicHeader activePage="login" />

      <main className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <p className="text-xs font-medium text-slate-600">Loading secure gateway...</p>
            </div>
          }
        >
          <LoginPanel />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
