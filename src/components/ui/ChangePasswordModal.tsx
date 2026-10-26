"use client";

import React, { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordModal({
  variant,
  onClose,
  onSuccess,
}: {
  variant: "officer" | "candidate";
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const endpoint =
    variant === "officer" ? "/api/auth/change-password" : "/api/auth/candidate/change-password";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const strength = Math.max(
    0,
    Math.min(
      4,
      [
        newPassword.length >= 8,
        newPassword.length >= 12,
        /[A-Z]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword),
        /\d/.test(newPassword),
      ].filter(Boolean).length
    )
  );
  const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-teal-500", "bg-emerald-600"];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password too short", { description: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Password change failed.");
      toast.success("Password updated", {
        description: "Use your new password next time you sign in.",
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error("Password change failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 id="change-password-title" className="text-sm font-bold text-slate-900">
                Change Password
              </h3>
              <p className="text-[10px] text-slate-500">
                {variant === "officer" ? "Officer account security" : "Candidate portal security"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
            aria-label="Close change password dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 p-4 text-xs">
          <div>
            <label className="mb-1 block font-bold text-slate-700">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 p-2.5 pr-9 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 p-2.5 pr-9 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex h-1 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-full ${i < strength ? strengthColors[strength] : "bg-slate-200"}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-500">{strengthLabels[strength]}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="mt-1 text-[10px] font-semibold text-red-600">Passwords do not match.</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg px-3 py-2 font-bold text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{busy ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
