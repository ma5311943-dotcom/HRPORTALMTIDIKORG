"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  History,
  Loader2,
  ScrollText,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { AuditEntry } from "@/lib/db";
import { Pagination, SortHeader, paginate, useSortable } from "@/components/ui/kit";

const ACTION_GROUPS = [
  { value: "All", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "password.change", label: "Password Change" },
  { value: "candidate.create", label: "Candidate Create" },
  { value: "candidate.update", label: "Candidate Update" },
  { value: "candidate.delete", label: "Candidate Delete" },
  { value: "candidate.bulk.verify", label: "Bulk Verify" },
  { value: "allocation.create", label: "Allocation" },
  { value: "allocation.revoke", label: "Revocation" },
  { value: "account.update", label: "Account Update" },
  { value: "message.send", label: "Memo Sent" },
];

export default function AuditLogView({ district }: { district?: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "done">("loading");
  const [actionFilter, setActionFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (actionFilter !== "All") params.set("action", actionFilter);
        if (district && district !== "All") params.set("district", district);
        const res = await fetch(`/api/audit-log?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Unable to load the audit trail.");
        }
        if (!active) return;
        setEntries(data.data as AuditEntry[]);
        setLoadState("done");
      } catch (err: unknown) {
        if (!active) return;
        toast.error("Failed to load audit log", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
        setLoadState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [actionFilter, district, reloadKey]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        !q ||
        e.actorName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.detail || "").toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const auditRows = useMemo(
    () =>
      filtered.map((e) => ({
        entry: e,
        createdAt: e.createdAt,
        actorName: e.actorName,
        action: e.action,
        detail: e.detail || "",
      })),
    [filtered]
  );
  const { sorted: sortedRows, sortKey, sortDir, toggle } = useSortable(auditRows, "createdAt");
  const [page, setPage] = useState(1);
  const { pageRows, pageCount, safePage } = useMemo(
    () => paginate(sortedRows, page, 15),
    [sortedRows, page]
  );

  const formatAction = (action: string) => action.replace(/\./g, " · ");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-900">
            <History className="h-6 w-6 text-emerald-700" />
            System Audit Log
          </h2>
          <p className="text-xs text-slate-500">
            Admin only — chronological trail of logins, registrations, allocations, and account changes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoadState("loading");
            setReloadKey((k) => k + 1);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <Loader2 className={`h-4 w-4 text-emerald-700 ${loadState === "loading" ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by officer, action, or detail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-2.5 py-2.5 text-xs font-semibold text-slate-700"
        >
          {ACTION_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
        {loadState === "loading" ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold">Loading audit trail…</p>
          </div>
        ) : (
          <div className="overflow-x-auto lg:max-h-[560px] lg:overflow-y-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                  <th className="py-3 px-3">
                    <SortHeader label="When" field="createdAt" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
                  </th>
                  <th className="py-3 px-3">
                    <SortHeader label="Officer" field="actorName" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
                  </th>
                  <th className="py-3 px-3">
                    <SortHeader label="Action" field="action" sortKey={sortKey} sortDir={sortDir} onToggle={toggle} />
                  </th>
                  <th className="py-3 px-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sortedRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-500">
                      <ScrollText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No audit entries match this filter yet.
                    </td>
                  </tr>
                )}
                {pageRows.map(({ entry }) => (
                  <tr key={entry.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="whitespace-nowrap py-2.5 px-3">
                      <div className="font-semibold text-slate-900">
                        {new Date(entry.createdAt).toLocaleString("en-PK", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">PKT</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{entry.actorName}</div>
                      <div className="text-[10px] text-slate-500">
                        {entry.actorRole}
                        {entry.actorDistrict && entry.actorDistrict !== "All" ? ` • ${entry.actorDistrict}` : ""}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800">
                        {formatAction(entry.action)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="line-clamp-2">{entry.detail || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sortedRows.length > 15 && loadState !== "loading" && (
          <div className="border-t border-slate-100 pt-1">
            <Pagination page={safePage} pageCount={pageCount} total={sortedRows.length} onChange={setPage} />
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <span>
          Entries are written automatically by the server on every sensitive action. The log is append-only
          and cannot be edited or deleted from the portal.
        </span>
      </p>
    </div>
  );
}
