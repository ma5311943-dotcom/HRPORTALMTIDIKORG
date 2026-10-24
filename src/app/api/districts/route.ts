import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/server-auth";

export async function GET() {
  await connection();
  try {
    const districts = await db.getDistricts();
    return NextResponse.json({ success: true, data: districts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
