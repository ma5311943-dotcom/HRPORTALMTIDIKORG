import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { ApiError, apiErrorResponse, assertSameOrigin, requireSession } from "@/lib/server-auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requireSession(req);
    if (session.isCandidate) {
      throw new ApiError(403, "Use the candidate portal password settings instead.");
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

    const [user] = await getDb()
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, session.id), eq(schema.users.isActive, true)))
      .limit(1);
    if (!user || !verifyPassword(body.currentPassword, user.passwordHash)) {
      throw new ApiError(401, "Current password is incorrect.");
    }

    await getDb()
      .update(schema.users)
      .set({ passwordHash: hashPassword(body.newPassword), updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, user.id));

    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: "password.change",
      entityType: "user",
      entityId: user.id,
      detail: "Officer changed their own password.",
    });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
