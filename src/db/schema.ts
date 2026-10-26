import {
  boolean,
  customType,
  index,
  int,
  json,
  longtext,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import type {
  EducationRecord,
  PoliticalParty,
  RoleCategory,
  CandidateStatus,
  UserPermissions,
} from "@/types";

const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "mediumblob";
  },
});

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    username: varchar("username", { length: 64 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    roleKey: varchar("role_key", { length: 64 }).notNull(),
    roleCategory: varchar("role_category", { length: 64 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    department: varchar("department", { length: 255 }).notNull(),
    district: varchar("district", { length: 100 }).notNull(),
    constituency: varchar("constituency", { length: 64 }),
    avatar: varchar("avatar", { length: 512 }).notNull(),
    badgeColor: varchar("badge_color", { length: 128 }).notNull(),
    permissions: json("permissions").$type<UserPermissions>().notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: varchar("last_login_at", { length: 30 }),
    createdAt: varchar("created_at", { length: 30 }).notNull(),
    updatedAt: varchar("updated_at", { length: 30 }).notNull(),
  },
  (table) => [
    uniqueIndex("users_username_uq").on(table.username),
    uniqueIndex("users_email_uq").on(table.email),
    index("users_role_idx").on(table.roleKey),
    index("users_active_idx").on(table.isActive),
  ]
);

export const districts = mysqlTable(
  "districts",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    province: varchar("province", { length: 64 }).notNull(),
    constituencies: json("constituencies").$type<string[]>().notNull(),
    totalQuota: int("total_quota").notNull(),
    allocatedCount: int("allocated_count").notNull().default(0),
    createdAt: varchar("created_at", { length: 30 }).notNull(),
    updatedAt: varchar("updated_at", { length: 30 }).notNull(),
  },
  (table) => [
    uniqueIndex("districts_name_uq").on(table.name),
    index("districts_province_idx").on(table.province),
  ]
);

export const candidates = mysqlTable(
  "candidates",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    fullName: varchar("full_name", { length: 191 }).notNull(),
    fatherName: varchar("father_name", { length: 191 }).notNull(),
    cnic: varchar("cnic", { length: 15 }).notNull(),
    cnicDigits: varchar("cnic_digits", { length: 13 }).notNull(),
    dob: varchar("dob", { length: 10 }).notNull(),
    gender: varchar("gender", { length: 10 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    address: varchar("address", { length: 255 }).notNull(),
    domicileDistrict: varchar("domicile_district", { length: 100 }).notNull(),
    constituency: varchar("constituency", { length: 64 }).notNull(),
    tehsil: varchar("tehsil", { length: 100 }).notNull(),
    unionCouncil: varchar("union_council", { length: 100 }),
    fatherCnic: varchar("father_cnic", { length: 15 }),
    referenceCode: varchar("reference_code", { length: 64 }),
    appliedRole: varchar("applied_role", { length: 64 }),
    appointmentOrderNo: varchar("appointment_order_no", { length: 100 }),
    joiningOrderNo: varchar("joining_order_no", { length: 100 }),
    cnicFrontUrl: longtext("cnic_front_url"),
    cnicBackUrl: longtext("cnic_back_url"),
    partyAffiliation: varchar("party_affiliation", { length: 64 })
      .$type<PoliticalParty>()
      .notNull(),
    photoUrl: longtext("photo_url").notNull(),
    matricDetails: json("matric_details")
      .$type<{
        board: string;
        passingYear: number;
        grade: string;
        documentUrl?: string;
      }>()
      .notNull(),
    fscDetails: json("fsc_details")
      .$type<{
        board: string;
        passingYear: number;
        group: string;
        grade: string;
        documentUrl?: string;
      }>()
      .notNull(),
    higherEducation: json("higher_education").$type<EducationRecord[]>(),
    status: varchar("status", { length: 32 }).$type<CandidateStatus>().notNull(),
    allocatedRoleId: varchar("allocated_role_id", { length: 64 }),
    registeredAt: varchar("registered_at", { length: 30 }).notNull(),
    notes: varchar("notes", { length: 1000 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    createdAt: varchar("created_at", { length: 30 }).notNull(),
    updatedAt: varchar("updated_at", { length: 30 }).notNull(),
  },
  (table) => [
    uniqueIndex("candidates_cnic_uq").on(table.cnicDigits),
    uniqueIndex("candidates_email_uq").on(table.email),
    index("candidates_district_idx").on(table.domicileDistrict),
    index("candidates_status_idx").on(table.status),
    index("candidates_party_idx").on(table.partyAffiliation),
    index("candidates_name_idx").on(table.fullName),
  ]
);

export const allocations = mysqlTable(
  "allocations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    candidateId: varchar("candidate_id", { length: 64 })
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    candidateName: varchar("candidate_name", { length: 191 }).notNull(),
    candidateCnic: varchar("candidate_cnic", { length: 15 }).notNull(),
    district: varchar("district", { length: 100 }).notNull(),
    constituency: varchar("constituency", { length: 64 }).notNull(),
    roleCategory: varchar("role_category", { length: 64 })
      .$type<RoleCategory>()
      .notNull(),
    roleTitle: varchar("role_title", { length: 191 }).notNull(),
    department: varchar("department", { length: 255 }).notNull(),
    partyAffiliation: varchar("party_affiliation", { length: 32 })
      .$type<PoliticalParty>()
      .notNull(),
    allocatedDate: varchar("allocated_date", { length: 10 }).notNull(),
    tenureMonths: int("tenure_months").notNull(),
    status: varchar("status", { length: 20 })
      .$type<"Active" | "Completed" | "Revoked">()
      .notNull(),
    allocatedBy: varchar("allocated_by", { length: 191 }).notNull(),
    appointmentRefNo: varchar("appointment_ref_no", { length: 100 }).notNull(),
    joiningOrderNo: varchar("joining_order_no", { length: 100 }),
    salaryOrStipend: varchar("salary_or_stipend", { length: 100 }),
    remarks: varchar("remarks", { length: 1000 }),
    revokedBy: varchar("revoked_by", { length: 191 }),
    revokedAt: varchar("revoked_at", { length: 30 }),
    revokeReason: varchar("revoke_reason", { length: 500 }),
    createdAt: varchar("created_at", { length: 30 }).notNull(),
    updatedAt: varchar("updated_at", { length: 30 }).notNull(),
  },
  (table) => [
    uniqueIndex("allocations_ref_uq").on(table.appointmentRefNo),
    index("allocations_candidate_idx").on(table.candidateId),
    index("allocations_district_status_idx").on(table.district, table.status),
    index("allocations_status_idx").on(table.status),
  ]
);

export const candidateImages = mysqlTable(
  "candidate_images",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    candidateId: varchar("candidate_id", { length: 64 })
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    mimeType: varchar("mime_type", { length: 64 }).notNull(),
    data: mediumBlob("data").notNull(),
    width: int("width").notNull(),
    height: int("height").notNull(),
    sizeBytes: int("size_bytes").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    createdAt: varchar("created_at", { length: 30 }).notNull(),
    updatedAt: varchar("updated_at", { length: 30 }).notNull(),
  },
  (table) => [uniqueIndex("candidate_images_candidate_uq").on(table.candidateId)]
);

export const candidateDocuments = mysqlTable(
  "candidate_documents",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    candidateId: varchar("candidate_id", { length: 64 })
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    field: varchar("field", { length: 32 }).notNull(),
    fileName: varchar("file_name", { length: 191 }).notNull(),
    mimeType: varchar("mime_type", { length: 64 }).notNull(),
    data: mediumBlob("data").notNull(),
    originalSizeBytes: int("original_size_bytes").notNull(),
    sizeBytes: int("size_bytes").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    createdAt: varchar("created_at", { length: 30 }).notNull(),
    updatedAt: varchar("updated_at", { length: 30 }).notNull(),
  },
  (table) => [
    uniqueIndex("candidate_documents_field_uq").on(table.candidateId, table.field),
    index("candidate_documents_candidate_idx").on(table.candidateId),
  ]
);

export const messages = mysqlTable(
  "messages",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    senderId: varchar("sender_id", { length: 64 }).references(() => users.id, {
      onDelete: "set null",
    }),
    senderName: varchar("sender_name", { length: 191 }).notNull(),
    senderRole: varchar("sender_role", { length: 128 }).notNull(),
    senderDepartment: varchar("sender_department", { length: 255 }).notNull(),
    district: varchar("district", { length: 100 }).notNull(),
    subject: varchar("subject", { length: 191 }).notNull(),
    message: varchar("message", { length: 5000 }).notNull(),
    priority: varchar("priority", { length: 32 }).notNull(),
    timestamp: varchar("timestamp", { length: 30 }).notNull(),
    unread: boolean("unread").notNull().default(true),
    createdAt: varchar("created_at", { length: 30 }).notNull(),
    updatedAt: varchar("updated_at", { length: 30 }).notNull(),
  },
  (table) => [
    index("messages_district_idx").on(table.district),
    index("messages_timestamp_idx").on(table.timestamp),
    index("messages_unread_idx").on(table.unread),
    index("messages_sender_idx").on(table.senderId),
  ]
);

export const schema = {
  users,
  districts,
  candidates,
  candidateImages,
  candidateDocuments,
  allocations,
  messages,
};
