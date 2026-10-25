import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  getSession,
  requireSession,
} from "@/lib/server-auth";
import type { Candidate, CandidateStatus, PoliticalParty } from "@/types";

const VALID_STATUSES: CandidateStatus[] = [
  "Registered",
  "Verified",
  "Allocated",
  "Under Review",
];
const VALID_PARTIES: PoliticalParty[] = [
  "Quota A",
  "Quota B",
  "Quota C",
  "Quota D",
  "Quota E",
  "Quota F",
  "DIR-OFFICE",
  "REF-NA-01",
  "REF-NA-02",
  "REF-PA-01",
  "REF-PA-02",
  "REF-DIST-01",
  "REF-NZM-01",
  "REF-NZM-02",
  "MERIT-OPEN",
  "DEPT-DIRECT",
];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);

    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district") || undefined;
    const party = searchParams.get("party") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    if (session.isCandidate) {
      const candidate = session.candidateId
        ? await db.getCandidateById(session.candidateId)
        : undefined;
      return NextResponse.json({
        success: true,
        count: candidate ? 1 : 0,
        data: candidate ? [candidate] : [],
      });
    }

    const scopedDistrict =
      session.district && session.district !== "All"
        ? session.district
        : district;
    const candidates = await db.getCandidates({
      district: scopedDistrict,
      party,
      status,
      search,
    });
    return NextResponse.json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await getSession(req);
    if (session) {
      if (session.isCandidate) {
        throw new ApiError(403, "Candidate accounts cannot register other candidates.");
      }
      if (!session.permissions.canRegisterCandidates) {
        throw new ApiError(403, "You do not have permission to register candidates.");
      }
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      throw new ApiError(400, "Invalid request body. Expected JSON.");
    }

    const fullName = asString(body.fullName);
    const cnic = asString(body.cnic);
    const phone = asString(body.phone);
    const domicileDistrict = asString(body.domicileDistrict);
    const constituency = asString(body.constituency);

    if (!fullName || !cnic || !phone || !domicileDistrict || !constituency) {
      throw new ApiError(
        400,
        "Please fill in all mandatory fields (Name, CNIC, Phone, Domicile District, Constituency)."
      );
    }
    if (fullName.length < 3) {
      throw new ApiError(400, "Full name must be at least 3 characters long.");
    }

    const rawCnic = cnic.replace(/[^0-9]/g, "");
    if (rawCnic.length !== 13) {
      throw new ApiError(
        400,
        "CNIC must be a valid 13-digit Pakistani National ID number (XXXXX-XXXXXXX-X)."
      );
    }
    if (phone.replace(/[^0-9]/g, "").length < 10) {
      throw new ApiError(400, "Please enter a valid Pakistani mobile or landline number.");
    }
    if (
      session &&
      session.district &&
      session.district !== "All" &&
      domicileDistrict.toLowerCase() !== session.district.toLowerCase()
    ) {
      throw new ApiError(403, "You can only register candidates within your assigned district.");
    }

    const password = asString(body.password);
    if (password && password.length < 8) {
      throw new ApiError(400, "Portal password must be at least 8 characters long.");
    }

    const status = session
      ? VALID_STATUSES.includes(body.status as CandidateStatus)
        ? (body.status as CandidateStatus)
        : "Registered"
      : "Registered";

    const party =
      typeof body.partyAffiliation === "string" &&
      VALID_PARTIES.includes(body.partyAffiliation as PoliticalParty)
        ? (body.partyAffiliation as PoliticalParty)
        : "DIR-OFFICE";

    const email = asString(body.email) || `${rawCnic}@dhq.hospital.pk`;
    const requestedPhotoUrl = asString(body.photoUrl);
    const photoUrl =
      requestedPhotoUrl.startsWith("/") && !requestedPhotoUrl.startsWith("//")
        ? requestedPhotoUrl
        : "/images/cand_bilal.jpg";
    const matricDetails =
      body.matricDetails && typeof body.matricDetails === "object"
        ? (body.matricDetails as Candidate["matricDetails"])
        : { board: "BISE D.I. Khan", passingYear: 2020, grade: "A" };
    const fscDetails =
      body.fscDetails && typeof body.fscDetails === "object"
        ? (body.fscDetails as Candidate["fscDetails"])
        : { board: "BISE D.I. Khan", passingYear: 2022, group: "General", grade: "B" };

    const newCandidate = await db.createCandidate({
      fullName,
      fatherName: asString(body.fatherName, "Not Specified"),
      cnic,
      fatherCnic: asString(body.fatherCnic) || undefined,
      dob: asString(body.dob, "1998-05-15"),
      gender:
        body.gender === "Female" || body.gender === "Other"
          ? body.gender
          : "Male",
      phone,
      email,
      address:
        asString(body.address) ||
        `${asString(body.tehsil, "Dera")}, Dera Ismail Khan`,
      domicileDistrict,
      constituency,
      tehsil: asString(body.tehsil, "Dera"),
      unionCouncil: asString(body.unionCouncil) || undefined,
      partyAffiliation: party,
      referenceCode: asString(body.referenceCode) || party,
      appliedRole: asString(body.appliedRole) as any || undefined,
      appointmentOrderNo: asString(body.appointmentOrderNo) || undefined,
      joiningOrderNo: asString(body.joiningOrderNo) || undefined,
      cnicFrontUrl: asString(body.cnicFrontUrl) || undefined,
      cnicBackUrl: asString(body.cnicBackUrl) || undefined,
      photoUrl,
      matricDetails,
      fscDetails,
      higherEducation: Array.isArray(body.higherEducation)
        ? (body.higherEducation as Candidate["higherEducation"])
        : [],
      status,
      notes: session ? asString(body.notes) || undefined : undefined,
      passwordHash: password ? hashPassword(password) : undefined,
    });

    return NextResponse.json({ success: true, data: newCandidate }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
