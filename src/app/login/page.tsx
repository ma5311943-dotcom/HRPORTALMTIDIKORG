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

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid credentials.");
      }

      toast.success(`Access granted: ${data.data.name}`, {
        description: `Signed in as ${data.data.title}`,
      });
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Invalid credentials. Demo accounts use the role key for both fields (e.g. admin / admin, mna / mna, staff / staff)."
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

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to verify your candidate credentials.");
      }

      const candidate = data.data as Candidate;

      toast.success(`Welcome, ${candidate.fullName}`, {
        description: `Candidate record verified for ${candidate.constituency}.`,
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

  return (
    <div className="grid w-full min-w-0 max-w-6xl gap-5 lg:grid-cols-12 lg:gap-8">
      {/* Sovereign context panel */}
      <aside className="bg-flag-green relative min-w-0 overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8 lg:col-span-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full border border-white/10" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/25 bg-white shadow-md">
              <img
                src="/images/state_emblem.jpg"
                alt="State Emblem of Pakistan"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-pak-gold-soft">
                Official Gateway
              </p>
              <h1 className="text-lg font-bold leading-tight">Internal HR System Sign In</h1>
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-bold leading-tight sm:text-3xl">
            One portal.
            <span className="block text-pak-gold-soft">Every constituency.</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-50/85">
            Access parliamentary dashboards, verify candidate records, manage district quotas, and
            issue official Gazette appointments from a single sovereign workspace.
          </p>

          <ul className="mt-6 space-y-3 text-xs text-emerald-50/90">
            {[
              "NADRA CNIC verification and duplicate detection",
              "Role-scoped permissions for every tier of government",
              "Gazette-ready appointment notifications with audit trail",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-pak-gold-soft" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 text-center">
            {[
              { value: "9", label: "Role portals" },
              { value: "12", label: "Districts" },
              { value: "24/7", label: "Audit trail" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/15 bg-white/5 px-2 py-2.5">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[10px] font-medium text-emerald-100/70">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/15 bg-black/15 p-3 text-[11px] leading-relaxed text-emerald-50/80">
            <span className="font-bold text-pak-gold-soft">Demo access:</span> use a role key as both
            username and password. Candidate accounts use the CNIC and password set during
            enrolment.
          </div>
        </div>
      </aside>

      {/* Authentication card */}
      <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-7">
        <div className="border-b border-slate-200 px-4 pt-4 sm:px-6 sm:pt-6">
          <div role="tablist" aria-label="Sign in type" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "officer"}
              onClick={() => switchMode("officer")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:text-sm ${
                mode === "officer"
                  ? "bg-white text-emerald-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Officer Portal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "candidate"}
              onClick={() => switchMode("candidate")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:text-sm ${
                mode === "candidate"
                  ? "bg-white text-emerald-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Fingerprint className="h-4 w-4" />
              Candidate Portal
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {mode === "officer" ? (
            <div role="tabpanel" aria-label="Officer sign in">
              <div className="mb-4">
                <label
                  htmlFor="role-preset"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Select official role
                </label>
                <div className="relative">
                  <select
                    id="role-preset"
                    value={selectedPreset}
                    onChange={(e) => handleSelectRole(e.target.value)}
                    className="w-full min-w-0 appearance-none rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-9 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
                  >
                    {presetOptions.map(({ key, preset }) => (
                      <option key={key} value={key}>
                        {preset.badge} - {preset.name}
                      </option>
                    ))}
                  </select>
                  <KeyRound className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5">
                  <img
                    src={activePreset.avatar}
                    alt={activePreset.name}
                    className="h-9 w-9 shrink-0 rounded-lg border border-white object-cover shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-emerald-950">
                      {activePreset.name}
                    </div>
                    <div className="truncate text-[11px] text-emerald-800">
                      {activePreset.title}
                    </div>
                  </div>
                  <span className="hidden shrink-0 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800 sm:inline">
                    {activePreset.defaultDistrict}
                  </span>
                </div>
              </div>

              <form onSubmit={handleOfficerLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="officer-id" className="mb-1 block text-xs font-semibold text-slate-700">
                    Username / Email
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
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
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="officer-password" className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">
                      Demo: same as role key
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
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
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm font-mono font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {errorMsg && <ErrorAlert message={errorMsg} />}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-56 sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 text-white/80" />
                      Sign In to Portal
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Quick demo access
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["admin", "mna", "chairperson", "civil_officer", "staff"].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectRole(key)}
                      className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold transition-all ${
                        selectedPreset === key
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div role="tabpanel" aria-label="Candidate sign in">
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-emerald-950">
                  <Fingerprint className="h-4 w-4 text-emerald-700" />
                  Candidate Record Access
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                  Sign in with the CNIC used during enrolment. If you did not set a password, use
                  the 13 CNIC digits without dashes.
                </p>
              </div>

              <form onSubmit={handleCandidateLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="candidate-cnic" className="mb-1 block text-xs font-semibold text-slate-700">
                    National CNIC
                  </label>
                  <div className="relative">
                    <Fingerprint className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
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
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 font-mono text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="candidate-password" className="text-xs font-semibold text-slate-700">
                      Portal Password
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">
                      Default: CNIC digits
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
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
                      placeholder="Enter your portal password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm font-mono font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {errorMsg && <ErrorAlert message={errorMsg} />}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-56 sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Verifying record...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-white/80" />
                      Access Candidate Portal
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:flex-row">
                <span>Not enrolled yet?</span>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-900 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Create a candidate record
                </Link>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row">
            <Link href="/" className="font-medium transition-colors hover:text-emerald-800">
              &larr; Return to public home
            </Link>
            <Link href="/signup" className="font-semibold text-emerald-800 hover:underline">
              Candidate enrolment
            </Link>
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
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f6] font-sans text-slate-900">
      <PublicHeader activePage="login" />

      <main className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <p className="text-xs font-medium text-slate-600">
                Loading secure authentication gateway...
              </p>
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
