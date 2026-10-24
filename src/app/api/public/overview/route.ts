import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/server-auth";

export async function GET() {
  await connection();
  try {
    const [districts, analytics] = await Promise.all([
      db.getDistricts(),
      db.getAnalytics(),
    ]);
    const totalQuota = districts.reduce((sum, district) => sum + district.totalQuota, 0);

    return NextResponse.json({
      success: true,
      data: {
        districts,
        stats: {
          totalCandidates: analytics.totalRegistered,
          totalVerified: analytics.totalVerified,
          totalAllocated: analytics.totalAllocated,
          totalDistricts: analytics.totalDistricts,
          totalQuota,
          quotaAlignment:
            totalQuota > 0
              ? Math.min(100, Math.round((analytics.totalAllocated / totalQuota) * 100))
              : 0,
        },
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
