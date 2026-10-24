export type Province = "Khyber Pakhtunkhwa" | "Punjab" | "Sindh" | "Balochistan" | "Islamabad Capital Territory";

// Reference Short-Codes / Authorized Aliases instead of real political names
export type RecommenderAlias = 
  | "DIR-OFFICE"
  | "REF-NA-01" 
  | "REF-NA-02" 
  | "REF-PA-01" 
  | "REF-PA-02" 
  | "REF-DIST-01"
  | "REF-NZM-01" 
  | "REF-NZM-02" 
  | "MERIT-OPEN" 
  | "DEPT-DIRECT";

// Backward-compatible alias for existing political references
export type PoliticalParty = RecommenderAlias;

// DHQ Hospital Staff Roles (strictly from client voice notes)
export type RoleCategory = 
  | "Ward Boy" 
  | "Helper Boy" 
  | "Stretcher Puller" 
  | "Security Guard" 
  | "Male Ward Attendant" 
  | "Female Ward Attendant" 
  | "Junior Clerk" 
  | "Reception" 
  | "Computer Operator";

export const DHQ_STAFF_ROLES: RoleCategory[] = [
  "Ward Boy",
  "Helper Boy",
  "Stretcher Puller",
  "Security Guard",
  "Male Ward Attendant",
  "Female Ward Attendant",
  "Junior Clerk",
  "Reception",
  "Computer Operator",
];

export const DI_KHAN_TEHSILS = [
  "Daraban",
  "Kulachi",
  "Paharpur",
  "Dera",
  "Parova",
] as const;

export type DIKhanTehsil = typeof DI_KHAN_TEHSILS[number];

export type CandidateStatus = "Registered" | "Verified" | "Allocated" | "Under Review";

export type UserPermissions = {
  canRegisterCandidates: boolean;
  canAllocateSeats: boolean;
  canRevokeAllocations: boolean;
  canSendMessage: boolean;
  canGenerateReports: boolean;
  canManageDistricts: boolean;
};

export type EducationRecord = {
  level: "Matric" | "FSc / Intermediate" | "Bachelors" | "Masters" | "Other";
  degreeName: string;
  institute: string;
  passingYear: number;
  grade: string;
  documentName?: string;
  documentUrl?: string;
};

export type Candidate = {
  id: string;
  fullName: string;
  fatherName: string;
  cnic: string; // Format: XXXXX-XXXXXXX-X
  fatherCnic?: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  address: string;
  domicileDistrict: string;
  constituency: string; // e.g. NA-44 or PA-112
  tehsil: string;
  unionCouncil?: string;
  partyAffiliation: RecommenderAlias; // Reference / Recommendation short code
  referenceCode?: string;
  appliedRole?: RoleCategory;
  appointmentOrderNo?: string;
  joiningOrderNo?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  photoUrl: string;
  matricDetails: {
    board: string;
    passingYear: number;
    grade: string;
    documentUrl?: string;
  };
  fscDetails: {
    board: string;
    passingYear: number;
    group: string;
    grade: string;
    documentUrl?: string;
  };
  higherEducation?: EducationRecord[];
  status: CandidateStatus;
  allocatedRoleId?: string;
  registeredAt: string;
  notes?: string;
};

export type District = {
  id: string;
  name: string;
  province: Province;
  constituencies: string[];
  totalQuota: number;
  allocatedCount: number;
};

export type Allocation = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateCnic: string;
  district: string;
  constituency: string;
  roleCategory: RoleCategory;
  roleTitle: string;
  department: string;
  partyAffiliation: RecommenderAlias;
  allocatedDate: string;
  tenureMonths: number;
  status: "Active" | "Completed" | "Revoked";
  allocatedBy: string;
  appointmentRefNo: string;
  joiningOrderNo?: string;
  salaryOrStipend?: string;
  remarks?: string;
  revokedBy?: string;
  revokedAt?: string;
  revokeReason?: string;
};

export type MessagePriority = "Urgent" | "Official Notice" | "Routine" | "Inquiry";

export type ChatMessage = {
  id: string;
  senderId?: string;
  senderName: string;
  senderRole: string;
  senderDepartment: string;
  district: string;
  subject: string;
  message: string;
  priority: MessagePriority;
  timestamp: string;
  unread: boolean;
};

export type SystemAnalytics = {
  totalRegistered: number;
  totalAllocated: number;
  totalVerified: number;
  totalDistricts: number;
  districtStats: {
    district: string;
    registered: number;
    allocated: number;
    quota: number;
    percentage: number;
  }[];
  roleStats: Record<RoleCategory, number>;
  partyStats: Record<RecommenderAlias, number>;
  recentAllocations: Allocation[];
};
