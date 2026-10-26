import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { compressImage, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image";
import {
  apiErrorResponse,
  assertSameOrigin,
  requirePermission,
  requireSession,
  type UserSession,
} from "@/lib/server-auth";
import type { Candidate } from "@/types";

function assertCanAccessCandidate(session: UserSession, candidate: Candidate) {
  if (session.isCandidate) {
    if (session.candidateId !== candidate.id) {
      throw new DomainError(403, "You can only view your own photograph.");
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

    const image = await db.getCandidateImage(id);
    if (!image) {
      throw new DomainError(404, "No photograph has been uploaded for this candidate.");
    }

    const etag = `"${image.checksum}"`;
    if (req.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag },
      });
    }

    return new NextResponse(new Uint8Array(image.data), {
      status: 200,
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(image.sizeBytes),
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Disposition": 'inline; filename="candidate-photo.webp"',
        "X-Content-Type-Options": "nosniff",
        ETag: etag,
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
    const file = formData?.get("photo");
    if (!file || typeof file === "string") {
      throw new DomainError(400, "Attach an image using the 'photo' field.");
    }
    if (file.size === 0) {
      throw new DomainError(400, "The uploaded image is empty.");
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new DomainError(413, "Image is too large. Maximum upload size is 8 MB.");
    }

    const input = Buffer.from(await file.arrayBuffer());
    const compressed = await compressImage(input);
    const result = await db.upsertCandidateImage(id, compressed);

    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: "candidate.photo",
      entityType: "candidate",
      entityId: id,
      detail: `Photo uploaded for ${candidate.fullName} (${compressed.sizeBytes} bytes, WebP).`,
    });

    return NextResponse.json({
      success: true,
      data: {
        photoUrl: result.photoUrl,
        mimeType: compressed.mimeType,
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
