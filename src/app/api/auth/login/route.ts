import { NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  authenticateOfficer,
  issueSessionToken,
  setSessionCookie,
} from "@/lib/server-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  entry.count += 1;
  if (entry.count > 10) {
    throw new ApiError(429, "Too many login attempts. Try again in a minute.");
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json().catch(() => null)) as {
      identifier?: string;
      password?: string;
    } | null;

    if (!body) {
      throw new ApiError(400, "Invalid request body.");
    }

    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    rateLimit(`${identifier.toLowerCase() || "unknown"}:${req.headers.get("x-forwarded-for") ?? "local"}`);

    const session = await authenticateOfficer(identifier, password);
    const token = await issueSessionToken({ sub: session.id, kind: "user" });
    const response = NextResponse.json({ success: true, data: session });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
