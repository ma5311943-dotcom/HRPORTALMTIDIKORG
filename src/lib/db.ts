import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { publicCandidate as stripCandidateSecret } from "@/lib/candidate";
import { DomainError, isDuplicateKeyError } from "@/lib/errors";
import type {
  Allocation,
  Candidate,
  CandidateStatus,
  ChatMessage,
  District,
  PoliticalParty,
  RoleCategory,
  SystemAnalytics,
} from "@/types";

export type StoredCandidate = Candidate & { passwordHash?: string };
type CandidateRow = typeof schema.candidates.$inferSelect;
type AllocationRow = typeof schema.allocations.$inferSelect;
type MessageRow = typeof schema.messages.$inferSelect;
type DistrictRow = typeof schema.districts.$inferSelect;

function nowIso() {
  return new Date().toISOString();
}

function mapCandidate(row: CandidateRow): StoredCandidate {
  return {
    id: row.id,
    fullName: row.fullName,
    fatherName: row.fatherName,
    cnic: row.cnic,
    fatherCnic: row.fatherCnic ?? undefined,
    dob: row.dob,
    gender: row.gender as Candidate["gender"],
    phone: row.phone,
    email: row.email,
    address: row.address,
    domicileDistrict: row.domicileDistrict,
    constituency: row.constituency,
    tehsil: row.tehsil,
    unionCouncil: row.unionCouncil ?? undefined,
    partyAffiliation: row.partyAffiliation,
    referenceCode: row.referenceCode ?? undefined,
    appliedRole: (row.appliedRole as RoleCategory) ?? undefined,
    appointmentOrderNo: row.appointmentOrderNo ?? undefined,
    joiningOrderNo: row.joiningOrderNo ?? undefined,
    cnicFrontUrl: row.cnicFrontUrl ?? undefined,
    cnicBackUrl: row.cnicBackUrl ?? undefined,
    photoUrl: row.photoUrl,
    matricDetails: row.matricDetails,
    fscDetails: row.fscDetails,
    higherEducation: row.higherEducation ?? [],
    status: row.status,
    allocatedRoleId: row.allocatedRoleId ?? undefined,
    registeredAt: row.registeredAt,
    notes: row.notes ?? undefined,
    passwordHash: row.passwordHash ?? undefined,
  };
}

function mapAllocation(row: AllocationRow): Allocation {
  return {
    id: row.id,
    candidateId: row.candidateId,
    candidateName: row.candidateName,
    candidateCnic: row.candidateCnic,
    district: row.district,
    constituency: row.constituency,
    roleCategory: row.roleCategory,
    roleTitle: row.roleTitle,
    department: row.department,
    partyAffiliation: row.partyAffiliation,
    allocatedDate: row.allocatedDate,
    tenureMonths: row.tenureMonths,
    status: row.status,
    allocatedBy: row.allocatedBy,
    appointmentRefNo: row.appointmentRefNo,
    joiningOrderNo: row.joiningOrderNo ?? undefined,
    salaryOrStipend: row.salaryOrStipend ?? undefined,
    remarks: row.remarks ?? undefined,
    revokedBy: row.revokedBy ?? undefined,
    revokedAt: row.revokedAt ?? undefined,
    revokeReason: row.revokeReason ?? undefined,
  };
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    senderId: row.senderId ?? undefined,
    senderName: row.senderName,
    senderRole: row.senderRole,
    senderDepartment: row.senderDepartment,
    district: row.district,
    subject: row.subject,
    message: row.message,
    priority: row.priority as ChatMessage["priority"],
    timestamp: row.timestamp,
    unread: row.unread,
  };
}

function mapDistrict(row: DistrictRow): District {
  return {
    id: row.id,
    name: row.name,
    province: row.province as District["province"],
    constituencies: row.constituencies,
    totalQuota: row.totalQuota,
    allocatedCount: row.allocatedCount,
  };
}

function likePattern(value: string) {
  return `%${value.replace(/[%_]/g, "\\$&")}%`;
}

