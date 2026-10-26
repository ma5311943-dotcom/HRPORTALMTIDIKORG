import { createHash } from "node:crypto";
import { DomainError } from "@/lib/errors";
import { compressImage, STORED_IMAGE_MIME_TYPE } from "@/lib/image";
import type { CandidateDocumentField } from "@/types";
import { CANDIDATE_DOCUMENT_FIELDS } from "@/types";

export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type ProcessedDocument = {
  mimeType: string;
  data: Buffer;
  originalSizeBytes: number;
  sizeBytes: number;
  savedPercent: number;
  checksum: string;
  kind: "pdf" | "image";
};

export function assertDocumentField(field: unknown): CandidateDocumentField {
  if (
    typeof field !== "string" ||
    !CANDIDATE_DOCUMENT_FIELDS.includes(field as CandidateDocumentField)
  ) {
    throw new DomainError(
      400,
      "Unknown document field. Use one of: cnicFront, cnicBack, matricDoc, fscDoc."
    );
  }
  return field as CandidateDocumentField;
}

export async function processDocument(
  input: Buffer,
  declaredType: string
): Promise<ProcessedDocument> {
  if (input.length === 0) {
    throw new DomainError(400, "The uploaded document is empty.");
  }
  if (input.length > MAX_DOCUMENT_UPLOAD_BYTES) {
    throw new DomainError(
      413,
      "Document is too large. Maximum upload size is 10 MB."
    );
  }
  if (!ALLOWED_DOCUMENT_TYPES.has(declaredType)) {
    throw new DomainError(415, "Only PDF, JPG, PNG, and WEBP files are supported.");
  }

  const checksum = (buffer: Buffer) =>
    createHash("sha256").update(buffer).digest("hex");

  if (declaredType === "application/pdf") {
    if (input.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new DomainError(400, "The uploaded file is not a valid PDF document.");
    }
    return {
      mimeType: "application/pdf",
      data: input,
      originalSizeBytes: input.length,
      sizeBytes: input.length,
      savedPercent: 0,
      checksum: checksum(input),
      kind: "pdf",
    };
  }

  const compressed = await compressImage(input);
  const savedPercent = Math.max(
    0,
    Math.round((1 - compressed.sizeBytes / Math.max(1, input.length)) * 100)
  );
  return {
    mimeType: STORED_IMAGE_MIME_TYPE,
    data: compressed.data,
    originalSizeBytes: input.length,
    sizeBytes: compressed.sizeBytes,
    savedPercent,
    checksum: checksum(compressed.data),
    kind: "image",
  };
}
