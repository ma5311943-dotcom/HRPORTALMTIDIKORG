import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { processDocument } from "@/lib/document";
import { MAX_DOCUMENT_UPLOAD_BYTES } from "@/lib/document";
import {
  apiErrorResponse,
  assertSameOrigin,
  requireSession,
  requirePermission,
  type UserSession,
} from "@/lib/server-auth";
import { assertDocumentField } from "@/lib/document";
import type { Candidate, CandidateDocumentField, CandidateDocumentSummary } from "@/types";

function assertCanAccessCandidate(session: UserSession, candidate: Candidate) {
  if (session.isCandidate) {
    if (session.candidateId !== candidate.id) {
      throw new DomainError(403, "You can only view your own documents.");
    }
    return;
  }
  if (
    session.district &&
    session.district !== "All" &&
    candidate.domicileDistrict.toLowerCase() !== session.district.toLowerCase()
  ) {
    throw new DomainError(403, "This candidate is outside your assigned district.");
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const candidate = await db.getCandidateById(id);
    if (!candidate) {
      throw new DomainError(404, "Candidate not found.");
    }
    assertCanAccessCandidate(session, candidate);

    const fieldParam = req.nextUrl.searchParams.get("field");
    if (!fieldParam) {
      const documents = await db.listCandidateDocuments(id);
      return NextResponse.json({ success: true, count: documents.length, data: documents });
    }

    const field = assertDocumentField(fieldParam);
    const doc = await db.getCandidateDocument(id, field);
    if (!doc) {
      throw new DomainError(
        404,
        `No document has been uploaded for "${field}" on this candidate.`
      );
    }

    const download = req.nextUrl.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(doc.data), {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": String(doc.sizeBytes),
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(doc.fileName)}"`,
        "X-Content-Type-Options": "nosniff",
        ETag: `"${doc.checksum}"`,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canRegisterCandidates");
    const { id } = await params;
    const candidate = await db.getCandidateById(id);
    if (!candidate) {
      throw new DomainError(404, "Candidate not found.");
    }
    assertCanAccessCandidate(session, candidate);

    const formData = await req.formData().catch(() => null);
    const file = formData?.get("file");
    if (!file || typeof file === "string") {
      throw new DomainError(400, "Attach a file using the 'file' field.");
    }
    const field = assertDocumentField(formData?.get("field"));

    if (file.size === 0) {
      throw new DomainError(400, "The uploaded document is empty.");
    }
    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
      throw new DomainError(
        413,
        "Document is too large. Maximum upload size is 10 MB."
      );
    }

    const input = Buffer.from(await file.arrayBuffer());
    const processed = await processDocument(input, file.type);
    const result = await db.upsertCandidateDocument(id, {
      field: field as CandidateDocumentField,
      fileName: file.name || `${field}.pdf`,
      mimeType: processed.mimeType,
      data: processed.data,
      originalSizeBytes: processed.originalSizeBytes,
      sizeBytes: processed.sizeBytes,
      checksum: processed.checksum,
    });

    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: "candidate.document",
      entityType: "candidate",
      entityId: id,
      detail: `${field} document uploaded for ${candidate.fullName} (${result.fileName}).`,
    });

    return NextResponse.json({
      success: true,
      data: { ...result, kind: processed.kind } satisfies CandidateDocumentSummary & { kind: string },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
