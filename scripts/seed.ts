import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { getDb, getPool, schema } from "../src/db/client";
import { ROLE_PRESETS } from "../src/lib/auth";
import { hashPassword } from "../src/lib/password";
import type { ChatMessage, District, RecommenderAlias, RoleCategory } from "../src/types";

// Official 5 Tehsils of Dera Ismail Khan
const DI_KHAN_TEHSILS = ["Daraban", "Kulachi", "Paharpur", "Dera", "Parova"];

const initialDistricts: District[] = [
  {
    id: "dik",
    name: "Dera Ismail Khan",
    province: "Khyber Pakhtunkhwa",
    constituencies: ["NA-44", "NA-45", "PK-111", "PK-112", "PK-113", "PK-114", "PK-115"],
    totalQuota: 350,
    allocatedCount: 5
  },
  {
    id: "tank",
    name: "Tank",
    province: "Khyber Pakhtunkhwa",
    constituencies: ["NA-42"],
    totalQuota: 40,
    allocatedCount: 0
  },
  {
    id: "bannu",
    name: "Bannu",
    province: "Khyber Pakhtunkhwa",
    constituencies: ["NA-41"],
    totalQuota: 50,
    allocatedCount: 0
  },
  {
    id: "lakki",
    name: "Lakki Marwat",
    province: "Khyber Pakhtunkhwa",
    constituencies: ["NA-40"],
    totalQuota: 60,
    allocatedCount: 0
  }
];

