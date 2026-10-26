import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, requireSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireSession(req);
    const district = req.nextUrl.searchParams.get("district");
    if (district) {
      const usage = await db.getDistrictQuotaUsage(district);
      if (!usage) {
        return NextResponse.json(
          { success: false, error: "District is not registered in the quota system." },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: usage });
    }
    const rows = await db.getDistrictQuotaUsageAll();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
