import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { ApiError, apiErrorResponse, assertSameOrigin, getSession } from "@/lib/server-auth";
import { hashPassword, verifyCandidatePassword } from "@/lib/password";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await getSession(req);
    if (!session || !session.isCandidate || !session.candidateId) {
      throw new ApiError(401, "Candidate login required.");
    }
    const body = (await req.json().catch(() => null)) as {
      currentPassword?: string;
      newPassword?: string;
    } | null;
    if (!body?.currentPassword || !body?.newPassword) {
      throw new ApiError(400, "Current and new password are required.");
    }
    if (body.newPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters long.");
    }

    const [candidate] = await getDb()
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.id, session.candidateId))
      .limit(1);
    if (!candidate) throw new ApiError(404, "Candidate record not found.");
    if (!candidate.passwordHash || !verifyCandidatePassword(body.currentPassword, candidate.passwordHash)) {
      throw new ApiError(401, "Current password is incorrect.");
    }

    await getDb()
      .update(schema.candidates)
      .set({ passwordHash: hashPassword(body.newPassword), updatedAt: new Date().toISOString() })
      .where(eq(schema.candidates.id, candidate.id));

    await db.logAudit({
      actorId: `candidate-${candidate.id}`,
      actorName: candidate.fullName,
      actorRole: "Candidate",
      actorDistrict: candidate.domicileDistrict,
      action: "password.change",
      entityType: "candidate",
      entityId: candidate.id,
      detail: "Candidate changed their portal password.",
    });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
