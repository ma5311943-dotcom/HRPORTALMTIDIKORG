import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requirePermission,
} from "@/lib/server-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canRevokeAllocations");
    const { id } = await params;
    const existing = await db.getAllocationById(id);
    if (!existing) {
      throw new ApiError(404, "Allocation not found.");
    }
    if (
      session.district &&
      session.district !== "All" &&
      existing.district.toLowerCase() !== session.district.toLowerCase()
    ) {
      throw new ApiError(403, "This allocation is outside your assigned district.");
    }
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      reason?: string;
    } | null;

    if (body?.action !== "revoke") {
      throw new ApiError(400, "Unsupported action.");
    }

    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "Administrative revocation";
    const revoked = await db.revokeAllocation(id, reason, session.name);
    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: "allocation.revoke",
      entityType: "allocation",
      entityId: id,
      detail: `${existing.appointmentRefNo} revoked for ${existing.candidateName}. Reason: ${reason}`,
    });
    return NextResponse.json({ success: true, data: revoked });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