// Candidates for DHQ Hospital Staff (5+ items per role/table)
const initialCandidates = [
  {
    id: "dhq-cand-01",
    fullName: "Muhammad Kamran Baloch",
    fatherName: "Ghulam Rasool Baloch",
    cnic: "12101-7391823-1",
    fatherCnic: "12101-1827364-1",
    dob: "1997-04-12",
    gender: "Male" as const,
    phone: "0300-8392101",
    email: "kamran.baloch@dhq.hospital.pk",
    address: "Mohallah Qasaban, Circular Road, D.I. Khan City",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    tehsil: "Dera",
    unionCouncil: "UC Central-01",
    partyAffiliation: "REF-NA-01" as RecommenderAlias,
    referenceCode: "REF-NA-01",
    appliedRole: "Ward Boy" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/014",
    joiningOrderNo: "DHQ-MS/JOIN/2026/014",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2015, grade: "B" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2017, group: "General", grade: "B" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-01",
    registeredAt: "2026-10-15T09:00:00Z",
    notes: "Allocated as Ward Boy in Emergency & Trauma Center under Ref Code REF-NA-01"
  },
  {
    id: "dhq-cand-02",
    fullName: "Abdul Rehman Gandapur",
    fatherName: "Haji Gulzar Khan Gandapur",
    cnic: "12101-8392019-3",
    fatherCnic: "12101-9281726-5",
    dob: "1999-08-20",
    gender: "Male" as const,
    phone: "0333-9821734",
    email: "rehman.gandapur@dhq.hospital.pk",
    address: "Main Bazar Kulachi, Tehsil Kulachi",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-45",
    tehsil: "Kulachi",
    unionCouncil: "UC Kulachi-03",
    partyAffiliation: "REF-PA-01" as RecommenderAlias,
    referenceCode: "REF-PA-01",
    appliedRole: "Helper Boy" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/015",
    joiningOrderNo: "DHQ-MS/JOIN/2026/015",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2016, grade: "B" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2018, group: "Arts", grade: "C" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-02",
    registeredAt: "2026-10-16T10:15:00Z",
    notes: "Duty in Surgical ICU Ward. Recommended by Authorized Code REF-PA-01"
  },
  {
    id: "dhq-cand-03",
    fullName: "Jahangir Tariq Marwat",
    fatherName: "Tariq Zaman Marwat",
    cnic: "12101-4729184-5",
    fatherCnic: "12101-6281923-3",
    dob: "1998-11-05",
    gender: "Male" as const,
    phone: "0345-7829104",
    email: "jahangir.marwat@dhq.hospital.pk",
    address: "Village Daraban Kalan, Tehsil Daraban",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    tehsil: "Daraban",
    unionCouncil: "UC Daraban-02",
    partyAffiliation: "DIR-OFFICE" as RecommenderAlias,
    referenceCode: "DIR-OFFICE",
    appliedRole: "Stretcher Puller" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/016",
    joiningOrderNo: "DHQ-MS/JOIN/2026/016",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2015, grade: "C" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2017, group: "General", grade: "C" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-03",
    registeredAt: "2026-10-16T11:45:00Z",
    notes: "Hospital Emergency gate patient transfer service. Directive by Hospital Director."
  },
  {
    id: "dhq-cand-04",
    fullName: "Niamatullah Kundi",
    fatherName: "Sher Dil Khan Kundi",
    cnic: "12101-9182736-7",
    fatherCnic: "12101-5192837-9",
    dob: "1994-03-18",
    gender: "Male" as const,
    phone: "0312-9847291",
    email: "niamat.kundi@dhq.hospital.pk",
    address: "Near Post Office Paharpur, Tehsil Paharpur",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    tehsil: "Paharpur",
    unionCouncil: "UC Paharpur-04",
    partyAffiliation: "REF-NZM-01" as RecommenderAlias,
    referenceCode: "REF-NZM-01",
    appliedRole: "Security Guard" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/017",
    joiningOrderNo: "DHQ-MS/JOIN/2026/017",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2012, grade: "B" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2014, group: "Arts", grade: "B" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-04",
    registeredAt: "2026-10-17T08:30:00Z",
    notes: "Main Gate & OPD Entrance Security. Recommender: REF-NZM-01"
  },
  {
    id: "dhq-cand-05",
    fullName: "Muhammad Rizwan Alizai",
    fatherName: "Hafiz Noor Muhammad",
    cnic: "12101-3829104-9",
    fatherCnic: "12101-8273619-7",
    dob: "1996-07-25",
    gender: "Male" as const,
    phone: "0301-4729184",
    email: "rizwan.alizai@dhq.hospital.pk",
    address: "Mohallah Alizai, Tehsil Parova",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-45",
    tehsil: "Parova",
    unionCouncil: "UC Parova-01",
    partyAffiliation: "REF-DIST-01" as RecommenderAlias,
    referenceCode: "REF-DIST-01",
    appliedRole: "Male Ward Attendant" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/018",
    joiningOrderNo: "DHQ-MS/JOIN/2026/018",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2013, grade: "A" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2015, group: "Pre-Medical", grade: "B" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-05",
    registeredAt: "2026-10-17T12:00:00Z",
    notes: "Allocated in Male Orthopedic & General Surgery Ward."
  },
  {
    id: "dhq-cand-06",
    fullName: "Farzana Bibi Khattak",
    fatherName: "Gulzar Ahmad Khattak",
    cnic: "12101-5291837-2",
    fatherCnic: "12101-3829174-8",
    dob: "1997-09-14",
    gender: "Female" as const,
    phone: "0335-8291047",
    email: "farzana.khattak@dhq.hospital.pk",
    address: "Basti Ustrana, Near Grid Station, D.I. Khan",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    tehsil: "Dera",
    unionCouncil: "UC Urban-05",
    partyAffiliation: "REF-NA-02" as RecommenderAlias,
    referenceCode: "REF-NA-02",
    appliedRole: "Female Ward Attendant" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/019",
    joiningOrderNo: "DHQ-MS/JOIN/2026/019",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2014, grade: "A" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2016, group: "General", grade: "A" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-06",
    registeredAt: "2026-10-18T10:00:00Z",
    notes: "Allocated in Gynae & Obstetrics Female Ward. Reference: REF-NA-02"
  },
  {
    id: "dhq-cand-07",
    fullName: "Shahid Iqbal Gandapur",
    fatherName: "Muhammad Iqbal Gandapur",
    cnic: "12101-6382910-1",
    fatherCnic: "12101-1928374-3",
    dob: "1995-12-10",
    gender: "Male" as const,
    phone: "0302-8392019",
    email: "shahid.clerk@dhq.hospital.pk",
    address: "Mohallah Sadat, Kulachi",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-45",
    tehsil: "Kulachi",
    unionCouncil: "UC Kulachi-01",
    partyAffiliation: "MERIT-OPEN" as RecommenderAlias,
    referenceCode: "MERIT-OPEN",
    appliedRole: "Junior Clerk" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/020",
    joiningOrderNo: "DHQ-MS/JOIN/2026/020",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2012, grade: "A" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2014, group: "I.Com", grade: "A" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-07",
    registeredAt: "2026-10-18T14:30:00Z",
    notes: "Recruitment Branch Junior Clerk. Merit-based appointment."
  },
  {
    id: "dhq-cand-08",
    fullName: "Ayesha Noor Baloch",
    fatherName: "Noor Alam Baloch",
    cnic: "12101-7291834-4",
    fatherCnic: "12101-4829103-6",
    dob: "2000-05-18",
    gender: "Female" as const,
    phone: "0331-9283746",
    email: "ayesha.reception@dhq.hospital.pk",
    address: "Civil Lines, Near DHQ Hospital, D.I. Khan",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    tehsil: "Dera",
    unionCouncil: "UC Civil-02",
    partyAffiliation: "DIR-OFFICE" as RecommenderAlias,
    referenceCode: "DIR-OFFICE",
    appliedRole: "Reception" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/021",
    joiningOrderNo: "DHQ-MS/JOIN/2026/021",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2017, grade: "A+" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2019, group: "ICS", grade: "A" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-08",
    registeredAt: "2026-10-19T09:15:00Z",
    notes: "Main Emergency & Outpatient Receptionist. Director Direct Order."
  },
  {
    id: "dhq-cand-09",
    fullName: "Asim Mehmood Marwat",
    fatherName: "Tariq Mehmood Marwat",
    cnic: "12101-8392104-5",
    fatherCnic: "12101-6382917-9",
    dob: "1998-02-28",
    gender: "Male" as const,
    phone: "0346-8192736",
    email: "asim.operator@dhq.hospital.pk",
    address: "Colony Road Paharpur, Tehsil Paharpur",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    tehsil: "Paharpur",
    unionCouncil: "UC Paharpur-01",
    partyAffiliation: "REF-PA-02" as RecommenderAlias,
    referenceCode: "REF-PA-02",
    appliedRole: "Computer Operator" as RoleCategory,
    appointmentOrderNo: "DHQ-DIR/APPT/2026/022",
    joiningOrderNo: "DHQ-MS/JOIN/2026/022",
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2014, grade: "A" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2016, group: "ICS", grade: "A" },
    status: "Allocated" as const,
    allocatedRoleId: "dhq-alloc-09",
    registeredAt: "2026-10-19T11:00:00Z",
    notes: "Hospital Management Information System (HMIS) Operator."
  },
  {
    id: "dhq-cand-10",
    fullName: "Imran Khan Kundi",
    fatherName: "Saeed Khan Kundi",
    cnic: "12101-1928374-7",
    fatherCnic: "12101-5829103-1",
    dob: "1996-06-11",
    gender: "Male" as const,
    phone: "0303-9182736",
    email: "imran.kundi@dhq.hospital.pk",
    address: "Village Daraban, Tehsil Daraban",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-44",
    tehsil: "Daraban",
    unionCouncil: "UC Daraban-03",
    partyAffiliation: "REF-NZM-02" as RecommenderAlias,
    referenceCode: "REF-NZM-02",
    appliedRole: "Ward Boy" as RoleCategory,
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2013, grade: "B" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2015, group: "General", grade: "B" },
    status: "Verified" as const,
    registeredAt: "2026-10-20T08:45:00Z",
    notes: "Verified applicant for upcoming Ward Boy expansion pool."
  },
  {
    id: "dhq-cand-11",
    fullName: "Zubair Ahmad Qureshi",
    fatherName: "Muhammad Qureshi",
    cnic: "12101-6381920-3",
    fatherCnic: "12101-2918374-5",
    dob: "1999-10-14",
    gender: "Male" as const,
    phone: "0313-8273619",
    email: "zubair.qureshi@dhq.hospital.pk",
    address: "Mohallah Parova Kalan, Tehsil Parova",
    domicileDistrict: "Dera Ismail Khan",
    constituency: "NA-45",
    tehsil: "Parova",
    unionCouncil: "UC Parova-03",
    partyAffiliation: "MERIT-OPEN" as RecommenderAlias,
    referenceCode: "MERIT-OPEN",
    appliedRole: "Security Guard" as RoleCategory,
    photoUrl: "",
    matricDetails: { board: "BISE D.I. Khan", passingYear: 2016, grade: "B" },
    fscDetails: { board: "BISE D.I. Khan", passingYear: 2018, group: "Arts", grade: "C" },
    status: "Registered" as const,
    registeredAt: "2026-10-21T10:20:00Z",
    notes: "Applicant under review for night shift security deployment."
  }
];

