import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const DUMMY_IMG = path.join(process.cwd(), "dummyImg.jpg");
const DUMMY_PDF = path.join(process.cwd(), "dummyPDF.pdf");

if (!fs.existsSync(DUMMY_IMG) || !fs.existsSync(DUMMY_PDF)) {
  console.error("dummyImg.jpg / dummyPDF.pdf not found in project root.");
  process.exit(1);
}

const imgBuffer = fs.readFileSync(DUMMY_IMG);
const pdfBuffer = fs.readFileSync(DUMMY_PDF);

let checks = 0;
function ok(value: unknown, message: string): asserts value {
  if (!value) {
    console.error(`  FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ok: ${message}`);
  checks += 1;
}

async function main() {
  console.log(`[uploads] target: ${BASE_URL}`);
  console.log(
    `[uploads] dummy img: ${(imgBuffer.length / 1024).toFixed(1)} KB | dummy pdf: ${(pdfBuffer.length / 1024).toFixed(1)} KB`
  );

  // 1. Login as admin (seeded demo: username == password), grab session cookie
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin", password: "admin" }),
  });
  const loginBody = await loginRes.json();
  ok(loginBody?.success, "admin login");
  const cookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];
  ok(cookie.length > 0, "session cookie received");

  // 2. List candidates
  const candRes = await fetch(`${BASE_URL}/api/candidates`, { headers: { cookie } });
  const candBody = await candRes.json();
  ok(candBody?.success, "candidate list fetched");
  const list = candBody.data as Array<{ id: string; fullName: string }>;
  ok(list.length > 0, `${list.length} candidates in DB`);

  let failures = 0;
  const results: string[] = [];

  for (const cand of list) {
    // PHOTO upload (image compression check: jpg -> webp)
    const photoForm = new FormData();
    photoForm.append(
      "photo",
      new Blob([new Uint8Array(imgBuffer)], { type: "image/jpeg" }),
      "dummyImg.jpg"
    );
    const photoRes = await fetch(`${BASE_URL}/api/candidates/${cand.id}/photo`, {
      method: "POST",
      headers: { cookie },
      body: photoForm,
    });
    const photoBody = await photoRes.json().catch(() => null);
    if (photoRes.status !== 200 || !photoBody?.success) {
      failures += 1;
      console.error(`  FAIL photo upload ${cand.id}: ${photoBody?.error}`);
      continue;
    }
    const photo = photoBody.data as { sizeBytes: number };
    const photoSaved = Math.round((1 - photo.sizeBytes / imgBuffer.length) * 100);

    // GET photo back
    const photoGet = await fetch(`${BASE_URL}/api/candidates/${cand.id}/photo`, {
      headers: { cookie },
    });
    ok(
      photoGet.status === 200 && photoGet.headers.get("content-type")?.includes("webp"),
      `${cand.fullName}: photo stored as compressed WebP (${(photo.sizeBytes / 1024).toFixed(1)} KB, saved ${photoSaved}%)`
    );

    // DOCUMENT uploads: cnicFront/cnicBack with dummy IMG, matricDoc/fscDoc with dummy PDF
    const docPlan: Array<[string, Buffer, string, string]> = [
      ["cnicFront", imgBuffer, "image/jpeg", "dummyImg.jpg"],
      ["cnicBack", imgBuffer, "image/jpeg", "dummyImg.jpg"],
      ["matricDoc", pdfBuffer, "application/pdf", "dummyPDF.pdf"],
      ["fscDoc", pdfBuffer, "application/pdf", "dummyPDF.pdf"],
    ];

    for (const [field, buffer, type, fileName] of docPlan) {
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(buffer)], { type }), fileName);
      form.append("field", field);
      const docRes = await fetch(`${BASE_URL}/api/candidates/${cand.id}/documents`, {
        method: "POST",
        headers: { cookie },
        body: form,
      });
      const docBody = await docRes.json().catch(() => null);
      if (docRes.status !== 200 || !docBody?.success) {
        failures += 1;
        console.error(`  FAIL doc ${field} ${cand.id}: ${docBody?.error}`);
        continue;
      }
      const doc = docBody.data as {
        originalSizeBytes: number;
        sizeBytes: number;
        savedPercent: number;
      };
      results.push(
        `${cand.fullName} | ${field} | ${(doc.originalSizeBytes / 1024).toFixed(0)}KB -> ${(doc.sizeBytes / 1024).toFixed(0)}KB (-${doc.savedPercent}%)`
      );

      // GET document back
      const docGet = await fetch(
        `${BASE_URL}/api/candidates/${cand.id}/documents?field=${field}`,
        { headers: { cookie } }
      );
      ok(
        docGet.status === 200 &&
          (docGet.headers.get("content-type")?.includes("pdf") ||
            docGet.headers.get("content-type")?.includes("webp")),
        `${cand.fullName}: ${field} retrievable (${(Number(docGet.headers.get("content-length")) / 1024).toFixed(1)} KB)`
      );
    }
  }

  // candidate row refs updated?
  const first = list[0];
  const afterRes = await fetch(`${BASE_URL}/api/candidates/${first.id}`, { headers: { cookie } });
  const after = (await afterRes.json())?.data as {
    cnicFrontUrl?: string;
    matricDetails?: { documentUrl?: string };
  };
  ok(
    Boolean(after.cnicFrontUrl?.startsWith(`/api/candidates/${first.id}/documents?field=cnicFront`)),
    "candidates.cnicFrontUrl points to real documents API"
  );
  ok(
    Boolean(after.matricDetails?.documentUrl?.startsWith(`/api/candidates/${first.id}/documents?field=matricDoc`)),
    "matricDetails.documentUrl points to real documents API"
  );

  console.log("\n[uploads] ===== COMPRESSION REPORT =====");
  results.forEach((r) => console.log("  " + r));
  console.log(`\n[uploads] checks passed: ${checks}, failures: ${failures}`);
  if (failures > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
