"use client";

import { useEffect } from "react";
import { Download, FileText, X } from "lucide-react";

export type PreviewTarget = {
  url: string;
  fileName: string;
  mimeType: string;
} | null;

export default function DocumentPreviewModal({
  target,
  onClose,
}: {
  target: PreviewTarget;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!target) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [target, onClose]);

  if (!target) return null;

  const isPdf = target.mimeType === "application/pdf" || target.fileName.toLowerCase().endsWith(".pdf");
  const isImage = target.mimeType.startsWith("image/");
  const downloadUrl = target.url.includes("?") ? `${target.url}&download=1` : `${target.url}?download=1`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${target.fileName}`}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900" title={target.fileName}>
                {target.fileName}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Inline document preview
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 cursor-pointer"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100">
          {isPdf ? (
            <iframe src={target.url} title={target.fileName} className="h-[72vh] w-full" />
          ) : isImage ? (
            <div className="flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={target.url}
                alt={target.fileName}
                className="max-h-[68vh] w-auto max-w-full rounded-xl border border-slate-200 bg-white shadow-sm"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center text-slate-500">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold">Preview is not available for this file type.</p>
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <Download className="h-3.5 w-3.5" />
                Download instead
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