const initialAllocations = [
  {
    id: "dhq-alloc-01",
    candidateId: "dhq-cand-01",
    candidateName: "Muhammad Kamran Baloch",
    candidateCnic: "12101-7391823-1",
    district: "Dera Ismail Khan",
    constituency: "NA-44",
    roleCategory: "Ward Boy" as RoleCategory,
    roleTitle: "Ward Boy - Trauma & Emergency Center",
    department: "Emergency Medicine Wing, DHQ Teaching Hospital D.I. Khan",
    partyAffiliation: "REF-NA-01" as RecommenderAlias,
    allocatedDate: "2026-10-15",
    tenureMonths: 36,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/014",
    joiningOrderNo: "DHQ-MS/JOIN/2026/014",
    salaryOrStipend: "BPS-04 (Govt. Health Pay Scale)",
    remarks: "Appointed upon directive scrutiny. Authorized recommender alias REF-NA-01."
  },
  {
    id: "dhq-alloc-02",
    candidateId: "dhq-cand-02",
    candidateName: "Abdul Rehman Gandapur",
    candidateCnic: "12101-8392019-3",
    district: "Dera Ismail Khan",
    constituency: "NA-45",
    roleCategory: "Helper Boy" as RoleCategory,
    roleTitle: "Helper Boy - Surgical ICU & Operation Theater",
    department: "Surgical Directorate, DHQ Hospital D.I. Khan",
    partyAffiliation: "REF-PA-01" as RecommenderAlias,
    allocatedDate: "2026-10-16",
    tenureMonths: 36,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/015",
    joiningOrderNo: "DHQ-MS/JOIN/2026/015",
    salaryOrStipend: "BPS-03 (Govt. Health Pay Scale)",
    remarks: "Tehsil Kulachi quota allocation. Authorized recommender alias REF-PA-01."
  },
  {
    id: "dhq-alloc-03",
    candidateId: "dhq-cand-03",
    candidateName: "Jahangir Tariq Marwat",
    candidateCnic: "12101-4729184-5",
    district: "Dera Ismail Khan",
    constituency: "NA-44",
    roleCategory: "Stretcher Puller" as RoleCategory,
    roleTitle: "Stretcher Puller - Ambulance Reception Cell",
    department: "Casualty & Emergency Response, DHQ Hospital",
    partyAffiliation: "DIR-OFFICE" as RecommenderAlias,
    allocatedDate: "2026-10-16",
    tenureMonths: 24,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/016",
    joiningOrderNo: "DHQ-MS/JOIN/2026/016",
    salaryOrStipend: "BPS-02 (Govt. Health Pay Scale)",
    remarks: "Executive Directorate Direct Order. Priority rapid patient transport."
  },
  {
    id: "dhq-alloc-04",
    candidateId: "dhq-cand-04",
    candidateName: "Niamatullah Kundi",
    candidateCnic: "12101-9182736-7",
    district: "Dera Ismail Khan",
    constituency: "NA-44",
    roleCategory: "Security Guard" as RoleCategory,
    roleTitle: "Security Guard - Main Gate & ICU Perimeter",
    department: "Security & Surveillance Unit, DHQ Hospital D.I. Khan",
    partyAffiliation: "REF-NZM-01" as RecommenderAlias,
    allocatedDate: "2026-10-17",
    tenureMonths: 36,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/017",
    joiningOrderNo: "DHQ-MS/JOIN/2026/017",
    salaryOrStipend: "BPS-04 (Govt. Health Pay Scale)",
    remarks: "Tehsil Paharpur domicile verified. Authorized code REF-NZM-01."
  },
  {
    id: "dhq-alloc-05",
    candidateId: "dhq-cand-05",
    candidateName: "Muhammad Rizwan Alizai",
    candidateCnic: "12101-3829104-9",
    district: "Dera Ismail Khan",
    constituency: "NA-45",
    roleCategory: "Male Ward Attendant" as RoleCategory,
    roleTitle: "Male Ward Attendant - Orthopedic Wing",
    department: "Orthopedic & Trauma Surgery, DHQ Hospital",
    partyAffiliation: "REF-DIST-01" as RecommenderAlias,
    allocatedDate: "2026-10-17",
    tenureMonths: 36,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/018",
    joiningOrderNo: "DHQ-MS/JOIN/2026/018",
    salaryOrStipend: "BPS-04 (Govt. Health Pay Scale)",
    remarks: "Tehsil Parova domicile verified. Authorized code REF-DIST-01."
  },
  {
    id: "dhq-alloc-06",
    candidateId: "dhq-cand-06",
    candidateName: "Farzana Bibi Khattak",
    candidateCnic: "12101-5291837-2",
    district: "Dera Ismail Khan",
    constituency: "NA-44",
    roleCategory: "Female Ward Attendant" as RoleCategory,
    roleTitle: "Female Ward Attendant - Gynae & Obstetrics",
    department: "Women Health & Maternity Care, DHQ Hospital",
    partyAffiliation: "REF-NA-02" as RecommenderAlias,
    allocatedDate: "2026-10-18",
    tenureMonths: 36,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/019",
    joiningOrderNo: "DHQ-MS/JOIN/2026/019",
    salaryOrStipend: "BPS-04 (Govt. Health Pay Scale)",
    remarks: "Maternity block day shift. Authorized recommendation code REF-NA-02."
  },
  {
    id: "dhq-alloc-07",
    candidateId: "dhq-cand-07",
    candidateName: "Shahid Iqbal Gandapur",
    candidateCnic: "12101-6382910-1",
    district: "Dera Ismail Khan",
    constituency: "NA-45",
    roleCategory: "Junior Clerk" as RoleCategory,
    roleTitle: "Junior Clerk - HR & Recruitment Section",
    department: "Human Resource & Personnel Directorate, DHQ Hospital",
    partyAffiliation: "MERIT-OPEN" as RecommenderAlias,
    allocatedDate: "2026-10-18",
    tenureMonths: 48,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/020",
    joiningOrderNo: "DHQ-MS/JOIN/2026/020",
    salaryOrStipend: "BPS-11 (Govt. Health Pay Scale)",
    remarks: "Open merit appointment. Responsible for staff file archives."
  },
  {
    id: "dhq-alloc-08",
    candidateId: "dhq-cand-08",
    candidateName: "Ayesha Noor Baloch",
    candidateCnic: "12101-7291834-4",
    district: "Dera Ismail Khan",
    constituency: "NA-44",
    roleCategory: "Reception" as RoleCategory,
    roleTitle: "Receptionist / Information Desk Officer",
    department: "Outpatient Department (OPD) Central Hall, DHQ Hospital",
    partyAffiliation: "DIR-OFFICE" as RecommenderAlias,
    allocatedDate: "2026-10-19",
    tenureMonths: 36,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/021",
    joiningOrderNo: "DHQ-MS/JOIN/2026/021",
    salaryOrStipend: "BPS-09 (Govt. Health Pay Scale)",
    remarks: "Director office directive for OPD inquiry & patient token management."
  },
  {
    id: "dhq-alloc-09",
    candidateId: "dhq-cand-09",
    candidateName: "Asim Mehmood Marwat",
    candidateCnic: "12101-8392104-5",
    district: "Dera Ismail Khan",
    constituency: "NA-44",
    roleCategory: "Computer Operator" as RoleCategory,
    roleTitle: "Computer Operator - Electronic Medical Records Cell",
    department: "Information Technology Cell, DHQ Hospital D.I. Khan",
    partyAffiliation: "REF-PA-02" as RecommenderAlias,
    allocatedDate: "2026-10-19",
    tenureMonths: 48,
    status: "Active" as const,
    allocatedBy: "Hospital Director (Prof. Dr. Tariq Jamil Chishti)",
    appointmentRefNo: "DHQ-DIR/APPT/2026/022",
    joiningOrderNo: "DHQ-MS/JOIN/2026/022",
    salaryOrStipend: "BPS-16 (Govt. Health Pay Scale)",
    remarks: "Hospital Database & Single-Click Export Maintenance. Recommender: REF-PA-02."
  }
];

