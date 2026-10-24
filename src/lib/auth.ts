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
    name: "Prof. Dr. Tariq Jamil Chishti",
    title: "Hospital Director / Chief Executive",
    department: "Executive Directorate, DHQ Teaching Hospital D.I. Khan",
    email: "admin",
    defaultDistrict: "Dera Ismail Khan",
    avatar: "/images/admin_portrait.jpg",
    badge: "Hospital Director",
    badgeColor: "bg-teal-700 text-white",
    description: "Complete executive authority over DHQ Hospital staff recruitments, directive appointment orders, joining orders, and staff registry.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: true,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: true,
    },
  },
  director: {
    roleKey: "director",
    name: "Dr. Muhammad Tariq Khan",
    title: "Hospital Director",
    department: "Directorate of Administration, DHQ Hospital D.I. Khan",
    email: "director",
    defaultDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    avatar: "/images/civil_officer_portrait.jpg",
    badge: "Hospital Director",
    badgeColor: "bg-cyan-700 text-white",
    description: "Issuance of directive appointment orders, scrutiny of applicants, and authorized short-code reference verification.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: true,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: true,
    },
  },
  ms: {
    roleKey: "ms",
    name: "Dr. Sajjad Ahmad Qureshi",
    title: "Medical Superintendent (MS)",
    department: "Medical Superintendent Wing, DHQ Hospital D.I. Khan",
    email: "ms",
    defaultDistrict: "Dera Ismail Khan",
    avatar: "/images/chairperson_portrait.jpg",
    badge: "Medical Superintendent",
    badgeColor: "bg-blue-700 text-white",
    description: "Oversight of ward staff allocations, duty rosters, and joining reports verification.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: true,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: false,
    },
  },
  clerk: {
    roleKey: "clerk",
    name: "Muhammad Aslam Baloch",
    title: "Senior Junior Clerk / HR Officer",
    department: "Recruitment & Personnel Branch, DHQ Hospital",
    email: "clerk",
    defaultDistrict: "Dera Ismail Khan",
    avatar: "/images/staff_portrait.jpg",
    badge: "HR Clerk",
    badgeColor: "bg-indigo-700 text-white",
    description: "Staff applicant data entry, CNIC scan verification, and single-click summary roster generation.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: false,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: false,
    },
  },
  operator: {
    roleKey: "operator",
    name: "Farhan Ali Gandapur",
    title: "Computer Operator / Record Keeper",
    department: "IT & Record Cell, DHQ Hospital D.I. Khan",
    email: "operator",
    defaultDistrict: "Dera Ismail Khan",
    avatar: "/images/councilor_portrait.jpg",
    badge: "Computer Operator",
    badgeColor: "bg-emerald-700 text-white",
    description: "Digital record entry, Tehsil and Union Council categorization, and daily dispatch reports.",
    permissions: {
      canRegisterCandidates: true,
      canAllocateSeats: false,
      canRevokeAllocations: false,
      canSendMessage: true,
      canGenerateReports: true,
      canManageDistricts: false,
    },
  },
};

// Aliases for user convenience
const ROLE_ALIASES: Record<string, string> = {
  "admin": "admin",
  "administrator": "admin",
  "director": "director",
  "hospital_director": "director",
  "ms": "ms",
  "medical_superintendent": "ms",
  "clerk": "clerk",
  "junior_clerk": "clerk",
  "operator": "operator",
  "computer_operator": "operator",
  "staff": "clerk",
};

const ROLE_CATEGORY_BY_KEY: Record<string, RoleCategory | "Admin"> = {
  admin: "Admin",
  director: "Admin",
  ms: "Admin",
  clerk: "Junior Clerk",
  operator: "Computer Operator",
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
    roleCategory: ROLE_CATEGORY_BY_KEY[matchedPresetKey] ?? "Admin",
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
