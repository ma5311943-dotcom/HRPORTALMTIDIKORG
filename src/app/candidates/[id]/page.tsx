"use client";

import React, { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Building,
  FileCheck,
  GraduationCap,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  UserX,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Hash,
  Mail,
  User,
  Briefcase,
  BookOpen,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { Candidate, Allocation, CandidateDocumentSummary } from "@/types";
import { CANDIDATE_DOCUMENT_FIELDS, CANDIDATE_DOCUMENT_LABELS } from "@/types";
import type { UserSession } from "@/lib/server-auth";
import DocumentPreviewModal, { type PreviewTarget } from "@/components/ui/DocumentPreviewModal";
import { Avatar, Skeleton, SkeletonCard } from "@/components/ui/kit";

interface PageProps {
  params: Promise<{ id: string }>;
}

type LoadState = "loading" | "not-found" | "unauthorized" | "error" | "done";

function CandidateDossierContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [documents, setDocuments] = useState<CandidateDocumentSummary[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [preview, setPreview] = useState<PreviewTarget>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const canManageDocs = useMemo(() => {
    if (!session || session.isCandidate || !candidate) return false;
    if (!session.permissions.canRegisterCandidates) return false;
    if (session.district && session.district !== "All") {
      return candidate.domicileDistrict.toLowerCase() === session.district.toLowerCase();
    }
    return true;
  }, [session, candidate]);

  async function refreshDocuments() {
    const res = await fetch(`/api/candidates/${id}/documents`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.success) setDocuments(data.data as CandidateDocumentSummary[]);
    }
  }

  async function handleReplace(field: string, file: File) {
    setUploadingField(field);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("field", field);
      const res = await fetch(`/api/candidates/${id}/documents`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        toast.success("Document replaced", { description: `${CANDIDATE_DOCUMENT_LABELS[field as keyof typeof CANDIDATE_DOCUMENT_LABELS]} updated successfully.` });
        await refreshDocuments();
        router.refresh();
      } else {
        toast.error("Upload failed", { description: data?.error ?? `Could not replace the ${field} document.` });
      }
    } catch {
      toast.error("Upload failed", { description: "A network error occurred while replacing the document." });
    } finally {
      setUploadingField(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [candRes, allocRes, docsRes, sessionRes] = await Promise.all([
          fetch(`/api/candidates/${id}`, { cache: "no-store" }),
          fetch(`/api/allocations`, { cache: "no-store" }),
          fetch(`/api/candidates/${id}/documents`, { cache: "no-store" }),
          fetch(`/api/auth/session`, { cache: "no-store" }),
        ]);

        if (!active) return;

        if (candRes.status === 401) {
          setLoadState("unauthorized");
          return;
        }
        if (candRes.status === 404) {
          setLoadState("not-found");
          return;
        }
        if (!candRes.ok) {
          const data = await candRes.json().catch(() => ({}));
          setErrorMsg(data.error || "Failed to load candidate.");
          setLoadState("error");
          return;
        }

        const candData = await candRes.json();
        if (!candData.success) {
          setErrorMsg(candData.error || "Candidate data unavailable.");
          setLoadState("error");
          return;
        }
        const cand: Candidate = candData.data;

        let activeAlloc: Allocation | null = null;
        if (allocRes.ok) {
          const allocData = await allocRes.json().catch(() => null);
          if (allocData?.success) {
            activeAlloc =
              (allocData.data as Allocation[]).find(
                (a) => a.candidateId === cand.id && a.status === "Active"
              ) ?? null;
          }
        }

        let docs: CandidateDocumentSummary[] = [];
        if (docsRes.ok) {
          const docsData = await docsRes.json().catch(() => null);
          if (docsData?.success) {
            docs = docsData.data as CandidateDocumentSummary[];
          }
        }

        let userSession: UserSession | null = null;
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json().catch(() => null);
          userSession = (sessionData?.data as UserSession | null) ?? null;
        }

        if (!active) return;
        setCandidate(cand);
        setAllocation(activeAlloc);
        setDocuments(docs);
        setSession(userSession);
        setLoadState("done");
      } catch {
        if (!active) return;
        setErrorMsg("A network error occurred. Please try again.");
        setLoadState("error");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const documentsByField = new Map(
    documents.map((doc) => [doc.field, doc])
  );

  /* ── Loading ── */
  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-[#f4f6f4]">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md sm:px-8">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-10">
          <SkeletonCard lines={4} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Unauthorized ── */
  if (loadState === "unauthorized") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Session Expired</h1>
          <p className="text-sm text-slate-600">
            You must be signed in to view candidate records.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  /* ── Not Found ── */
  if (loadState === "not-found") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <UserX className="w-7 h-7 text-slate-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Candidate Not Found</h1>
          <p className="text-sm text-slate-600">
            No record with ID <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{id}</code> exists in the registry.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Generic Error ── */
  if (loadState === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Unable to Load Record</h1>
          <p className="text-sm text-slate-600">{errorMsg}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const statusColor: Record<string, string> = {
    Allocated: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Verified: "bg-blue-50 text-blue-700 border-blue-200",
    Registered: "bg-slate-100 text-slate-600 border-slate-200",
    "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="min-h-screen bg-[#f4f6f4] font-sans">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center gap-4 shadow-sm print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-mono truncate">
            Candidate Registry / {candidate.fullName}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${statusColor[candidate.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
          >
            {candidate.status}
          </span>
        </div>
      </header>

      {/* ── Page Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 print:px-0 print:py-4">

        {/* ── Hero Card: Identity ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Green accent top bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400" />

          <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start">
            {/* Photo */}
            <div className="relative shrink-0">
              <Avatar
                src={candidate.photoUrl || undefined}
                name={candidate.fullName}
                alt={candidate.fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200 shadow-sm bg-slate-100"
                textClassName="text-2xl"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                    {candidate.fullName}
                  </h1>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    {candidate.partyAffiliation}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-mono">
                  S/D/W of {candidate.fatherName}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-xs">{candidate.cnic}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs">{candidate.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs">DOB: {candidate.dob}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs">{candidate.gender}</span>
                </div>
                {candidate.appliedRole && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs">{candidate.appliedRole}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">{candidate.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Current Appointment (if allocated) ── */}
        {allocation && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold uppercase tracking-wide text-xs">
                <Award className="w-4 h-4 text-amber-500" />
                Current Official Appointment
              </div>
              <span className="font-mono text-xs font-bold bg-emerald-700 text-white px-2.5 py-1 rounded-lg">
                {allocation.appointmentRefNo}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Role Designation", value: allocation.roleTitle },
                { label: "Department / Board", value: allocation.department },
                { label: "Honorarium / Stipend", value: allocation.salaryOrStipend || "Gov Allowance" },
                { label: "Issuing Authority", value: allocation.allocatedBy },
                { label: "District", value: allocation.district },
                { label: "Constituency", value: allocation.constituency },
                { label: "Allocated Date", value: new Date(allocation.allocatedDate).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }) },
                { label: "Tenure (months)", value: String(allocation.tenureMonths) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/70 rounded-xl border border-emerald-100 p-3">
                  <span className="text-[10px] text-emerald-700 block font-semibold uppercase tracking-wide mb-0.5">{label}</span>
                  <span className="text-sm font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {allocation.remarks && (
              <div className="bg-white/60 border border-emerald-100 rounded-xl p-3">
                <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wide block mb-1">Remarks</span>
                <p className="text-xs text-slate-700 leading-relaxed">{allocation.remarks}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Regional & Domicile ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase text-emerald-700 tracking-widest flex items-center gap-2">
            <Building className="w-3.5 h-3.5" />
            Regional &amp; Domicile Alignment
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Domicile District", value: candidate.domicileDistrict },
              { label: "Constituency", value: candidate.constituency, highlight: true },
              { label: "Tehsil", value: candidate.tehsil || "Not provided" },
              { label: "Union Council", value: candidate.unionCouncil || "Not provided" },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide block mb-0.5">{label}</span>
                <span className={`text-sm font-bold ${highlight ? "text-emerald-700" : "text-slate-800"}`}>{value}</span>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide block mb-0.5">
                Residential Address
              </span>
              <span className="text-sm font-medium text-slate-800">{candidate.address}</span>
            </div>
          </div>
        </div>

        {/* ── Academic Credentials ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase text-emerald-700 tracking-widest flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Academic Credentials &amp; Proof Records
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matriculation */}
            <div className="border border-slate-200 rounded-xl bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-slate-800">Matriculation (SSC)</span>
                <span
                  className={`font-bold text-[9px] px-2 py-0.5 rounded uppercase ${
                    documentsByField.has("matricDoc")
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {documentsByField.has("matricDoc") ? "Verified" : "No Document"}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">Board</span>
                  <p className="font-semibold text-slate-800">{candidate.matricDetails.board || "Not provided"}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <span className="text-slate-400">Year</span>
                    <p className="font-semibold text-slate-800">{candidate.matricDetails.passingYear || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Grade</span>
                    <p className="font-semibold text-slate-800">{candidate.matricDetails.grade || "Not provided"}</p>
                  </div>
                </div>
                {documentsByField.get("matricDoc") ? (
                  <button
                    type="button"
                    onClick={() => {
                      const d = documentsByField.get("matricDoc")!;
                      setPreview({ url: d.url, fileName: d.fileName, mimeType: d.mimeType });
                    }}
                    className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1 hover:underline cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="text-[11px]">
                      {documentsByField.get("matricDoc")!.fileName} ({Math.round(documentsByField.get("matricDoc")!.sizeBytes / 1024)} KB, {documentsByField.get("matricDoc")!.savedPercent}% saved)
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold pt-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="text-[11px]">No certificate uploaded yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Intermediate */}
            <div className="border border-slate-200 rounded-xl bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-slate-800">Intermediate (HSSC)</span>
                <span
                  className={`font-bold text-[9px] px-2 py-0.5 rounded uppercase ${
                    documentsByField.has("fscDoc")
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {documentsByField.has("fscDoc") ? "Verified" : "No Document"}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">Board</span>
                  <p className="font-semibold text-slate-800">
                    {candidate.fscDetails.board || "Not provided"}
                    {candidate.fscDetails.group ? ` (${candidate.fscDetails.group})` : ""}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <span className="text-slate-400">Year</span>
                    <p className="font-semibold text-slate-800">{candidate.fscDetails.passingYear || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Grade</span>
                    <p className="font-semibold text-slate-800">{candidate.fscDetails.grade || "Not provided"}</p>
                  </div>
                </div>
                {documentsByField.get("fscDoc") ? (
                  <button
                    type="button"
                    onClick={() => {
                      const d = documentsByField.get("fscDoc")!;
                      setPreview({ url: d.url, fileName: d.fileName, mimeType: d.mimeType });
                    }}
                    className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1 hover:underline cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="text-[11px]">
                      {documentsByField.get("fscDoc")!.fileName} ({Math.round(documentsByField.get("fscDoc")!.sizeBytes / 1024)} KB, {documentsByField.get("fscDoc")!.savedPercent}% saved)
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold pt-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="text-[11px]">No certificate uploaded yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Identity &amp; Supporting Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CANDIDATE_DOCUMENT_FIELDS.map((field) => {
                const doc = documentsByField.get(field);
                return (
                  <div
                    key={field}
                    className="border border-slate-200 rounded-xl bg-slate-50/60 p-3.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {CANDIDATE_DOCUMENT_LABELS[field]}
                      </p>
                      {doc ? (
                        <p className="text-[10px] text-slate-500 truncate" title={doc.fileName}>
                          {doc.fileName} • {Math.round(doc.originalSizeBytes / 1024)} KB → {Math.round(doc.sizeBytes / 1024)} KB
                          {doc.savedPercent > 0 ? ` (−${doc.savedPercent}%)` : ""}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400">No document uploaded</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {doc && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setPreview({ url: doc.url, fileName: doc.fileName, mimeType: doc.mimeType })
                            }
                            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          <a
                            href={doc.url.includes("?") ? `${doc.url}&download=1` : `${doc.url}?download=1`}
                            className="inline-flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Save
                          </a>
                        </>
                      )}
                      {canManageDocs && (
                        <>
                          <input
                            ref={(el) => {
                              fileInputs.current[field] = el;
                            }}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              if (file) void handleReplace(field, file);
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingField === field}
                            onClick={() => fileInputs.current[field]?.click()}
                            className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-wait"
                          >
                            {uploadingField === field ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            {doc ? "Replace" : "Upload"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Higher Education */}
          {candidate.higherEducation && candidate.higherEducation.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Higher Education
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {candidate.higherEducation.map((edu, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl bg-slate-50/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-sm font-bold text-slate-800">{edu.degreeName}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{edu.level}</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-600">
                      <div>
                        <span className="text-slate-400">Institute</span>
                        <p className="font-semibold text-slate-800">{edu.institute}</p>
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <span className="text-slate-400">Year</span>
                          <p className="font-semibold text-slate-800">{edu.passingYear}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Grade</span>
                          <p className="font-semibold text-slate-800">{edu.grade}</p>
                        </div>
                      </div>
                      {edu.documentUrl && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
                          <FileCheck className="w-3 h-3" />
                          <span className="text-[11px] break-all">{edu.documentUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        {candidate.notes && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3">
              Internal Notes
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{candidate.notes}</p>
          </div>
        )}

        {/* ── Footer Meta ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2 text-[11px] text-slate-400 font-mono">
          <span>
            <span className="text-slate-500 font-semibold">Candidate ID:</span> {candidate.id}
          </span>
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Registered:{" "}
              {new Date(candidate.registeredAt).toLocaleDateString("en-PK", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
      <DocumentPreviewModal target={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

export default function CandidateDossierPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Loading candidate dossier…</p>
          </div>
        </div>
      }
    >
      <CandidateDossierContent {...props} />
    </Suspense>
  );
}
