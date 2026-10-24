import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, getSession } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
