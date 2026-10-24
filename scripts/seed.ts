import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { getDb, getPool, schema } from "../src/db/client";
import { ROLE_PRESETS } from "../src/lib/auth";
import { hashPassword } from "../src/lib/password";
import type { ChatMessage, District, RoleCategory } from "../src/types";

type SeedDb = {
  districts: District[];
  candidates: Array<Record<string, unknown>>;
  allocations: Array<Record<string, unknown>>;
  messages: ChatMessage[];
};

const roleCategoryByKey: Record<string, RoleCategory | "Admin"> = {
  admin: "Admin",
  mna: "MNA",
  mpa: "MPA",
  chairperson: "District Chairperson",
  uc_chairman: "Union Council Chairman",
  councilor: "Councilor",
  civil_officer: "Civil Administration Officer",
  committee_head: "Committee Head",
  staff: "Public Sector Staff",
};

function readSeedFile(): SeedDb {
  const filePath = path.join(process.cwd(), "data", "db.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed source not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as SeedDb;
}

async function seed() {
  const now = new Date().toISOString();
  const data = readSeedFile();
  const db = getDb();

  const userRows = Object.entries(ROLE_PRESETS).map(([key, preset]) => ({
    id: `user-${key}`,
    username: key,
    email: `${key}@internalhr.gov.pk`,
    passwordHash: hashPassword(key),
    roleKey: key,
    roleCategory: roleCategoryByKey[key] ?? "Public Sector Staff",
    name: preset.name,
    title: preset.title,
    department: preset.department,
    district: preset.defaultDistrict,
    constituency: preset.constituency ?? null,
    avatar: preset.avatar,
    badgeColor: preset.badgeColor,
    permissions: preset.permissions,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  const districtRows = data.districts.map((district) => ({
    ...district,
    createdAt: now,
    updatedAt: now,
  }));

  const candidateRows = data.candidates.map((raw) => {
    const candidate = raw as {
      id: string;
      fullName: string;
      fatherName: string;
      cnic: string;
      dob: string;
      gender: "Male" | "Female" | "Other";
      phone: string;
      email: string;
      address: string;
      domicileDistrict: string;
      constituency: string;
      tehsil: string;
      unionCouncil?: string;
      partyAffiliation: string;
      photoUrl: string;
      matricDetails: Record<string, unknown>;
      fscDetails: Record<string, unknown>;
      higherEducation?: Record<string, unknown>[];
      status: string;
      allocatedRoleId?: string;
      registeredAt: string;
      notes?: string;
      passwordHash?: string;
    };

    return {
      id: candidate.id,
      fullName: candidate.fullName,
      fatherName: candidate.fatherName,
      cnic: candidate.cnic,
      cnicDigits: candidate.cnic.replace(/[^0-9]/g, ""),
      dob: candidate.dob,
      gender: candidate.gender,
      phone: candidate.phone,
      email: candidate.email,
      address: candidate.address,
      domicileDistrict: candidate.domicileDistrict,
      constituency: candidate.constituency,
      tehsil: candidate.tehsil,
      unionCouncil: candidate.unionCouncil ?? null,
      partyAffiliation: candidate.partyAffiliation as never,
      photoUrl: candidate.photoUrl,
      matricDetails: candidate.matricDetails as never,
      fscDetails: candidate.fscDetails as never,
      higherEducation: (candidate.higherEducation ?? []) as never,
      status: candidate.status as never,
      allocatedRoleId: candidate.allocatedRoleId ?? null,
      registeredAt: candidate.registeredAt,
      notes: candidate.notes ?? null,
      passwordHash: candidate.passwordHash ?? null,
      createdAt: candidate.registeredAt,
      updatedAt: now,
    };
  });

  const allocationRows = data.allocations.map((raw) => {
    const allocation = raw as {
      id: string;
      candidateId: string;
      candidateName: string;
      candidateCnic: string;
      district: string;
      constituency: string;
      roleCategory: string;
      roleTitle: string;
      department: string;
      partyAffiliation: string;
      allocatedDate: string;
      tenureMonths: number;
      status: string;
      allocatedBy: string;
      appointmentRefNo: string;
      salaryOrStipend?: string;
      remarks?: string;
    };

    return {
      ...allocation,
      roleCategory: allocation.roleCategory as never,
      partyAffiliation: allocation.partyAffiliation as never,
      status: allocation.status as never,
      revokedBy: null,
      revokedAt: null,
      revokeReason: null,
      createdAt: now,
      updatedAt: now,
    };
  });

  const messageRows = data.messages.map((message) => ({
    ...message,
    senderId: null,
    createdAt: now,
    updatedAt: now,
  }));

  await db.transaction(async (tx) => {
    await tx.delete(schema.messages);
    await tx.delete(schema.allocations);
    await tx.delete(schema.candidateImages);
    await tx.delete(schema.candidates);
    await tx.delete(schema.districts);
    await tx.delete(schema.users);

    await tx.insert(schema.users).values(userRows);
    await tx.insert(schema.districts).values(districtRows);
    await tx.insert(schema.candidates).values(candidateRows);
    await tx.insert(schema.allocations).values(allocationRows);
    await tx.insert(schema.messages).values(messageRows);
  });

  console.log(
    `Seeded ${userRows.length} users, ${districtRows.length} districts, ${candidateRows.length} candidates, ${allocationRows.length} allocations, ${messageRows.length} messages.`
  );

  await getPool().end();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  await getPool().end().catch(() => undefined);
  process.exit(1);
});
