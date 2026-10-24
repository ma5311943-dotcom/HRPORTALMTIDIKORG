import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  clearSessionCookie,
} from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
