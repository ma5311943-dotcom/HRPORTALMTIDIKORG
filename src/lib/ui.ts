import type {
  Allocation,
  CandidateStatus,
  ChatMessage,
  PoliticalParty,
  RoleCategory,
} from "@/types";

/** Combine conditional class names without pulling in an extra dependency. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Colour system
 * Green is reserved for "official / primary" states. Party and role colours are
 * intentionally varied but muted so dashboards do not become a wall of green.
 */
export const PARTY_STYLES: Record<PoliticalParty, string> = {
  PTI: "bg-rose-50 text-rose-800 border-rose-200",
  PMLN: "bg-lime-50 text-lime-800 border-lime-200",
  PPP: "bg-red-50 text-red-800 border-red-200",
  "JUI-F": "bg-amber-50 text-amber-800 border-amber-200",
  "MQM-P": "bg-orange-50 text-orange-800 border-orange-200",
  JI: "bg-teal-50 text-teal-800 border-teal-200",
  ANP: "bg-red-50 text-red-900 border-red-200",
  TLP: "bg-emerald-50 text-emerald-900 border-emerald-200",
  Independent: "bg-slate-100 text-slate-700 border-slate-200",
};

export const PARTY_LABELS: Record<PoliticalParty, string> = {
  PTI: "PTI",
  PMLN: "PML-N",
  PPP: "PPP",
  "JUI-F": "JUI-F",
  "MQM-P": "MQM-P",
  JI: "JI",
  ANP: "ANP",
  TLP: "TLP",
  Independent: "Independent",
};

export const ROLE_STYLES: Record<RoleCategory, string> = {
  MNA: "bg-emerald-50 text-emerald-800 border-emerald-200",
  MPA: "bg-teal-50 text-teal-800 border-teal-200",
  "District Chairperson": "bg-amber-50 text-amber-800 border-amber-200",
  "Union Council Chairman": "bg-sky-50 text-sky-800 border-sky-200",
  Councilor: "bg-indigo-50 text-indigo-800 border-indigo-200",
  "Civil Administration Officer": "bg-slate-100 text-slate-800 border-slate-200",
  "Committee Head": "bg-violet-50 text-violet-800 border-violet-200",
  "Public Sector Staff": "bg-stone-100 text-stone-800 border-stone-200",
};

export const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  Registered: "bg-amber-50 text-amber-800 border-amber-200",
  Verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Allocated: "bg-emerald-700 text-white border-emerald-800",
  "Under Review": "bg-sky-50 text-sky-800 border-sky-200",
};

export const ALLOCATION_STATUS_STYLES: Record<Allocation["status"], string> = {
  Active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Completed: "bg-slate-100 text-slate-700 border-slate-200",
  Revoked: "bg-red-50 text-red-700 border-red-200",
};

export const PRIORITY_STYLES: Record<
  ChatMessage["priority"],
  { badge: string; label: string; dot: string }
> = {
  Urgent: {
    badge: "bg-red-50 text-red-800 border-red-200",
    label: "Urgent Directive",
    dot: "bg-red-500",
  },
  "Official Notice": {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    label: "Official Notice",
    dot: "bg-amber-500",
  },
  Routine: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    label: "Routine Memorandum",
    dot: "bg-emerald-500",
  },
  Inquiry: {
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    label: "Administrative Inquiry",
    dot: "bg-sky-500",
  },
};

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatPkDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatPkDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Returns a same-origin redirect target, preventing open redirects. */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
