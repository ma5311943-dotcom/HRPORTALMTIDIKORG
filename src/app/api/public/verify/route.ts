import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, assertSameOrigin } from "@/lib/server-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  entry.count += 1;
  if (entry.count > 20) {
    throw new ApiError(429, "Too many verification requests. Please try again shortly.");
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    rateLimit(ip);

    const body = (await req.json().catch(() => null)) as { cnic?: unknown } | null;
    const cnic = typeof body?.cnic === "string" ? body.cnic : "";
    const digits = cnic.replace(/[^0-9]/g, "");
    if (digits.length !== 13) {
      throw new ApiError(400, "Enter a valid 13-digit CNIC number.");
    }

    const candidate = await db.getCandidateByCnic(digits);
    if (!candidate) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No candidate record found for this CNIC.",
      });
    }

    const allocation = await db.getActiveAllocationByCandidate(candidate.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          fullName: candidate.fullName,
          fatherName: candidate.fatherName,
          cnic: candidate.cnic,
          domicileDistrict: candidate.domicileDistrict,
          constituency: candidate.constituency,
          status: candidate.status,
          partyAffiliation: candidate.partyAffiliation,
          matricDetails: candidate.matricDetails,
          fscDetails: candidate.fscDetails,
          allocation: allocation
            ? {
                roleTitle: allocation.roleTitle,
                department: allocation.department,
                district: allocation.district,
                constituency: allocation.constituency,
                appointmentRefNo: allocation.appointmentRefNo,
                allocatedDate: allocation.allocatedDate,
              }
            : null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
