export type Province = "Punjab" | "Sindh" | "Khyber Pakhtunkhwa" | "Balochistan" | "Islamabad Capital Territory";

export type PoliticalParty = 
  | "PTI" 
  | "PMLN" 
  | "PPP" 
  | "JUI-F" 
  | "MQM-P" 
  | "JI" 
  | "ANP" 
  | "TLP" 
  | "Independent";

export type RoleCategory = 
  | "MNA" 
  | "MPA" 
  | "District Chairperson" 
  | "Union Council Chairman" 
  | "Councilor" 
  | "Civil Administration Officer" 
  | "Committee Head" 
  | "Public Sector Staff";

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
  dob: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  address: string;
  domicileDistrict: string;
  constituency: string; // e.g. NA-127 or PP-160
  tehsil: string;
  unionCouncil?: string;
  partyAffiliation: PoliticalParty;
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
    group: string; // Pre-Medical, Pre-Engineering, ICS, I.Com, Arts
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
  partyAffiliation: PoliticalParty;
  allocatedDate: string;
  tenureMonths: number;
  status: "Active" | "Completed" | "Revoked";
  allocatedBy: string;
  appointmentRefNo: string;
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
  partyStats: Record<PoliticalParty, number>;
  recentAllocations: Allocation[];
};
