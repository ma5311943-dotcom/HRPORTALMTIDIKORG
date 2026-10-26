import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/server-auth";
import type { Candidate } from "@/types";

function sampleFromCandidate(candidate: Candidate, index: number) {
  return {
    label: candidate.domicileDistrict
      ? `${candidate.fullName.split(" ")[0]} (${candidate.domicileDistrict.replace("Dera Ismail Khan", "D.I. Khan")})`
      : `Candidate ${index + 1}`,
    cnic: candidate.cnic,
  };
}

export async function GET() {
  await connection();
  try {
    const [districts, analytics, candidates] = await Promise.all([
      db.getDistricts(),
      db.getAnalytics(),
      db.getCandidates(),
    ]);
    const totalQuota = districts.reduce((sum, district) => sum + district.totalQuota, 0);
    const sampleCnics = candidates
      .slice(0, 4)
      .map((candidate, index) => sampleFromCandidate(candidate, index));

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
        sampleCnics,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
