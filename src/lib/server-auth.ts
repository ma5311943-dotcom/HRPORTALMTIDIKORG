import { and, eq, or } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db/client";
import { verifyCandidatePassword, verifyPassword } from "@/lib/password";
import { DomainError } from "@/lib/errors";
import type { UserSession as BaseUserSession } from "@/lib/auth";
import type { UserPermissions } from "@/types";

export const SESSION_COOKIE = "internal_hr_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type UserSession = BaseUserSession;

type SessionToken = {
  sub: string;
  kind: "user" | "candidate";
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short.");
  }
  return new TextEncoder().encode(secret);
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }
  if (error instanceof DomainError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_")
  ) {
    throw error;
  }
  console.error("API error:", error);
  return NextResponse.json(
    { success: false, error: "Unexpected server error." },
    { status: 500 }
  );
}

export function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const origin = req.headers.get("origin");
  if (!origin) return;
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!requestHost || originHost !== requestHost) {
      throw new ApiError(403, "Cross-origin request blocked.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(403, "Invalid request origin.");
  }
}

export async function issueSessionToken(token: SessionToken) {
  return new SignJWT({ ...token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getAuthSecret());
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function readToken(req: NextRequest): Promise<SessionToken | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.sub !== "string" ||
      (payload.kind !== "user" && payload.kind !== "candidate")
    ) {
      return null;
    }
    return { sub: payload.sub, kind: payload.kind };
  } catch {
    return null;
  }
}

function userPermissions(value: unknown): UserPermissions {
  const permissions = (value ?? {}) as Partial<UserPermissions>;
  return {
    canRegisterCandidates: permissions.canRegisterCandidates === true,
    canAllocateSeats: permissions.canAllocateSeats === true,
    canRevokeAllocations: permissions.canRevokeAllocations === true,
    canSendMessage: permissions.canSendMessage === true,
    canGenerateReports: permissions.canGenerateReports === true,
    canManageDistricts: permissions.canManageDistricts === true,
  };
}

export async function getSession(req: NextRequest): Promise<UserSession | null> {
  const token = await readToken(req);
  if (!token) return null;

  if (token.kind === "user") {
    const [user] = await getDb()
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, token.sub), eq(schema.users.isActive, true)))
      .limit(1);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.title,
      roleCategory: user.roleCategory as UserSession["roleCategory"],
      title: user.title,
      department: user.department,
      district: user.district,
      constituency: user.constituency ?? undefined,
      avatar: user.avatar,
      badgeColor: user.badgeColor,
      permissions: userPermissions(user.permissions),
    };
  }

  const [candidate] = await getDb()
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.id, token.sub))
    .limit(1);
  if (!candidate) return null;

  return {
    id: `candidate-${candidate.id}`,
    username: candidate.cnic,
    email: candidate.email,
    name: candidate.fullName,
    role: "Registered Candidate",
    roleCategory: "Candidate",
    isCandidate: true,
    candidateId: candidate.id,
    cnic: candidate.cnic,
    title: `Candidate | ${candidate.constituency}`,
    department: `Constituency Office, ${candidate.domicileDistrict}`,
    district: candidate.domicileDistrict,
    constituency: candidate.constituency,
    avatar: candidate.photoUrl || "/images/candidate_portrait.jpg",
    badgeColor: "bg-emerald-700 text-white",
    permissions: {
      canRegisterCandidates: false,
      canAllocateSeats: false,
      canRevokeAllocations: false,
      canSendMessage: false,
      canGenerateReports: false,
      canManageDistricts: false,
    },
  };
}

export async function requireSession(req: NextRequest): Promise<UserSession> {
  const session = await getSession(req);
  if (!session) {
    throw new ApiError(401, "Authentication required.");
  }
  return session;
}

export async function requirePermission(
  req: NextRequest,
  permission: keyof UserPermissions
): Promise<UserSession> {
  const session = await requireSession(req);
  if (!session.permissions[permission]) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  return session;
}

export async function authenticateOfficer(
  identifier: string,
  password: string
): Promise<UserSession> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  if (!cleanIdentifier || !password) {
    throw new ApiError(400, "Enter your username/email and password.");
  }

  const [user] = await getDb()
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.isActive, true),
        or(
          eq(schema.users.username, cleanIdentifier),
          eq(schema.users.email, cleanIdentifier)
        )
      )
    )
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError(401, "Invalid credentials.");
  }

  await getDb()
    .update(schema.users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(schema.users.id, user.id));

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.title,
    roleCategory: user.roleCategory as UserSession["roleCategory"],
    title: user.title,
    department: user.department,
    district: user.district,
    constituency: user.constituency ?? undefined,
    avatar: user.avatar,
    badgeColor: user.badgeColor,
    permissions: userPermissions(user.permissions),
  };
}

export async function authenticateCandidate(
  cnic: string,
  password: string
): Promise<{ session: UserSession; candidateId: string }> {
  const cleanCnic = cnic.replace(/[^0-9]/g, "");
  if (cleanCnic.length !== 13) {
    throw new ApiError(400, "CNIC must contain exactly 13 digits.");
  }
  if (!password) {
    throw new ApiError(400, "Please enter your portal password.");
  }

  const [candidate] = await getDb()
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.cnicDigits, cleanCnic))
    .limit(1);

  if (!candidate || !verifyCandidatePassword(password, candidate.cnic, candidate.passwordHash ?? undefined)) {
    throw new ApiError(401, "Invalid CNIC or portal password.");
  }

  return {
    candidateId: candidate.id,
    session: {
      id: `candidate-${candidate.id}`,
      username: candidate.cnic,
      email: candidate.email,
      name: candidate.fullName,
      role: "Registered Candidate",
      roleCategory: "Candidate",
      isCandidate: true,
      candidateId: candidate.id,
      cnic: candidate.cnic,
      title: `Candidate | ${candidate.constituency}`,
      department: `Constituency Office, ${candidate.domicileDistrict}`,
      district: candidate.domicileDistrict,
      constituency: candidate.constituency,
      avatar: candidate.photoUrl || "/images/candidate_portrait.jpg",
      badgeColor: "bg-emerald-700 text-white",
      permissions: {
        canRegisterCandidates: false,
        canAllocateSeats: false,
        canRevokeAllocations: false,
        canSendMessage: false,
        canGenerateReports: false,
        canManageDistricts: false,
      },
    },
  };
}
