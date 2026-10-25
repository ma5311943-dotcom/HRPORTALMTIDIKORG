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
export const PARTY_STYLES: Record<string, string> = {
  "Quota A": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Quota B": "bg-blue-50 text-blue-800 border-blue-200",
  "Quota C": "bg-purple-50 text-purple-800 border-purple-200",
  "Quota D": "bg-amber-50 text-amber-800 border-amber-200",
  "Quota E": "bg-teal-50 text-teal-800 border-teal-200",
  "Quota F": "bg-rose-50 text-rose-800 border-rose-200",
  "DIR-OFFICE": "bg-cyan-50 text-cyan-800 border-cyan-200",
  "MERIT-OPEN": "bg-slate-100 text-slate-800 border-slate-300",
  "DEPT-DIRECT": "bg-rose-50 text-rose-800 border-rose-200",
};

export const PARTY_LABELS: Record<string, string> = {
  "Quota A": "Recommended A",
  "Quota B": "Recommended B",
  "Quota C": "Recommended C",
  "Quota D": "Recommended D",
  "Quota E": "Recommended E",
  "Quota F": "Recommended F",
  "DIR-OFFICE": "Director Office",
  "MERIT-OPEN": "Open Merit",
  "DEPT-DIRECT": "Direct / Open Merit",
};

export const ROLE_STYLES: Record<RoleCategory, string> = {
  "Ward Boy": "bg-blue-50 text-blue-800 border-blue-200",
  "Helper Boy": "bg-indigo-50 text-indigo-800 border-indigo-200",
  "Stretcher Puller": "bg-amber-50 text-amber-800 border-amber-200",
  "Security Guard": "bg-slate-100 text-slate-800 border-slate-300",
  "Male Ward Attendant": "bg-teal-50 text-teal-800 border-teal-200",
  "Female Ward Attendant": "bg-rose-50 text-rose-800 border-rose-200",
  "Junior Clerk": "bg-purple-50 text-purple-800 border-purple-200",
  "Reception": "bg-cyan-50 text-cyan-800 border-cyan-200",
  "Computer Operator": "bg-emerald-50 text-emerald-800 border-emerald-200",
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
