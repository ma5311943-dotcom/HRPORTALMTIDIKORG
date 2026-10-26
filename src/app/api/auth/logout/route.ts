import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  clearSessionCookie,
  getSession,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await getSession(req);
    if (session && !session.isCandidate) {
      await db.logAudit({
        actorId: session.id,
        actorName: session.name,
        actorRole: session.roleCategory,
        actorDistrict: session.district,
        action: "logout",
        entityType: "session",
      });
    }
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
