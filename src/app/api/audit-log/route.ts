import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, requireSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (session.roleCategory !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Only the administrator can view the audit log." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const district = searchParams.get("district") || undefined;
    const limit = Number(searchParams.get("limit")) || 200;
    const entries = await db.getAuditLog({ action, district, limit });
    return NextResponse.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
