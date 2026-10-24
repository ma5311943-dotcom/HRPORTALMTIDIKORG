import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  authenticateCandidate,
  issueSessionToken,
  setSessionCookie,
} from "@/lib/server-auth";

/**
 * Candidate portal authentication.
 * Passwords are scrypt hashes for candidates who set one during enrolment.
 * Legacy candidates may sign in with their CNIC digits.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json().catch(() => null)) as {
      cnic?: string;
      password?: string;
    } | null;

    if (!body) {
      throw new ApiError(400, "Invalid request body. Expected JSON.");
    }

    const cnic = (body.cnic || "").trim();
    const password = body.password || "";
    const result = await authenticateCandidate(cnic, password);
    const candidate = await db.getCandidateById(result.candidateId);
    if (!candidate) {
      throw new ApiError(401, "Candidate record not found.");
    }

    const token = await issueSessionToken({
      sub: result.candidateId,
      kind: "candidate",
    });
    const response = NextResponse.json({ success: true, data: candidate });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
