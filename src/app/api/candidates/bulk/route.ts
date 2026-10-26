import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorResponse, assertSameOrigin, requirePermission } from "@/lib/server-auth";
import { db, publicCandidate } from "@/lib/db";
import type { CandidateStatus } from "@/types";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canRegisterCandidates");
    const body = (await req.json().catch(() => null)) as {
      ids?: unknown;
      action?: string;
    } | null;

    const ids = Array.isArray(body?.ids) ? body.ids.filter((v): v is string => typeof v === "string") : [];
    const action = body?.action;
    if (ids.length === 0) throw new ApiError(400, "Select at least one candidate.");
    if (action !== "verify" && action !== "register") {
      throw new ApiError(400, "Unsupported bulk action.");
    }

    const all = await db.getCandidates();
    const scoped = session.district && session.district !== "All"
      ? all.filter((c) => c.domicileDistrict.toLowerCase() === session.district!.toLowerCase())
      : all;
    const scopedIds = new Set(scoped.map((c) => c.id));
    const targets = ids.filter((id) => scopedIds.has(id));
    if (targets.length === 0) {
      throw new ApiError(403, "Selected candidates are outside your assigned district.");
    }

    const status: CandidateStatus = action === "verify" ? "Verified" : "Registered";
    const affected = await db.bulkSetCandidateStatus(targets, status);
    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: `candidate.bulk.${action}`,
      entityType: "candidate",
      detail: `Bulk ${action} on ${affected} candidate(s).`,
    });

    const refreshed = (await db.getCandidates()).filter((c) => targets.includes(c.id));
    return NextResponse.json({
      success: true,
      count: affected,
      data: refreshed.map(publicCandidate),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