const initialMessages: ChatMessage[] = [
  {
    id: "dhq-msg-01",
    senderName: "Prof. Dr. Tariq Jamil Chishti",
    senderRole: "Hospital Director",
    senderDepartment: "Directorate Office, DHQ Teaching Hospital D.I. Khan",
    district: "Dera Ismail Khan",
    subject: "Directive: Strict Verification of Tehsil Quota Records",
    message: "All DHQ staff appointments across Daraban, Kulachi, Paharpur, Dera, and Parova must have verified CNIC details and authorized short-code documentation before joining order release.",
    priority: "Urgent",
    timestamp: "2026-10-24T10:00:00Z",
    unread: false
  },
  {
    id: "dhq-msg-02",
    senderName: "Dr. Sajjad Ahmad Qureshi",
    senderRole: "Medical Superintendent",
    senderDepartment: "MS Wing, DHQ Hospital D.I. Khan",
    district: "Dera Ismail Khan",
    subject: "Official Notice: Ward Boys & Attendants Night Duty Roster",
    message: "Male and Female Ward Attendants appointed in Emergency and Trauma centers must report for orientation tomorrow at 08:30 AM in the Conference Hall.",
    priority: "Official Notice",
    timestamp: "2026-10-24T12:30:00Z",
    unread: false
  },
  {
    id: "dhq-msg-03",
    senderName: "Farhan Ali Gandapur",
    senderRole: "Computer Operator",
    senderDepartment: "IT & Record Cell, DHQ Hospital",
    district: "Dera Ismail Khan",
    subject: "Routine: Single-Click Word Document Export Activated",
    message: "The Single-Click Export module is synchronized with all active DHQ staff categories. Directors can download formatted staff rosters directly from the dashboard.",
    priority: "Routine",
    timestamp: "2026-10-24T15:00:00Z",
    unread: true
  },
  {
    id: "dhq-msg-04",
    senderName: "Muhammad Aslam Baloch",
    senderRole: "Junior Clerk",
    senderDepartment: "Recruitment Branch, DHQ Hospital",
    district: "Dera Ismail Khan",
    subject: "Inquiry: Stretcher Puller and Security Guard Quotas",
    message: "Additional applicant dossiers received from Parova and Daraban tehsils. Forwarding to the Hospital Director for official scrutiny.",
    priority: "Inquiry",
    timestamp: "2026-10-24T16:45:00Z",
    unread: true
  },
  {
    id: "dhq-msg-05",
    senderName: "Dr. Muhammad Tariq Khan",
    senderRole: "Executive Director",
    senderDepartment: "Administration Wing, DHQ Hospital",
    district: "Dera Ismail Khan",
    subject: "Official Notice: Complete Confidentiality of Recommendation Codes",
    message: "Reminder to all personnel: Never write political names directly in files or database. Strictly adhere to authorized reference short codes (e.g. REF-NA-01, REF-PA-01).",
    priority: "Official Notice",
    timestamp: "2026-10-24T18:00:00Z",
    unread: true
  }
];

