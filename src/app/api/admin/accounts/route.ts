import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorResponse, assertSameOrigin, requireSession } from "@/lib/server-auth";
import { hashPassword } from "@/lib/password";
import { db } from "@/lib/db";

function assertAdmin(session: { roleCategory?: string; permissions: { canManageDistricts: boolean } }) {
  if (session.roleCategory !== "Admin" || !session.permissions.canManageDistricts) {
    throw new ApiError(403, "Only the administrator can manage officer accounts.");
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    assertAdmin(session);
    const accounts = await db.listOfficerAccounts();
    return NextResponse.json({ success: true, count: accounts.length, data: accounts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requireSession(req);
    assertAdmin(session);

    const body = (await req.json().catch(() => null)) as {
      id?: string;
      username?: string;
      name?: string;
      isActive?: boolean;
      password?: string;
    } | null;
    if (!body?.id) throw new ApiError(400, "Account id is required.");
    if (body.password !== undefined && body.password !== "" && body.password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long.");
    }

    const updates: {
      username?: string;
      name?: string;
      isActive?: boolean;
      passwordHash?: string;
    } = {};
    if (typeof body.username === "string" && body.username.trim()) {
      updates.username = body.username;
    }
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.isActive === "boolean") {
      if (body.id === session.id && body.isActive === false) {
        throw new ApiError(400, "You cannot deactivate your own account.");
      }
      updates.isActive = body.isActive;
    }
    if (typeof body.password === "string" && body.password !== "") {
      updates.passwordHash = hashPassword(body.password);
    }
    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "Nothing to update.");
    }

    const account = await db.updateOfficerAccount(body.id, updates);
    await db.logAudit({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.roleCategory,
      actorDistrict: session.district,
      action: "account.update",
      entityType: "user",
      entityId: body.id,
      detail: `Updated account ${account.username} (${Object.keys(updates).join(", ")}).`,
    });

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
