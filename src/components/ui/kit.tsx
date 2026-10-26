"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

export function SkeletonCard({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] space-y-2 p-4">
        <div className="flex gap-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-slate-500">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-teal-600",
  "bg-cyan-700",
  "bg-amber-600",
  "bg-indigo-600",
  "bg-rose-600",
  "bg-sky-700",
  "bg-lime-700",
];

export function Avatar({
  src,
  alt,
  name,
  className = "w-8 h-8",
  textClassName = "text-[10px]",
}: {
  src?: string;
  alt?: string;
  name: string;
  className?: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => {
    const parts = (name || "?").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "?";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }, [name]);
  const color = useMemo(() => {
    let hash = 0;
    for (const ch of name || "") hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }, [name]);

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center font-bold text-white ${color} ${className}`}
        title={name}
      >
        <span className={textClassName}>{initials}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt ?? name}
      onError={() => setFailed(true)}
      className={`shrink-0 object-cover ${className}`}
    />
  );
}

export type SortDir = "asc" | "desc";

export function useSortable<T extends Record<string, unknown>>(
  rows: T[],
  initialKey: keyof T & string,
  initialDir: SortDir = "asc"
) {
  const [sortKey, setSortKey] = useState<string>(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const toggle = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggle };
}

export function SortHeader({
  label,
  field,
  sortKey,
  sortDir,
  onToggle,
  align = "left",
}: {
  label: string;
  field: string;
  sortKey: string;
  sortDir: SortDir;
  onToggle: (key: string) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === field;
  return (
    <button
      type="button"
      onClick={() => onToggle(field)}
      className={`inline-flex items-center gap-0.5 uppercase font-bold text-[10px] tracking-wider cursor-pointer ${
        active ? "text-teal-800" : ""
      } ${align === "right" ? "float-right" : ""}`}
    >
      {label}
      <span className={`text-[9px] ${active ? "opacity-100" : "opacity-30"}`}>
        {active ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
      </span>
    </button>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const windowStart = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages: number[] = [];
  for (let p = windowStart; p <= Math.min(pageCount, windowStart + 4); p += 1) pages.push(p);

  const go = (event: ChangeEvent<HTMLSelectElement>) => onChange(Number(event.target.value));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-3 text-[11px] text-slate-500">
      <span>
        Showing <strong className="text-slate-700">{total === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, total)}</strong> of{" "}
        <strong className="text-slate-700">{total}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-lg border px-2.5 py-1 font-bold transition-colors cursor-pointer ${
              p === page
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <select
          value={page}
          onChange={go}
          aria-label="Jump to page"
          className="ml-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 font-semibold text-slate-600 cursor-pointer"
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function DonutChart({
  value,
  size = 96,
  stroke = 10,
  color = "#0d9488",
  label,
  sublabel,
  trackClass = "stroke-slate-200",
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  trackClass?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-black leading-none text-slate-900">{label ?? `${Math.round(clamped)}%`}</span>
        {sublabel ? <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">{sublabel}</span> : null}
      </div>
    </div>
  );
}

export function paginate<T>(rows: T[], page: number, pageSize = 10) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  return { pageRows: rows.slice((safePage - 1) * pageSize, safePage * pageSize), pageCount, safePage };
}