export async function seedDatabase() {
  const now = new Date().toISOString();
  const db = getDb();

  console.log("Cleaning existing messages, allocations, candidate images, and candidates...");
  await db.delete(schema.candidateImages);
  await db.delete(schema.messages);
  await db.delete(schema.allocations);
  await db.delete(schema.candidates);
  await db.delete(schema.districts);

  console.log("Seeding DHQ Hospital users...");
  await db.delete(schema.users);
  const userRows = Object.entries(ROLE_PRESETS).map(([key, preset]) => ({
    id: `user-${key}`,
    username: key,
    email: `${key}@dhq.hospital.pk`,
    passwordHash: hashPassword(key),
    roleKey: key,
    roleCategory: "Admin",
    name: preset.name,
    title: preset.title,
    department: preset.department,
    district: preset.defaultDistrict,
    constituency: preset.constituency ?? "NA-44",
    avatar: preset.avatar,
    badgeColor: preset.badgeColor,
    permissions: preset.permissions,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  for (const user of userRows) {
    await db.insert(schema.users).values(user).onDuplicateKeyUpdate({
      set: {
        name: user.name,
        title: user.title,
        department: user.department,
        district: user.district,
        badgeColor: user.badgeColor,
        updatedAt: now,
      }
    });
  }

  console.log("Seeding D.I. Khan districts...");
  for (const d of initialDistricts) {
    await db.insert(schema.districts).values({
      id: d.id,
      name: d.name,
      province: d.province,
      constituencies: d.constituencies,
      totalQuota: d.totalQuota,
      allocatedCount: d.allocatedCount,
      createdAt: now,
      updatedAt: now,
    }).onDuplicateKeyUpdate({
      set: {
        totalQuota: d.totalQuota,
        allocatedCount: d.allocatedCount,
        updatedAt: now,
      }
    });
  }

  console.log("Seeding DHQ Hospital candidates...");
  for (const c of initialCandidates) {
    const cnicDigits = c.cnic.replace(/[^0-9]/g, "");
    await db.insert(schema.candidates).values({
      id: c.id,
      fullName: c.fullName,
      fatherName: c.fatherName,
      cnic: c.cnic,
      cnicDigits,
      fatherCnic: c.fatherCnic,
      dob: c.dob,
      gender: c.gender,
      phone: c.phone,
      email: c.email,
      address: c.address,
      domicileDistrict: c.domicileDistrict,
      constituency: c.constituency,
      tehsil: c.tehsil,
      unionCouncil: c.unionCouncil,
      partyAffiliation: c.partyAffiliation,
      referenceCode: c.referenceCode,
      appliedRole: c.appliedRole,
      appointmentOrderNo: c.appointmentOrderNo,
      joiningOrderNo: c.joiningOrderNo,
      cnicFrontUrl: null,
      cnicBackUrl: null,
      photoUrl: `/api/candidates/${c.id}/photo`,
      matricDetails: c.matricDetails,
      fscDetails: c.fscDetails,
      higherEducation: [],
      status: c.status,
      allocatedRoleId: c.allocatedRoleId,
      registeredAt: c.registeredAt,
      notes: c.notes,
      passwordHash: hashPassword("hospital123"),
      createdAt: now,
      updatedAt: now,
    }).onDuplicateKeyUpdate({
      set: {
        fullName: c.fullName,
        fatherName: c.fatherName,
        fatherCnic: c.fatherCnic,
        appliedRole: c.appliedRole,
        appointmentOrderNo: c.appointmentOrderNo,
        joiningOrderNo: c.joiningOrderNo,
        referenceCode: c.referenceCode,
        partyAffiliation: c.partyAffiliation,
        tehsil: c.tehsil,
        unionCouncil: c.unionCouncil,
        status: c.status,
        allocatedRoleId: c.allocatedRoleId,
        updatedAt: now,
      }
    });
  }

  console.log("Seeding DHQ Hospital allocations (appointment & joining orders)...");
  for (const a of initialAllocations) {
    await db.insert(schema.allocations).values({
      id: a.id,
      candidateId: a.candidateId,
      candidateName: a.candidateName,
      candidateCnic: a.candidateCnic,
      district: a.district,
      constituency: a.constituency,
      roleCategory: a.roleCategory,
      roleTitle: a.roleTitle,
      department: a.department,
      partyAffiliation: a.partyAffiliation,
      allocatedDate: a.allocatedDate,
      tenureMonths: a.tenureMonths,
      status: a.status,
      allocatedBy: a.allocatedBy,
      appointmentRefNo: a.appointmentRefNo,
      joiningOrderNo: a.joiningOrderNo,
      salaryOrStipend: a.salaryOrStipend,
      remarks: a.remarks,
      createdAt: now,
      updatedAt: now,
    }).onDuplicateKeyUpdate({
      set: {
        candidateName: a.candidateName,
        roleCategory: a.roleCategory,
        roleTitle: a.roleTitle,
        department: a.department,
        appointmentRefNo: a.appointmentRefNo,
        joiningOrderNo: a.joiningOrderNo,
        status: a.status,
        updatedAt: now,
      }
    });
  }

  console.log("Seeding DHQ Hospital internal chat notices & memos...");
  for (const m of initialMessages) {
    await db.insert(schema.messages).values({
      id: m.id,
      senderName: m.senderName,
      senderRole: m.senderRole,
      senderDepartment: m.senderDepartment,
      district: m.district,
      subject: m.subject,
      message: m.message,
      priority: m.priority,
      timestamp: m.timestamp,
      unread: m.unread,
      createdAt: now,
      updatedAt: now,
    }).onDuplicateKeyUpdate({
      set: {
        subject: m.subject,
        message: m.message,
        priority: m.priority,
        updatedAt: now,
      }
    });
  }

  console.log("Syncing district allocated counts from real allocations...");
  const activePerDistrict = await db
    .select({
      district: schema.allocations.district,
      total: sql<number>`COUNT(*)`,
    })
    .from(schema.allocations)
    .where(eq(schema.allocations.status, "Active"))
    .groupBy(schema.allocations.district);
  for (const row of activePerDistrict) {
    await db
      .update(schema.districts)
      .set({ allocatedCount: Number(row.total), updatedAt: now })
      .where(eq(schema.districts.name, row.district));
  }

  console.log("DHQ Hospital staff data seed completed successfully!");
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  seedDatabase()
    .then(() => {
      console.log("Database seeded successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}