export const db = {
  async getDistricts(): Promise<District[]> {
    const rows = await getDb().select().from(schema.districts).orderBy(desc(schema.districts.totalQuota));
    return rows.map(mapDistrict);
  },

  async getDistrictByName(name: string): Promise<District | undefined> {
    const [row] = await getDb()
      .select()
      .from(schema.districts)
      .where(eq(schema.districts.name, name))
      .limit(1);
    return row ? mapDistrict(row) : undefined;
  },

  async getCandidates(filters?: {
    district?: string;
    party?: string;
    status?: string;
    search?: string;
  }): Promise<Candidate[]> {
    const conditions = [];
    if (filters?.district && filters.district !== "All") {
      conditions.push(eq(schema.candidates.domicileDistrict, filters.district));
    }
    if (filters?.party && filters.party !== "All") {
      conditions.push(eq(schema.candidates.partyAffiliation, filters.party as PoliticalParty));
    }
    if (filters?.status && filters.status !== "All") {
      conditions.push(eq(schema.candidates.status, filters.status as CandidateStatus));
    }
    if (filters?.search) {
      const q = likePattern(filters.search);
      conditions.push(
        or(
          like(schema.candidates.fullName, q),
          like(schema.candidates.cnic, q),
          like(schema.candidates.constituency, q),
          like(schema.candidates.email, q),
          like(schema.candidates.phone, q)
        )
      );
    }

    const rows = await getDb()
      .select()
      .from(schema.candidates)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.candidates.registeredAt));

    return rows.map(mapCandidate).map(stripCandidateSecret);
  },

  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const [row] = await getDb()
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.id, id))
      .limit(1);
    return row ? stripCandidateSecret(mapCandidate(row)) : undefined;
  },

  async getCandidateByCnic(cnic: string): Promise<Candidate | undefined> {
    const [row] = await getDb()
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.cnicDigits, cnic.replace(/[^0-9]/g, "")))
      .limit(1);
    return row ? stripCandidateSecret(mapCandidate(row)) : undefined;
  },

  async getStoredCandidateByCnic(cnic: string): Promise<StoredCandidate | undefined> {
    const [row] = await getDb()
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.cnicDigits, cnic.replace(/[^0-9]/g, "")))
      .limit(1);
    return row ? mapCandidate(row) : undefined;
  },

  async createCandidate(
    candidate: Omit<Candidate, "id" | "registeredAt"> & { passwordHash?: string }
  ): Promise<Candidate> {
    const database = getDb();
    const cleanCnic = candidate.cnic.replace(/[^0-9]/g, "");
    if (cleanCnic.length !== 13) {
      throw new DomainError(400, "CNIC must be a valid 13-digit Pakistani National ID number.");
    }

    const [existing] = await database
      .select({ id: schema.candidates.id, fullName: schema.candidates.fullName })
      .from(schema.candidates)
      .where(eq(schema.candidates.cnicDigits, cleanCnic))
      .limit(1);

    if (existing) {
      throw new DomainError(
        409,
        `CNIC ${candidate.cnic} is already registered under "${existing.fullName}".`
      );
    }

    const now = nowIso();
    const id = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await database.insert(schema.candidates).values({
      id,
      fullName: candidate.fullName,
      fatherName: candidate.fatherName,
      cnic: candidate.cnic,
      cnicDigits: cleanCnic,
      dob: candidate.dob,
      gender: candidate.gender,
      phone: candidate.phone,
      email: candidate.email,
      address: candidate.address,
      domicileDistrict: candidate.domicileDistrict,
      constituency: candidate.constituency,
      tehsil: candidate.tehsil,
      unionCouncil: candidate.unionCouncil ?? null,
      fatherCnic: candidate.fatherCnic ?? null,
      referenceCode: candidate.referenceCode ?? null,
      appliedRole: candidate.appliedRole ?? null,
      appointmentOrderNo: candidate.appointmentOrderNo ?? null,
      joiningOrderNo: candidate.joiningOrderNo ?? null,
      cnicFrontUrl: candidate.cnicFrontUrl ?? null,
      cnicBackUrl: candidate.cnicBackUrl ?? null,
      partyAffiliation: candidate.partyAffiliation,
      photoUrl: candidate.photoUrl,
      matricDetails: candidate.matricDetails,
      fscDetails: candidate.fscDetails,
      higherEducation: candidate.higherEducation ?? [],
      status: candidate.status || "Registered",
      allocatedRoleId: candidate.allocatedRoleId ?? null,
      registeredAt: now,
      notes: candidate.notes ?? null,
      passwordHash: candidate.passwordHash ?? null,
      createdAt: now,
      updatedAt: now,
    }).catch((error: unknown) => {
      if (isDuplicateKeyError(error)) {
        throw new DomainError(409, "CNIC or email is already registered.");
      }
      throw error;
    });

    return stripCandidateSecret({
      ...candidate,
      id,
      registeredAt: now,
      passwordHash: candidate.passwordHash,
    });
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    const patch: Partial<typeof schema.candidates.$inferInsert> = {
      ...updates,
      updatedAt: nowIso(),
    };
    await getDb().update(schema.candidates).set(patch).where(eq(schema.candidates.id, id));
    const updated = await db.getCandidateById(id);
    if (!updated) throw new DomainError(404, `Candidate with ID ${id} not found.`);
    return updated;
  },

  async deleteCandidate(id: string): Promise<boolean> {
    const database = getDb();
    return database.transaction(async (tx) => {
      const [candidate] = await tx
        .select()
        .from(schema.candidates)
        .where(eq(schema.candidates.id, id))
        .limit(1)
        .for("update");

      if (!candidate) return false;

      const activeAllocations = await tx
        .select({ district: schema.allocations.district })
        .from(schema.allocations)
        .where(
          and(
            eq(schema.allocations.candidateId, id),
            eq(schema.allocations.status, "Active")
          )
        );

      for (const allocation of activeAllocations) {
        await tx
          .update(schema.districts)
          .set({
            allocatedCount: sql`GREATEST(${schema.districts.allocatedCount} - 1, 0)`,
            updatedAt: nowIso(),
          })
          .where(eq(schema.districts.name, allocation.district));
      }

      await tx.delete(schema.candidates).where(eq(schema.candidates.id, id));
      return true;
    });
  },

  async getActiveAllocationByCandidate(candidateId: string): Promise<Allocation | undefined> {
    const [row] = await getDb()
      .select()
      .from(schema.allocations)
      .where(
        and(
          eq(schema.allocations.candidateId, candidateId),
          eq(schema.allocations.status, "Active")
        )
      )
      .limit(1);
    return row ? mapAllocation(row) : undefined;
  },

  async getAllocationById(id: string): Promise<Allocation | undefined> {
    const [row] = await getDb()
      .select()
      .from(schema.allocations)
      .where(eq(schema.allocations.id, id))
      .limit(1);
    return row ? mapAllocation(row) : undefined;
  },

  async getAllocations(filters?: {
    district?: string;
    role?: string;
    party?: string;
    search?: string;
  }): Promise<Allocation[]> {
    const conditions = [];
    if (filters?.district && filters.district !== "All") {
      conditions.push(eq(schema.allocations.district, filters.district));
    }
    if (filters?.role && filters.role !== "All") {
      conditions.push(
        eq(schema.allocations.roleCategory, filters.role as RoleCategory)
      );
    }
    if (filters?.party && filters.party !== "All") {
      conditions.push(
        eq(schema.allocations.partyAffiliation, filters.party as PoliticalParty)
      );
    }
    if (filters?.search) {
      const q = likePattern(filters.search);
      conditions.push(
        or(
          like(schema.allocations.candidateName, q),
          like(schema.allocations.candidateCnic, q),
          like(schema.allocations.appointmentRefNo, q),
          like(schema.allocations.roleTitle, q)
        )
      );
    }

    const rows = await getDb()
      .select()
      .from(schema.allocations)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.allocations.allocatedDate));

    return rows.map(mapAllocation);
  },

  async allocateSeat(allocationData: {
    candidateId: string;
    roleCategory: RoleCategory;
    roleTitle: string;
    department: string;
    district: string;
    constituency: string;
    tenureMonths: number;
    allocatedBy: string;
    salaryOrStipend?: string;
    remarks?: string;
    joiningOrderNo?: string;
  }): Promise<Allocation> {
    const database = getDb();
    return database.transaction(async (tx) => {
      const [candidate] = await tx
        .select()
        .from(schema.candidates)
        .where(eq(schema.candidates.id, allocationData.candidateId))
        .limit(1)
        .for("update");

      if (!candidate) {
        throw new DomainError(
          404,
          `Candidate with ID ${allocationData.candidateId} does not exist.`
        );
      }

      const [activeAllocation] = await tx
        .select()
        .from(schema.allocations)
        .where(
          and(
            eq(schema.allocations.candidateId, candidate.id),
            eq(schema.allocations.status, "Active")
          )
        )
        .limit(1)
        .for("update");

      if (activeAllocation) {
        throw new DomainError(
          409,
          `Duplicate Allocation Blocked: ${candidate.fullName} (CNIC: ${candidate.cnic}) already holds an active role as "${activeAllocation.roleTitle}" in ${activeAllocation.district}.`
        );
      }

      const [districtRow] = await tx
        .select()
        .from(schema.districts)
        .where(eq(schema.districts.name, allocationData.district))
        .limit(1)
        .for("update");

      if (!districtRow) {
        throw new DomainError(404, `District ${allocationData.district} was not found.`);
      }

      const [serialRow] = await tx
        .select({ value: sql<number>`COUNT(*)` })
        .from(schema.allocations)
        .where(eq(schema.allocations.district, allocationData.district));

      const prefix = allocationData.district.substring(0, 3).toUpperCase();
      const year = new Date().getFullYear();
      const serial = String(Number(serialRow?.value ?? 0) + 1).padStart(3, "0");
      const appointmentRefNo = `DHQ-${prefix}/${year}/${serial}`;
      const now = nowIso();
      const id = `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await tx.insert(schema.allocations).values({
        id,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        candidateCnic: candidate.cnic,
        district: allocationData.district,
        constituency: allocationData.constituency,
        roleCategory: allocationData.roleCategory,
        roleTitle: allocationData.roleTitle,
        department: allocationData.department,
        partyAffiliation: candidate.partyAffiliation,
        allocatedDate: now.split("T")[0],
        tenureMonths: allocationData.tenureMonths,
        status: "Active",
        allocatedBy: allocationData.allocatedBy,
        appointmentRefNo,
        joiningOrderNo: allocationData.joiningOrderNo ?? candidate.joiningOrderNo ?? `JOIN-DHQ/${year}/${serial}`,
        salaryOrStipend: allocationData.salaryOrStipend ?? null,
        remarks: allocationData.remarks ?? null,
        revokedBy: null,
        revokedAt: null,
        revokeReason: null,
        createdAt: now,
        updatedAt: now,
      }).catch((error: unknown) => {
        if (isDuplicateKeyError(error)) {
          throw new DomainError(409, "This appointment reference already exists. Retry the allocation.");
        }
        throw error;
      });

      await tx
        .update(schema.candidates)
        .set({ status: "Allocated", allocatedRoleId: id, updatedAt: now })
        .where(eq(schema.candidates.id, candidate.id));

      await tx
        .update(schema.districts)
        .set({
          allocatedCount: sql`${schema.districts.allocatedCount} + 1`,
          updatedAt: now,
        })
        .where(eq(schema.districts.id, districtRow.id));

      return mapAllocation({
        id,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        candidateCnic: candidate.cnic,
        district: allocationData.district,
        constituency: allocationData.constituency,
        roleCategory: allocationData.roleCategory,
        roleTitle: allocationData.roleTitle,
        department: allocationData.department,
        partyAffiliation: candidate.partyAffiliation,
        allocatedDate: now.split("T")[0],
        tenureMonths: allocationData.tenureMonths,
        status: "Active",
        allocatedBy: allocationData.allocatedBy,
        appointmentRefNo,
        joiningOrderNo: allocationData.joiningOrderNo ?? null,
        salaryOrStipend: allocationData.salaryOrStipend ?? null,
        remarks: allocationData.remarks ?? null,
        revokedBy: null,
        revokedAt: null,
        revokeReason: null,
        createdAt: now,
        updatedAt: now,
      });
    });
  },

  async revokeAllocation(
    allocationId: string,
    reason?: string,
    revokedBy?: string
  ): Promise<Allocation> {
    const database = getDb();
    return database.transaction(async (tx) => {
      const [allocation] = await tx
        .select()
        .from(schema.allocations)
        .where(eq(schema.allocations.id, allocationId))
        .limit(1)
        .for("update");

      if (!allocation) {
        throw new DomainError(404, `Allocation ${allocationId} not found.`);
      }
      if (allocation.status !== "Active") {
        throw new DomainError(409, "Only active allocations can be revoked.");
      }

      const now = nowIso();
      await tx
        .update(schema.allocations)
        .set({
          status: "Revoked",
          revokedBy: revokedBy ?? "System Administrator",
          revokedAt: now,
          revokeReason: reason ?? "Administrative revocation",
          updatedAt: now,
        })
        .where(eq(schema.allocations.id, allocationId));

      await tx
        .update(schema.candidates)
        .set({ status: "Verified", allocatedRoleId: null, updatedAt: now })
        .where(eq(schema.candidates.id, allocation.candidateId));

      await tx
        .update(schema.districts)
        .set({
          allocatedCount: sql`GREATEST(${schema.districts.allocatedCount} - 1, 0)`,
          updatedAt: now,
        })
        .where(eq(schema.districts.name, allocation.district));

      return mapAllocation({
        ...allocation,
        status: "Revoked",
        revokedBy: revokedBy ?? "System Administrator",
        revokedAt: now,
        revokeReason: reason ?? "Administrative revocation",
        updatedAt: now,
      });
    });
  },

  async getCandidateImage(candidateId: string): Promise<
    | {
        data: Buffer;
        mimeType: string;
        width: number;
        height: number;
        sizeBytes: number;
        checksum: string;
        updatedAt: string;
      }
    | undefined
  > {
    const [row] = await getDb()
      .select({
        data: schema.candidateImages.data,
        mimeType: schema.candidateImages.mimeType,
        width: schema.candidateImages.width,
        height: schema.candidateImages.height,
        sizeBytes: schema.candidateImages.sizeBytes,
        checksum: schema.candidateImages.checksum,
        updatedAt: schema.candidateImages.updatedAt,
      })
      .from(schema.candidateImages)
      .where(eq(schema.candidateImages.candidateId, candidateId))
      .limit(1);

    return row;
  },

  async upsertCandidateImage(
    candidateId: string,
    image: {
      data: Buffer;
      mimeType: string;
      width: number;
      height: number;
      sizeBytes: number;
      checksum: string;
    }
  ): Promise<{ photoUrl: string; width: number; height: number; sizeBytes: number; checksum: string }> {
    const database = getDb();
    return database.transaction(async (tx) => {
      const [candidate] = await tx
        .select({ id: schema.candidates.id })
        .from(schema.candidates)
        .where(eq(schema.candidates.id, candidateId))
        .limit(1)
        .for("update");

      if (!candidate) {
        throw new DomainError(404, "Candidate not found.");
      }

      const now = nowIso();
      const [existing] = await tx
        .select({ id: schema.candidateImages.id })
        .from(schema.candidateImages)
        .where(eq(schema.candidateImages.candidateId, candidateId))
        .limit(1)
        .for("update");

      if (existing) {
        await tx
          .update(schema.candidateImages)
          .set({ ...image, updatedAt: now })
          .where(eq(schema.candidateImages.id, existing.id));
      } else {
        await tx.insert(schema.candidateImages).values({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          candidateId,
          ...image,
          createdAt: now,
          updatedAt: now,
        });
      }

      const photoUrl = `/api/candidates/${candidateId}/photo?v=${image.checksum.slice(0, 12)}`;
      await tx
        .update(schema.candidates)
        .set({ photoUrl, updatedAt: now })
        .where(eq(schema.candidates.id, candidateId));

      return {
        photoUrl,
        width: image.width,
        height: image.height,
        sizeBytes: image.sizeBytes,
        checksum: image.checksum,
      };
    });
  },

  async getMessages(districtFilter?: string): Promise<ChatMessage[]> {
    const where =
      districtFilter && districtFilter !== "All"
        ? or(
            eq(schema.messages.district, districtFilter),
            eq(schema.messages.district, "All")
          )
        : undefined;

    const rows = await getDb()
      .select()
      .from(schema.messages)
      .where(where)
      .orderBy(desc(schema.messages.timestamp));

    return rows.map(mapMessage);
  },

  async createMessage(
    msg: Omit<ChatMessage, "id" | "timestamp" | "unread"> & { senderId?: string }
  ): Promise<ChatMessage> {
    const now = nowIso();
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await getDb().insert(schema.messages).values({
      id,
      senderId: msg.senderId ?? null,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      senderDepartment: msg.senderDepartment,
      district: msg.district,
      subject: msg.subject,
      message: msg.message,
      priority: msg.priority,
      timestamp: now,
      unread: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ...msg,
      id,
      senderId: msg.senderId,
      timestamp: now,
      unread: true,
    };
  },

  async markMessageRead(id: string): Promise<void> {
    await getDb()
      .update(schema.messages)
      .set({ unread: false, updatedAt: nowIso() })
      .where(eq(schema.messages.id, id));
  },

  async markMessagesRead(ids?: string[], districtFilter?: string): Promise<number> {
    if (ids && ids.length === 0) return 0;
    const conditions = [eq(schema.messages.unread, true)];
    if (ids) conditions.push(inArray(schema.messages.id, ids));
    if (districtFilter && districtFilter !== "All") {
      conditions.push(
        or(
          eq(schema.messages.district, districtFilter),
          eq(schema.messages.district, "All")
        )!
      );
    }

    const result = await getDb()
      .update(schema.messages)
      .set({ unread: false, updatedAt: nowIso() })
      .where(and(...conditions));

    return Number(result[0].affectedRows ?? 0);
  },

  async getAnalytics(districtFilter?: string): Promise<SystemAnalytics> {
    const database = getDb();
    const [districtRows, allCandidates, allAllocations] = await Promise.all([
      database.select().from(schema.districts),
      database.select().from(schema.candidates),
      database.select().from(schema.allocations),
    ]);

    let candidates = allCandidates;
    let allocations = allAllocations;

    if (districtFilter && districtFilter !== "All") {
      candidates = candidates.filter(
        (candidate) =>
          candidate.domicileDistrict.toLowerCase() === districtFilter.toLowerCase()
      );
      allocations = allocations.filter(
        (allocation) =>
          allocation.district.toLowerCase() === districtFilter.toLowerCase()
      );
    }

    const totalRegistered = candidates.length;
    const totalAllocated = allocations.filter((allocation) => allocation.status === "Active").length;
    const totalVerified = candidates.filter(
      (candidate) => candidate.status === "Verified" || candidate.status === "Allocated"
    ).length;

    const roleStats: Record<RoleCategory, number> = {
      "Ward Boy": 0,
      "Helper Boy": 0,
      "Stretcher Puller": 0,
      "Security Guard": 0,
      "Male Ward Attendant": 0,
      "Female Ward Attendant": 0,
      "Junior Clerk": 0,
      "Reception": 0,
      "Computer Operator": 0,
    };

    allocations.forEach((allocation) => {
      if (allocation.status === "Active" && roleStats[allocation.roleCategory] !== undefined) {
        roleStats[allocation.roleCategory] += 1;
      }
    });

    const partyStats: Record<PoliticalParty, number> = {
      "Quota A": 0,
      "Quota B": 0,
      "Quota C": 0,
      "Quota D": 0,
      "Quota E": 0,
      "Quota F": 0,
      "DIR-OFFICE": 0,
      "MERIT-OPEN": 0,
      "DEPT-DIRECT": 0,
    };

    candidates.forEach((candidate) => {
      if (partyStats[candidate.partyAffiliation] !== undefined) {
        partyStats[candidate.partyAffiliation] += 1;
      }
    });

    const districtStats = districtRows.map((districtRow) => {
      const registered = allCandidates.filter(
        (candidate) =>
          candidate.domicileDistrict.toLowerCase() === districtRow.name.toLowerCase()
      ).length;
      const activeAllocations = allAllocations.filter(
        (allocation) =>
          allocation.district.toLowerCase() === districtRow.name.toLowerCase() &&
          allocation.status === "Active"
      ).length;
      const allocated = Math.max(districtRow.allocatedCount, activeAllocations);
      const percentage = Math.min(
        100,
        Math.round((allocated / Math.max(1, districtRow.totalQuota)) * 100)
      );
      return {
        district: districtRow.name,
        registered,
        allocated,
        quota: districtRow.totalQuota,
        percentage,
      };
    });

    return {
      totalRegistered,
      totalAllocated,
      totalVerified,
      totalDistricts: districtRows.length,
      districtStats,
      roleStats,
      partyStats,
      recentAllocations: allocations
        .filter((allocation) => allocation.status === "Active")
        .sort((a, b) => b.allocatedDate.localeCompare(a.allocatedDate))
        .slice(0, 8)
        .map(mapAllocation),
    };
  },
};

export { stripCandidateSecret as publicCandidate };
