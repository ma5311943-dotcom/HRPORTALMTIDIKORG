import { Candidate, RoleCategory, UserPermissions } from "@/types";

export interface UserSession {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  roleCategory?: RoleCategory | "Admin" | "Candidate";
  isCandidate?: boolean;
  candidateId?: string;
  cnic?: string;
  title: string;
  department: string;
  district: string;
  constituency?: string;
  avatar: string;
  badgeColor: string;
  permissions: UserPermissions;
}

export interface RolePreset {
  roleKey: string;
  name: string;
  title: string;
  department: string;
  email: string;
  defaultDistrict: string;
  constituency?: string;
  avatar: string;
  badge: string;
  badgeColor: string;
  description: string;
  permissions: UserSession["permissions"];
}

export const ROLE_PRESETS: Record<string, RolePreset> = {
  admin: {
    roleKey: "admin",
    name: "Dr. Tariq Jamil Chishti",
    title: "Chief Human Resources Commissioner",
    department: "National Assembly Central Secretariat, Islamabad",
    email: "admin",
    defaultDistrict: "All",
    avatar: "/images/admin_portrait.jpg",
    badge: "Super Admin",
    badgeColor: "bg-amber-600 text-white",
    description: "Complete sovereign control over all 12 districts, seat allocations, system ledgers, and official appointment gazettes.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: true,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: true,
    },
  },
  mna: {
    roleKey: "mna",
    name: "Malik Naveed Awan (MNA)",
    title: "Member of the National Assembly",
    department: "Parliament of Pakistan (NA-127 Lahore / Model Town)",
    email: "mna",
    defaultDistrict: "Lahore",
    constituency: "NA-127",
    avatar: "/images/mna_portrait.jpg",
    badge: "MNA National Assembly",
    badgeColor: "bg-emerald-700 text-white",
    description: "Parliamentary constituency seat allocation, candidate nomination, and legislative quota oversight.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: false,
    },
  },
  mpa: {
    roleKey: "mpa",
    name: "Syeda Fatimah Bokhari (MPA)",
    title: "Member of Provincial Assembly",
    department: "Provincial Assembly of the Punjab (PP-160)",
    email: "mpa",
    defaultDistrict: "Lahore",
    constituency: "PP-160",
    avatar: "/images/mpa_portrait.jpg",
    badge: "MPA Provincial Assembly",
    badgeColor: "bg-teal-700 text-white",
    description: "Provincial quota monitoring, local constituency representation, and inter-departmental communications.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: false,
    },
  },
  chairperson: {
    roleKey: "chairperson",
    name: "Chaudhry Riaz Gujjar",
    title: "District Chairperson",
    department: "District Council Secretariat, Rawalpindi",
    email: "chairperson",
    defaultDistrict: "Rawalpindi",
    avatar: "/images/chairperson_portrait.jpg",
    badge: "District Chairperson",
    badgeColor: "bg-indigo-700 text-white",
    description: "Regional district candidate approvals, municipal quota fulfillment, and administrative staffing.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: true,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: false,
    },
  },
  uc_chairman: {
    roleKey: "uc_chairman",
    name: "Haji Abdul Rehman Durrani",
    title: "Union Council Chairman",
    department: "Local Government & Community Development (UC-182)",
    email: "uc_chairman",
    defaultDistrict: "Peshawar",
    avatar: "/images/uc_chairman_portrait.jpg",
    badge: "UC Chairman",
    badgeColor: "bg-blue-700 text-white",
    description: "Grassroots candidate enrollment, local verification, and community grievance notifications.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: false,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: false,
      canManageDistricts: false,
    },
  },
  councilor: {
    roleKey: "councilor",
    name: "Bilal Hassan Abbasi",
    title: "Municipal Ward Councilor",
    department: "Metropolitan Corporation Islamabad (Ward 14)",
    email: "councilor",
    defaultDistrict: "Islamabad",
    avatar: "/images/councilor_portrait.jpg",
    badge: "Councilor",
    badgeColor: "bg-cyan-700 text-white",
    description: "Ward-level verification, public sector job registry submissions, and applicant endorsements.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: false,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: false,
      canManageDistricts: false,
    },
  },
  civil_officer: {
    roleKey: "civil_officer",
    name: "Kamran Shahbaz (PAS / Deputy Commissioner)",
    title: "Civil Administration Officer",
    department: "Deputy Commissioner Office & District Administration, Karachi Central",
    email: "civil_officer",
    defaultDistrict: "Karachi Central",
    avatar: "/images/civil_officer_portrait.jpg",
    badge: "Civil Admin Officer",
    badgeColor: "bg-slate-800 text-white",
    description: "Civil service quota verification, appointment gazette issuance, and inter-agency notification clearance.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: true,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: true,
    },
  },
  committee_head: {
    roleKey: "committee_head",
    name: "Prof. Dr. Nargis Farooq",
    title: "Parliamentary Scrutiny Committee Head",
    department: "Special Committee on Human Resource & Allocation Audits",
    email: "committee_head",
    defaultDistrict: "All",
    avatar: "/images/committee_head_portrait.jpg",
    badge: "Committee Head",
    badgeColor: "bg-purple-700 text-white",
    description: "Auditing candidate credentials, review of quota anomalies, and independent committee reports.",
    permissions: {
      canRegisterCandidates: false,
      canAllocateSeats: false,
      canRevokeAllocations: true,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: false,
    },
  },
  staff: {
    roleKey: "staff",
    name: "Zubair Ahmad Qazi",
    title: "Public Sector Data Operator & Verification Staff",
    department: "Constituency HR Helpdesk & Archive Wing, Quetta",
    email: "staff",
    defaultDistrict: "Quetta",
    avatar: "/images/staff_portrait.jpg",
    badge: "Public Sector Staff",
    badgeColor: "bg-zinc-700 text-white",
    description: "Entry of applicant educational transcripts, CNIC scans, and inquiry processing.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: false,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: false,
      canManageDistricts: false,
    },
  },
};

