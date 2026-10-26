import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import sharp from "sharp";
import { getPool } from "../src/db/client";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const SESSION_COOKIE = "internal_hr_session";

type SeedCandidate = {
  id: string;
  fullName: string;
  cnic: string;
};

type RequestOptions = {
  method?: string;
  cookie?: string;
  json?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
  origin?: string | null;
};

type ApiResult = {
  res: Response;
  body: {
    success?: boolean;
    error?: string;
    data?: unknown;
    count?: number;
    message?: string;
  };
};

let checks = 0;
const createdCandidateIds: string[] = [];

function ok(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  checks += 1;
}

function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  checks += 1;
}

function section(name: string) {
  console.log(`\n[test] ${name}`);
}

function cnicFromDigits(digits: string) {
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function uniqueDigits(prefix: string) {
  const suffix = `${Date.now()}`.slice(-8);
  const random = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `${prefix}${suffix}${random}`.slice(0, 13);
}

async function request(pathname: string, options: RequestOptions = {}): Promise<ApiResult> {
  const headers = new Headers(options.headers);
  if (options.cookie) headers.set("Cookie", options.cookie);
  const origin =
    options.origin === null ? null : options.origin ?? BASE_URL;
  if (origin) headers.set("Origin", origin);

  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  } else if (options.form) {
    body = options.form;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${pathname}`, {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch {
    throw new Error(
      `API server is not reachable at ${BASE_URL}. Start it with "npm run dev" first.`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const parsed = contentType.includes("application/json")
    ? ((await res.json()) as ApiResult["body"])
    : ({ message: await res.text() } as ApiResult["body"]);

  return { res, body: parsed };
}

function readCookie(res: Response) {
  const headerBag = res.headers as Headers & { getSetCookie?: () => string[] };
  const cookies =
    headerBag.getSetCookie?.() ??
    [res.headers.get("set-cookie") ?? ""].filter(Boolean);
  const sessionCookie = cookies.find((value) =>
    value.startsWith(`${SESSION_COOKIE}=`)
  );
  ok(sessionCookie, `Login response must set ${SESSION_COOKIE}`);
  const cookie = sessionCookie.split(";")[0];
  return { cookie, raw: sessionCookie };
}

async function loginOfficer(identifier: string, password: string) {
  const result = await request("/api/auth/login", {
    method: "POST",
    json: { identifier, password },
  });
  equal(result.res.status, 200, `Officer login failed for ${identifier}: ${result.body.error ?? "unknown"}`);
  const cookie = readCookie(result.res);
  ok(/HttpOnly/i.test(cookie.raw), "Session cookie must be HttpOnly");
  ok(/SameSite=Lax/i.test(cookie.raw), "Session cookie must be SameSite=Lax");
  ok(/Path=\//i.test(cookie.raw), "Session cookie must be scoped to /");
  return cookie.cookie;
}

async function loginCandidate(cnic: string, password: string) {
  const result = await request("/api/auth/candidate", {
    method: "POST",
    json: { cnic, password },
  });
  equal(result.res.status, 200, `Candidate login failed: ${result.body.error ?? "unknown"}`);
  return readCookie(result.res).cookie;
}

async function uploadPhoto(candidateId: string, data: Buffer, mimeType: string, cookie?: string) {
  const form = new FormData();
  form.append("photo", new Blob([new Uint8Array(data)], { type: mimeType }), "upload");
  return request(`/api/candidates/${candidateId}/photo`, {
    method: "POST",
    form,
    cookie,
  });
}

async function getImage(candidateId: string, cookie?: string, extraHeaders?: Record<string, string>) {
  const headers = new Headers(extraHeaders);
  if (cookie) headers.set("Cookie", cookie);
  return fetch(`${BASE_URL}/api/candidates/${candidateId}/photo`, { headers });
}

async function cleanup(adminCookie?: string) {
  if (adminCookie) {
    for (const id of createdCandidateIds) {
      await request(`/api/candidates/${id}`, {
        method: "DELETE",
        cookie: adminCookie,
      }).catch(() => undefined);
    }
  }
  if (createdCandidateIds.length > 0) {
    const placeholders = createdCandidateIds.map(() => "?").join(",");
    await getPool()
      .query(`DELETE FROM candidate_images WHERE candidate_id IN (${placeholders})`, createdCandidateIds)
      .catch(() => undefined);
    await getPool()
      .query(`DELETE FROM candidates WHERE id IN (${placeholders})`, createdCandidateIds)
      .catch(() => undefined);
  }
}

async function main() {
  let seededCandidate: SeedCandidate | undefined;

  let adminCookie: string | undefined;

  try {
    section("Public endpoints");
    {
      const overview = await request("/api/public/overview");
      equal(overview.res.status, 200, "Public overview must return 200");
      const data = overview.body.data as {
        districts: { name: string }[];
        stats: { totalCandidates: number; totalDistricts: number };
        sampleCnics: SeedCandidate[];
      };
      ok(data.districts.length >= 1, "Public overview must return seeded districts");
      ok(data.stats.totalCandidates >= 1, "Public overview candidate total is incorrect");
      equal(data.stats.totalDistricts, data.districts.length, "Public overview district totals must agree");
      const sampleCnic = data.sampleCnics[0];
      ok(sampleCnic, "Public overview must expose sample CNICs from real candidates");

      const verify = await request("/api/public/verify", {
        method: "POST",
        json: { cnic: sampleCnic.cnic },
      });
      equal(verify.res.status, 200, "Public CNIC verification must return 200");
      const verified = verify.body.data as Record<string, unknown>;
      equal(verified.cnic, sampleCnic.cnic, "Public verification returned the wrong candidate");
      ok(
        typeof verified.fullName === "string" && verified.fullName.length > 0,
        "Public verification must return the candidate name"
      );
      ok(!("phone" in verified), "Public verification must not expose phone numbers");
      ok(!("email" in verified), "Public verification must not expose email addresses");
      ok(!("address" in verified), "Public verification must not expose home addresses");
      ok(!("photoUrl" in verified), "Public verification must not expose stored photo URLs");
      ok(!("passwordHash" in verified), "Public verification must not expose password hashes");

      const invalidVerify = await request("/api/public/verify", {
        method: "POST",
        json: { cnic: "123" },
      });
      equal(invalidVerify.res.status, 400, "Invalid CNIC verification must return 400");
    }

    section("Authentication and authorization");
    {
      for (const endpoint of ["/api/candidates", "/api/allocations", "/api/messages", "/api/analytics"]) {
        const result = await request(endpoint);
        equal(result.res.status, 401, `${endpoint} must reject unauthenticated requests`);
      }

      const tampered = await request("/api/candidates", {
        cookie: `${SESSION_COOKIE}=tampered.token.value`,
      });
      equal(tampered.res.status, 401, "Tampered session cookies must be rejected");

      const crossOrigin = await request("/api/auth/login", {
        method: "POST",
        origin: "http://evil.example",
        json: { identifier: "admin", password: "admin" },
      });
      equal(crossOrigin.res.status, 403, "Cross-origin login must be blocked");

      const invalidLogin = await request("/api/auth/login", {
        method: "POST",
        json: { identifier: "nobody", password: "wrong-password" },
      });
      equal(invalidLogin.res.status, 401, "Invalid officer credentials must return 401");

      adminCookie = await loginOfficer("admin", "admin");
      const session = await request("/api/auth/session", { cookie: adminCookie });
      equal(session.res.status, 200, "Session endpoint must return 200");
      const sessionData = session.body.data as { username: string; isCandidate: boolean };
      equal(sessionData.username, "admin", "Admin session has the wrong identity");
      equal(Boolean(sessionData.isCandidate), false, "Officer session must not be a candidate session");

      const candidates = await request("/api/candidates", { cookie: adminCookie });
      equal(candidates.res.status, 200, "Admin candidate list must return 200");
      const candidateData = candidates.body.data as Array<Record<string, unknown>>;
      ok(candidateData.length >= 1, "Admin should see the seeded candidates");
      seededCandidate = candidateData[0] as unknown as SeedCandidate;
      ok(
        candidateData.every((candidate) => !("passwordHash" in candidate)),
        "Candidate API responses must never expose password hashes"
      );

      const analytics = await request("/api/analytics", { cookie: adminCookie });
      equal(analytics.res.status, 200, "Admin analytics must return 200");
      ok(
        ((analytics.body.data as { totalRegistered: number }).totalRegistered) >= 1,
        "Analytics should include seeded candidates"
      );
    }

    section("Candidate creation and validation");
    const adminCnicDigits = uniqueDigits("35201");
    const adminCnic = cnicFromDigits(adminCnicDigits);
    const adminEmail = `api.test.${adminCnicDigits}@example.test`;
    let adminCandidateId: string;
    let adminCandidatePhotoUrl: string;
    {
      const created = await request("/api/candidates", {
        method: "POST",
        cookie: adminCookie,
        json: {
          fullName: "API Test Officer Candidate",
          fatherName: "API Test Father",
          cnic: adminCnic,
          dob: "1995-05-10",
          gender: "Male",
          phone: "03001234567",
          email: adminEmail,
          address: "12 Test Street, Dera Ismail Khan",
          domicileDistrict: "Dera Ismail Khan",
          constituency: "NA-44",
          tehsil: "Dera",
          partyAffiliation: "Independent",
          status: "Verified",
          password: "TestPass123",
          photoUrl: "data:image/png;base64,AAAA",
        },
      });
      equal(created.res.status, 201, `Admin candidate creation failed: ${created.body.error ?? "unknown"}`);
      const data = created.body.data as {
        id: string;
        status: string;
        photoUrl: string;
      };
      adminCandidateId = data.id;
      adminCandidatePhotoUrl = data.photoUrl;
      createdCandidateIds.push(adminCandidateId);
      equal(data.status, "Verified", "Admin-created candidate status must be preserved");
      equal(data.photoUrl, `/api/candidates/${adminCandidateId}/photo`, "Data URLs must not be stored as candidate photos");

      const duplicate = await request("/api/candidates", {
        method: "POST",
        cookie: adminCookie,
        json: {
          fullName: "Duplicate CNIC",
          cnic: adminCnic,
          dob: "1995-05-10",
          gender: "Male",
          phone: "03007654321",
          address: "12 Test Street, Dera Ismail Khan",
          domicileDistrict: "Dera Ismail Khan",
          constituency: "NA-44",
          tehsil: "Dera",
          email: `duplicate.${adminCnicDigits}@example.test`,
        },
      });
      equal(duplicate.res.status, 409, "Duplicate CNIC must return 409");
    }

    const publicCnicDigits = uniqueDigits("54400");
    const publicCnic = cnicFromDigits(publicCnicDigits);
    let publicCandidateId: string;
    {
      const registered = await request("/api/candidates", {
        method: "POST",
        json: {
          fullName: "API Test Public Candidate",
          fatherName: "Public Father",
          cnic: publicCnic,
          dob: "1996-02-20",
          gender: "Male",
          phone: "03331234567",
          email: `public.test.${publicCnicDigits}@example.test`,
          address: "Test Street, Dera Ismail Khan",
          domicileDistrict: "Dera Ismail Khan",
          constituency: "NA-44",
          tehsil: "Dera",
          partyAffiliation: "Independent",
          status: "Allocated",
          notes: "Should be stripped",
          photoUrl: "data:image/png;base64,BBBB",
        },
      });
      equal(registered.res.status, 201, `Public registration failed: ${registered.body.error ?? "unknown"}`);
      const data = registered.body.data as {
        id: string;
        status: string;
        notes?: string;
        photoUrl: string;
      };
      publicCandidateId = data.id;
      createdCandidateIds.push(publicCandidateId);
      equal(data.status, "Registered", "Public registration must force Registered status");
      equal(data.notes, undefined, "Public registration must ignore internal notes");
      ok(data.photoUrl.startsWith("/api/candidates/"), "Public registration must ignore data URLs");
    }

    const tankCnicDigits = uniqueDigits("45101");
    const tankCnic = cnicFromDigits(tankCnicDigits);
    let tankCandidateId = "tank-test-candidate";
    {
      // No officer session can create out-of-district candidates (by design),
      // so seed the probe record directly in the database.
      await getPool().query(
        `INSERT INTO candidates
           (id, full_name, father_name, cnic, cnic_digits, dob, gender, phone, email, address,
            domicile_district, constituency, tehsil, party_affiliation, photo_url, matric_details, fsc_details,
            higher_education, status, registered_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tankCandidateId,
          "API Test Tank Candidate",
          "Tank Father",
          tankCnic,
          tankCnicDigits,
          "1994-11-02",
          "Male",
          "03451234567",
          `tank.test.${tankCnicDigits}@example.test`,
          "Test Street, Tank",
          "Tank",
          "NA-42",
          "Tank",
          "Independent",
          "",
          JSON.stringify({ board: "", passingYear: 0, grade: "" }),
          JSON.stringify({ board: "", passingYear: 0, group: "", grade: "" }),
          JSON.stringify([]),
          "Registered",
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
      createdCandidateIds.push(tankCandidateId);
    }

    section("Image upload, compression, and BLOB storage");
    {
      const missingImage = await getImage(publicCandidateId, adminCookie);
      equal(missingImage.status, 404, "Candidates without uploads must return 404 for photos");

      const noAuthUpload = await uploadPhoto(adminCandidateId, Buffer.from("not-an-image"), "image/png");
      equal(noAuthUpload.res.status, 401, "Photo upload must require authentication");

      const crossOriginUpload = await request(`/api/candidates/${adminCandidateId}/photo`, {
        method: "POST",
        cookie: adminCookie,
        origin: "http://evil.example",
        form: (() => {
          const form = new FormData();
          form.append("photo", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), "x.png");
          return form;
        })(),
      });
      equal(crossOriginUpload.res.status, 403, "Cross-origin photo upload must be blocked");

      const noField = await request(`/api/candidates/${adminCandidateId}/photo`, {
        method: "POST",
        cookie: adminCookie,
        form: new FormData(),
      });
      equal(noField.res.status, 400, "Photo upload without a file must return 400");

      const emptyFile = await uploadPhoto(adminCandidateId, Buffer.alloc(0), "image/png", adminCookie);
      equal(emptyFile.res.status, 400, "Empty photo upload must return 400");

      const textFile = await uploadPhoto(adminCandidateId, Buffer.from("plain text"), "text/plain", adminCookie);
      equal(textFile.res.status, 400, "Non-image uploads must be rejected");

      const gif = await sharp({
        create: { width: 12, height: 12, channels: 3, background: "#ffffff" },
      })
        .gif()
        .toBuffer();
      const gifFile = await uploadPhoto(adminCandidateId, gif, "image/gif", adminCookie);
      equal(gifFile.res.status, 415, "GIF uploads must be rejected with 415");

      const oversized = await uploadPhoto(
        adminCandidateId,
        Buffer.alloc(8 * 1024 * 1024 + 1, 1),
        "image/png",
        adminCookie
      );
      equal(oversized.res.status, 413, "Oversized photo uploads must return 413");

      const inputImage = await sharp(randomBytes(2000 * 1500 * 3), {
        raw: { width: 2000, height: 1500, channels: 3 },
      })
        .jpeg({ quality: 92 })
        .toBuffer();

      const uploaded = await uploadPhoto(adminCandidateId, inputImage, "image/jpeg", adminCookie);
      equal(uploaded.res.status, 200, `Valid photo upload failed: ${uploaded.body.error ?? "unknown"}`);
      const uploadedData = uploaded.body.data as {
        photoUrl: string;
        mimeType: string;
        width: number;
        height: number;
        sizeBytes: number;
      };
      equal(uploadedData.mimeType, "image/webp", "Stored images must be converted to WebP");
      equal(uploadedData.width, 800, "Stored images must be resized to the 800px limit");
      equal(uploadedData.height, 600, "Stored image aspect ratio must be preserved");
      ok(uploadedData.sizeBytes < inputImage.length, "Compressed image must be smaller than the upload");
      ok(
        uploadedData.photoUrl.startsWith(`/api/candidates/${adminCandidateId}/photo?v=`),
        "Candidate photo URL must point at the authenticated API route"
      );
      adminCandidatePhotoUrl = uploadedData.photoUrl;

      const [imageRows] = await getPool().query<RowDataPacket[]>(
        "SELECT data, mime_type, width, height, size_bytes, checksum FROM candidate_images WHERE candidate_id = ?",
        [adminCandidateId]
      );
      equal(imageRows.length, 1, "Exactly one image row must be stored per candidate");
      const imageRow = imageRows[0];
      ok(Buffer.isBuffer(imageRow.data), "Image data must be stored as binary, not base64 text");
      equal(imageRow.data.length, imageRow.size_bytes, "Stored BLOB length must match metadata");
      equal(imageRow.mime_type, "image/webp", "Stored BLOB MIME type must be WebP");
      equal(imageRow.data.subarray(0, 4).toString("ascii"), "RIFF", "Stored BLOB must contain a RIFF WebP header");
      equal(imageRow.data.subarray(8, 12).toString("ascii"), "WEBP", "Stored BLOB must contain a WebP signature");

      const [columnRows] = await getPool().query<RowDataPacket[]>(
        "SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidate_images' AND COLUMN_NAME = 'data'"
      );
      equal(columnRows[0]?.DATA_TYPE, "mediumblob", "Image data column must be a MySQL BLOB type");

      const fetched = await getImage(adminCandidateId, adminCookie);
      equal(fetched.status, 200, "Authenticated photo fetch must return 200");
      equal(fetched.headers.get("content-type"), "image/webp", "Photo response must use the WebP MIME type");
      equal(fetched.headers.get("x-content-type-options"), "nosniff", "Photo response must disable MIME sniffing");
      ok(
        (fetched.headers.get("cache-control") ?? "").includes("private"),
        "Photo response must use private caching"
      );
      const etag = fetched.headers.get("etag");
      ok(etag, "Photo response must include an ETag");
      const fetchedBuffer = Buffer.from(await fetched.arrayBuffer());
      equal(fetchedBuffer.length, imageRow.data.length, "Fetched photo must match the stored BLOB size");
      const metadata = await sharp(fetchedBuffer).metadata();
      equal(metadata.format, "webp", "Fetched photo must decode as WebP");
      equal(metadata.width, 800, "Fetched photo width is incorrect");
      equal(metadata.height, 600, "Fetched photo height is incorrect");

      const conditional = await getImage(adminCandidateId, adminCookie, {
        "If-None-Match": etag,
      });
      equal(conditional.status, 304, "Matching ETag must return 304");

      const candidateAfterUpload = await request(`/api/candidates/${adminCandidateId}`, {
        cookie: adminCookie,
      });
      equal(
        (candidateAfterUpload.body.data as { photoUrl: string }).photoUrl,
        adminCandidatePhotoUrl,
        "Candidate record photoUrl must be updated after upload"
      );

      const staffCookie = await loginOfficer("clerk", "clerk");
      const crossDistrictImage = await getImage(tankCandidateId, staffCookie);
      equal(crossDistrictImage.status, 403, "District officers must not fetch other districts' photos");
      const crossDistrictUpload = await uploadPhoto(
        tankCandidateId,
        inputImage,
        "image/jpeg",
        staffCookie
      );
      equal(crossDistrictUpload.res.status, 403, "District officers must not upload other districts' photos");
    }

    section("Allocation lifecycle and permissions");
    let allocationId: string;
    {
      const allocation = await request("/api/allocations", {
        method: "POST",
        cookie: adminCookie,
        json: {
          candidateId: adminCandidateId,
          roleCategory: "Ward Boy",
          roleTitle: "API Test Ward Boy",
          department: "Test Department",
          district: "Dera Ismail Khan",
          constituency: "NA-44",
          tenureMonths: 12,
        },
      });
      equal(allocation.res.status, 201, `Allocation failed: ${allocation.body.error ?? "unknown"}`);
      allocationId = (allocation.body.data as { id: string }).id;

      const duplicate = await request("/api/allocations", {
        method: "POST",
        cookie: adminCookie,
        json: {
          candidateId: adminCandidateId,
          roleCategory: "Ward Boy",
          roleTitle: "Duplicate",
          department: "Test Department",
          district: "Dera Ismail Khan",
          constituency: "NA-44",
        },
      });
      equal(duplicate.res.status, 409, "Duplicate active allocation must return 409");

      const committeeCandidates = await request("/api/candidates", {
        cookie: adminCookie,
      });
      ok(
        (committeeCandidates.body.data as unknown[]).length >= 1,
        "Admin must see the national candidate roster"
      );

      const clerkCookie = await loginOfficer("clerk", "clerk");
      const clerkAllocate = await request("/api/allocations", {
        method: "POST",
        cookie: clerkCookie,
        json: {
          candidateId: adminCandidateId,
          roleCategory: "Ward Boy",
          roleTitle: "Unauthorized",
          department: "Test Department",
          district: "Dera Ismail Khan",
          constituency: "NA-44",
        },
      });
      equal(clerkAllocate.res.status, 403, "Clerk must not create allocations");

      const directorCookie = await loginOfficer("director", "director");
      const missingRevoke = await request("/api/allocations/does-not-exist", {
        method: "PATCH",
        cookie: directorCookie,
        json: { action: "revoke", reason: "Permission probe" },
      });
      equal(missingRevoke.res.status, 404, "Revoking officers must pass permission checks for revocation");

      const revoked = await request(`/api/allocations/${allocationId}`, {
        method: "PATCH",
        cookie: directorCookie,
        json: { action: "revoke", reason: "API test cleanup" },
      });
      equal(revoked.res.status, 200, `Director revocation failed: ${revoked.body.error ?? "unknown"}`);
      equal((revoked.body.data as { status: string }).status, "Revoked", "Revoked allocation status is incorrect");

      const staffCookie = await loginOfficer("clerk", "clerk");
      const staffAllocate = await request("/api/allocations", {
        method: "POST",
        cookie: staffCookie,
        json: {
          candidateId: adminCandidateId,
          roleCategory: "Ward Boy",
          roleTitle: "Unauthorized",
          department: "Test Department",
          district: "Dera Ismail Khan",
          constituency: "NA-44",
        },
      });
      equal(staffAllocate.res.status, 403, "Staff must not create allocations");
    }

    section("District scoping");
    {
      const staffCookie = await loginOfficer("clerk", "clerk");
      const candidates = await request("/api/candidates", { cookie: staffCookie });
      const scopedCandidates = candidates.body.data as { domicileDistrict: string }[];
      ok(scopedCandidates.length >= 1, "District staff should see their district's candidates");
      ok(
        scopedCandidates.every((candidate) => candidate.domicileDistrict === "Dera Ismail Khan"),
        "District staff must only see their own district's candidates"
      );

      const outOfDistrict = await request(`/api/candidates/${tankCandidateId}`, {
        cookie: staffCookie,
      });
      equal(outOfDistrict.res.status, 403, "Staff must not read candidates outside their district");

      const outOfDistrictPatch = await request(`/api/candidates/${tankCandidateId}`, {
        method: "PATCH",
        cookie: staffCookie,
        json: { status: "Verified" },
      });
      equal(outOfDistrictPatch.res.status, 403, "Staff must not edit candidates outside their district");

      const outOfDistrictCreate = await request("/api/candidates", {
        method: "POST",
        cookie: staffCookie,
        json: {
          fullName: "Wrong District Candidate",
          cnic: cnicFromDigits(uniqueDigits("35202")),
          phone: "03005555555",
          dob: "1993-07-07",
          gender: "Male",
          address: "Test Street, Tank",
          tehsil: "Tank",
          domicileDistrict: "Tank",
          constituency: "NA-42",
        },
      });
      equal(outOfDistrictCreate.res.status, 403, "Staff must not register candidates outside their district");

      const allocations = await request("/api/allocations", { cookie: staffCookie });
      ok(
        (allocations.body.data as { district: string }[]).every(
          (allocation) => allocation.district === "Dera Ismail Khan"
        ),
        "Staff allocation list must be district scoped"
      );

      const analytics = await request("/api/analytics", { cookie: staffCookie });
      ok(
        (analytics.body.data as { totalRegistered: number }).totalRegistered >= 1,
        "Staff analytics must be district scoped"
      );
    }

    section("Candidate portal isolation");
    {
      const candidateCookie = await loginCandidate(adminCnic, "TestPass123");

      const ownRecord = await request("/api/candidates", { cookie: candidateCookie });
      const ownCandidates = ownRecord.body.data as { id: string }[];
      equal(ownCandidates.length, 1, "Candidate accounts must only see their own record");
      equal(ownCandidates[0].id, adminCandidateId, "Candidate account returned another candidate");

      const otherRecord = await request(`/api/candidates/${tankCandidateId}`, {
        cookie: candidateCookie,
      });
      equal(otherRecord.res.status, 403, "Candidate accounts must not read other records");

      const ownImage = await getImage(adminCandidateId, candidateCookie);
      equal(ownImage.status, 200, "Candidates must be able to fetch their own photo");

      const candidateUpload = await uploadPhoto(
        adminCandidateId,
        Buffer.from("test"),
        "image/png",
        candidateCookie
      );
      equal(candidateUpload.res.status, 403, "Candidate accounts must not upload photos");

      const ownAllocations = await request("/api/allocations", { cookie: candidateCookie });
      equal(ownAllocations.res.status, 200, "Candidate allocation history must return 200");
      ok(
        (ownAllocations.body.data as { candidateId: string }[]).every(
          (allocation) => allocation.candidateId === adminCandidateId
        ),
        "Candidates must only see their own allocation history"
      );

      const messages = await request("/api/messages", { cookie: candidateCookie });
      equal(messages.res.status, 403, "Candidate accounts must not access internal messaging");

      const session = await request("/api/auth/session", { cookie: candidateCookie });
      const sessionData = session.body.data as { isCandidate: boolean; candidateId: string };
      equal(sessionData.isCandidate, true, "Candidate session kind is incorrect");
      equal(sessionData.candidateId, adminCandidateId, "Candidate session points at the wrong record");
    }

    section("Logout");
    {
      const logout = await request("/api/auth/logout", {
        method: "POST",
        cookie: adminCookie,
      });
      equal(logout.res.status, 200, "Logout must return 200");
      const cleared = logout.res.headers.get("set-cookie") ?? "";
      ok(cleared.includes(`${SESSION_COOKIE}=`), "Logout must clear the session cookie");

      const anonymousSession = await request("/api/auth/session");
      equal(anonymousSession.res.status, 200, "Anonymous session endpoint must return 200");
      equal(anonymousSession.body.data, null, "Anonymous session must have no user");
    }

    console.log(`\nPASS: ${checks} checks completed successfully.`);
  } finally {
    await cleanup(adminCookie);
    await getPool().end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error("\nTEST FAILED");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
