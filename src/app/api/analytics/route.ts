import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse, requireSession } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { searchParams } = new URL(req.url);
    const requestedDistrict = searchParams.get("district") || undefined;
    const district =
      session.district && session.district !== "All"
        ? session.district
        : requestedDistrict;

    const analytics = await db.getAnalytics(district);
    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