// Aliases for user convenience (e.g. "district_chairperson", "uc", "officer", etc.)
const ROLE_ALIASES: Record<string, string> = {
  "admin": "admin",
  "administrator": "admin",
  "mna": "mna",
  "mpa": "mpa",
  "chairperson": "chairperson",
  "district_chairperson": "chairperson",
  "districtchairperson": "chairperson",
  "uc": "uc_chairman",
  "uc_chairman": "uc_chairman",
  "ucchairman": "uc_chairman",
  "union_council_chairman": "uc_chairman",
  "councilor": "councilor",
  "civil_officer": "civil_officer",
  "civildministrationofficer": "civil_officer",
  "officer": "civil_officer",
  "dc": "civil_officer",
  "committee_head": "committee_head",
  "committeehead": "committee_head",
  "staff": "staff",
  "public_sector_staff": "staff",
  "operator": "staff",
};

const ROLE_CATEGORY_BY_KEY: Record<string, RoleCategory | "Admin"> = {
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

/**
 * Authenticates user where identifier (email/username) and password match.
 * Example:
 *   admin / admin
 *   mna / mna
 *   mpa / mpa
 *   chairperson / chairperson
 *   uc_chairman / uc_chairman
 *   civil_officer / civil_officer
 *   staff / staff
 * Also supports emails like admin@internalhr.gov.pk or mna@na.gov.pk
 */
export function authenticateUser(identifier: string, passwordInput: string): UserSession | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordInput.trim().toLowerCase();

  // Strip email domain if provided (e.g., "admin@..." -> "admin")
  const normalizedKey = cleanId.split("@")[0].replace(/[\s-]/g, "_");

  // Check alias map
  let matchedPresetKey = ROLE_ALIASES[normalizedKey];

  if (!matchedPresetKey) {
    // Check if directly one of the keys
    if (ROLE_PRESETS[normalizedKey]) {
      matchedPresetKey = normalizedKey;
    }
  }

  if (!matchedPresetKey) {
    return null;
  }

  // The password requirement: password must match the role key or the username entered!
  // e.g. for "admin", password "admin"
  // e.g. for "chairperson", password "chairperson"
  // e.g. for "district_chairperson", password "district_chairperson" or "chairperson"
  const validPasswords = [
    matchedPresetKey,
    cleanId,
    normalizedKey,
    "admin123", // fallback convenience
    "123456",
  ];

  if (!validPasswords.includes(cleanPass)) {
    return null;
  }

  const preset = ROLE_PRESETS[matchedPresetKey];
  return {
    id: `user-${matchedPresetKey}`,
    username: matchedPresetKey,
    email: `${matchedPresetKey}@internalhr.gov.pk`,
    name: preset.name,
    role: preset.title,
    roleCategory: ROLE_CATEGORY_BY_KEY[matchedPresetKey] ?? "Public Sector Staff",
    title: preset.title,
    department: preset.department,
    district: preset.defaultDistrict,
    constituency: preset.constituency,
    avatar: preset.avatar,
    badgeColor: preset.badgeColor,
    permissions: preset.permissions,
  };
}

/**
 * Builds a read-only session for a registered citizen/candidate. Candidates do
 * not receive administrative permissions; they can view the national dashboard
 * and their own registration context.
 */
export function createCandidateSession(candidate: Candidate): UserSession {
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

const STORAGE_KEY = "chras_auth_session_2026";

export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored session", e);
    return null;
  }
}

export function saveSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear session", e);
  }
}
