import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requirePermission,
  requireSession,
} from "@/lib/server-auth";
import type { Candidate } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    if (session.isCandidate && session.candidateId !== id) {
      throw new ApiError(403, "You can only view your own candidate record.");
    }
    const candidate = await db.getCandidateById(id);
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found." },
        { status: 404 }
      );
    }
    if (
      !session.isCandidate &&
      session.district &&
      session.district !== "All" &&
      candidate.domicileDistrict.toLowerCase() !== session.district.toLowerCase()
    ) {
      throw new ApiError(403, "This candidate is outside your assigned district.");
    }
    return NextResponse.json({ success: true, data: candidate });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canRegisterCandidates");
    const { id } = await params;
    const existing = await db.getCandidateById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Candidate not found." },
        { status: 404 }
      );
    }
    if (
      session.district &&
      session.district !== "All" &&
      existing.domicileDistrict.toLowerCase() !== session.district.toLowerCase()
    ) {
      throw new ApiError(403, "This candidate is outside your assigned district.");
    }

    const body = (await req.json().catch(() => null)) as Partial<Candidate> | null;
    if (!body) throw new ApiError(400, "Invalid request body.");

    const updates = { ...body };
    delete updates.id;
    delete updates.registeredAt;
    delete updates.allocatedRoleId;
    delete updates.photoUrl;
    if (
      updates.domicileDistrict &&
      session.district !== "All" &&
      updates.domicileDistrict.toLowerCase() !== session.district.toLowerCase()
    ) {
      throw new ApiError(403, "You cannot move a candidate outside your assigned district.");
    }
    const updated = await db.updateCandidate(id, updates);
    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: "candidate.update",
      entityType: "candidate",
      entityId: id,
      detail: `Updated ${updated.fullName} (${Object.keys(updates).join(", ").slice(0, 300)}).`,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canManageDistricts");
    const { id } = await params;
    const existing = await db.getCandidateById(id);
    const deleted = await db.deleteCandidate(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Candidate not found." },
        { status: 404 }
      );
    }
    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: "candidate.delete",
      entityType: "candidate",
      entityId: id,
      detail: `Deleted ${existing?.fullName ?? id} (${existing?.cnic ?? ""}).`,
    });
    return NextResponse.json({ success: true, message: "Candidate deleted successfully." });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
