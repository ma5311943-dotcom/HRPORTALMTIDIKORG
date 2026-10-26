import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requirePermission,
  requireSession,
} from "@/lib/server-auth";
import type { RoleCategory } from "@/types";

const VALID_ROLE_CATEGORIES: RoleCategory[] = [
  "Ward Boy",
  "Helper Boy",
  "Stretcher Puller",
  "Security Guard",
  "Male Ward Attendant",
  "Female Ward Attendant",
  "Junior Clerk",
  "Reception",
  "Computer Operator",
];

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district") || undefined;
    const role = searchParams.get("role") || undefined;
    const party = searchParams.get("party") || undefined;
    const search = searchParams.get("search") || undefined;

    const allocations = await db.getAllocations({ district, role, party, search });
    const scopedByDistrict =
      !session.isCandidate && session.district && session.district !== "All"
        ? allocations.filter(
            (allocation) =>
              allocation.district.toLowerCase() === session.district.toLowerCase()
          )
        : allocations;
    const visible = session.isCandidate
      ? scopedByDistrict.filter((allocation) => allocation.candidateId === session.candidateId)
      : scopedByDistrict;

    return NextResponse.json({
      success: true,
      count: visible.length,
      data: visible,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canAllocateSeats");
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ApiError(400, "Invalid request body.");

    const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
    const roleCategory = body.roleCategory as RoleCategory;
    const roleTitle = typeof body.roleTitle === "string" ? body.roleTitle.trim() : "";
    const department = typeof body.department === "string" ? body.department.trim() : "";
    const district = typeof body.district === "string" ? body.district.trim() : "";
    const constituency =
      typeof body.constituency === "string" ? body.constituency.trim() : "";

    if (!candidateId || !roleTitle || !department || !district || !constituency) {
      throw new ApiError(400, "Missing required fields for seat/job allocation.");
    }
    if (!VALID_ROLE_CATEGORIES.includes(roleCategory)) {
      throw new ApiError(400, "Invalid role category.");
    }
    if (session.district && session.district !== "All") {
      if (district.toLowerCase() !== session.district.toLowerCase()) {
        throw new ApiError(403, "You can only allocate seats within your assigned district.");
      }
      const candidate = await db.getCandidateById(candidateId);
      if (!candidate) throw new ApiError(404, "Candidate not found.");
      if (candidate.domicileDistrict.toLowerCase() !== session.district.toLowerCase()) {
        throw new ApiError(403, "This candidate is outside your assigned district.");
      }
    }

    const allocation = await db.allocateSeat({
      candidateId,
      roleCategory,
      roleTitle,
      department,
      district,
      constituency,
      tenureMonths: Number(body.tenureMonths) || 24,
      allocatedBy: session.name,
      joiningOrderNo: typeof body.joiningOrderNo === "string" ? body.joiningOrderNo : undefined,
      salaryOrStipend:
        typeof body.salaryOrStipend === "string" ? body.salaryOrStipend.trim() : "",
      remarks:
        typeof body.remarks === "string" ? body.remarks.trim() : "",
    });

    return NextResponse.json({ success: true, data: allocation }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
