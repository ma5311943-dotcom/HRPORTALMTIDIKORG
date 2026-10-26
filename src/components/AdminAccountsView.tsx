"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  IdCard,
  KeyRound,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { OfficerAccount } from "@/lib/db";
import { Avatar } from "@/components/ui/kit";
import ChangePasswordModal from "@/components/ui/ChangePasswordModal";

export default function AdminAccountsView() {
  const [accounts, setAccounts] = useState<OfficerAccount[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "done">("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ownPasswordModal, setOwnPasswordModal] = useState(false);

  async function loadAccounts() {
    try {
      const res = await fetch("/api/admin/accounts", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to load officer accounts.");
      }
      setAccounts(data.data as OfficerAccount[]);
      setLoadState("done");
    } catch (err: unknown) {
      toast.error("Failed to load accounts", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setLoadState("error");
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/accounts", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Unable to load officer accounts.");
        }
        if (!active) return;
        setAccounts(data.data as OfficerAccount[]);
        setLoadState("done");
      } catch (err: unknown) {
        if (!active) return;
        toast.error("Failed to load accounts", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
        setLoadState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        !q ||
        a.username.includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.roleKey.toLowerCase().includes(q) ||
        a.roleCategory.toLowerCase().includes(q) ||
        (a.district || "").toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const startEdit = (acc: OfficerAccount) => {
    setEditingId(acc.id);
    setEditUsername(acc.username);
    setEditName(acc.name);
    setEditPassword("");
    setEditActive(acc.isActive);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (acc: OfficerAccount) => {
    if (editPassword && editPassword.length < 8) {
      toast.error("Password too short", { description: "New password must be at least 8 characters." });
      return;
    }
    setBusyId(acc.id);
    try {
      const patch: Record<string, unknown> = {};
      if (editUsername !== acc.username) patch.username = editUsername.trim().toLowerCase();
      if (editName !== acc.name) patch.name = editName.trim();
      if (editPassword) patch.password = editPassword;
      if (editActive !== acc.isActive) patch.isActive = editActive;
      if (Object.keys(patch).length === 0) {
        toast.info("No changes to save.");
        cancelEdit();
        return;
      }
      const res = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acc.id, ...patch }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || "Update failed.");
      setAccounts((prev) => prev.map((a) => (a.id === acc.id ? (data.data as OfficerAccount) : a)));
      toast.success("Account updated", {
        description: `${data.data.username} saved successfully.`,
      });
      cancelEdit();
    } catch (err: unknown) {
      toast.error("Account update failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold">Loading officer accounts…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-900">
            <IdCard className="h-6 w-6 text-emerald-700" />
            Officer Account Management
          </h2>
          <p className="text-xs text-slate-500">
            Admin only — change login usernames, reset passwords, rename officers, and enable or disable access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOwnPasswordModal(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <KeyRound className="h-4 w-4 text-emerald-700" />
          <span>Change My Password</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by username, name, role, or district..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Accounts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[720px] text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 shadow-[0_1px_0_0_#e2e8f0]">
                <th className="py-3 px-3">Officer</th>
                <th className="py-3 px-3">Login Username</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500">
                    No officer accounts match this search.
                  </td>
                </tr>
              )}
              {filtered.map((acc) => {
                const isEditing = editingId === acc.id;
                return (
                  <tr key={acc.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={acc.avatar || undefined}
                          name={acc.name}
                          alt={acc.name}
                          className="w-8 h-8 rounded-full border border-slate-200 shadow-xs"
                          textClassName="text-[10px]"
                        />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          />
                        ) : (
                            <div>
                              <div className="font-bold text-slate-900">{acc.name}</div>
                              <div className="text-[10px] text-slate-400">{acc.title || acc.roleCategory}</div>
                            </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                      ) : (
                        <span className="font-bold text-emerald-800">{acc.username}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">{acc.roleCategory}</td>
                    <td className="py-3 px-3">{acc.district || "—"}</td>
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold">
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            className="h-4 w-4 accent-emerald-700"
                          />
                          {editActive ? "Active" : "Disabled"}
                        </label>
                      ) : acc.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <UserCheck className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          <ShieldOff className="h-3 w-3" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="text"
                            placeholder="New password (optional)"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          />
                          <button
                            type="button"
                            onClick={() => void saveEdit(acc)}
                            disabled={busyId === acc.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
                          >
                            {busyId === acc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(acc)}
                          disabled={busyId !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Manage
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Password changes take effect immediately — officers must sign in again with the new password.
            The admin cannot reset their own account password here; use “Change My Password”.
          </span>
        </p>
      </div>

      {ownPasswordModal && (
        <ChangePasswordModal variant="officer" onClose={() => setOwnPasswordModal(false)} />
      )}
    </div>
  );
}
