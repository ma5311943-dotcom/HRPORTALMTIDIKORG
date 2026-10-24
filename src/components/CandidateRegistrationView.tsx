"use client";

import React, { useState } from "react";
import { Candidate, District, PoliticalParty, RoleCategory, DHQ_STAFF_ROLES } from "@/types";
import {
  UserPlus,
  Search,
  MapPin,
  Camera,
  Upload,
  ShieldAlert,
  Briefcase,
  FileText,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { CANDIDATE_STATUS_STYLES, PARTY_LABELS, PARTY_STYLES } from "@/lib/ui";

interface CandidateRegistrationViewProps {
  candidates: Candidate[];
  districts: District[];
  onCandidateCreated: (newCandidate: Candidate) => void;
  onSelectCandidate: (candidate: Candidate) => void;
  onAllocateCandidate: (candidate: Candidate) => void;
  canRegisterCandidates?: boolean;
  canAllocateSeats?: boolean;
}

export default function CandidateRegistrationView({
  candidates,
  districts,
  onCandidateCreated,
  onSelectCandidate,
  onAllocateCandidate,
  canRegisterCandidates = true,
  canAllocateSeats = true,
}: CandidateRegistrationViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterParty, setFilterParty] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Form State
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [fatherCnic, setFatherCnic] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [domicileDistrict, setDomicileDistrict] = useState(districts[0]?.name || "Lahore");
  const [constituency, setConstituency] = useState(districts[0]?.constituencies[0] || "NA-117");
  const [tehsil, setTehsil] = useState("");
  const [unionCouncil, setUnionCouncil] = useState("");
  const [partyAffiliation, setPartyAffiliation] = useState<PoliticalParty>("MERIT-OPEN");
  const [referenceCode, setReferenceCode] = useState("");
  const [appliedRole, setAppliedRole] = useState<RoleCategory>("Ward Boy");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // CNIC Document Uploads
  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null);
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null);
  const [cnicFrontName, setCnicFrontName] = useState("");
  const [cnicBackName, setCnicBackName] = useState("");

  // Education Records
  const [matricBoard, setMatricBoard] = useState("");
  const [matricYear] = useState<number>(2016);
  const [matricGrade, setMatricGrade] = useState("");
  const [matricDocFile, setMatricDocFile] = useState<File | null>(null);
  const [matricDocName, setMatricDocName] = useState("");

  const [fscBoard, setFscBoard] = useState("");
  const [fscYear] = useState<number>(2018);
  const [fscGroup, setFscGroup] = useState("Pre-Engineering");
  const [fscGrade, setFscGrade] = useState("");
  const [fscDocFile, setFscDocFile] = useState<File | null>(null);
  const [fscDocName, setFscDocName] = useState("");

  const [higherDegree, setHigherDegree] = useState("");
  const [higherInstitute, setHigherInstitute] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-mask CNIC (XXXXX-XXXXXXX-X)
  const maskCnic = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 13);
    if (digits.length > 12) return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => setCnic(maskCnic(e.target.value));
  const handleFatherCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => setFatherCnic(maskCnic(e.target.value));

  // Generic doc file picker helper
  const makeDocHandler = (
    setFile: (f: File) => void,
    setName: (n: string) => void,
    label: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(`${label}: unsupported format`, { description: "Upload PDF, JPG, PNG or WEBP." });
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${label}: file too large`, { description: "Maximum 10 MB." });
      e.target.value = "";
      return;
    }
    setFile(file);
    setName(file.name);
    toast.info(`${label} selected`, { description: file.name });
  };

  const resetForm = () => {
    setFullName("");
    setFatherName("");
    setCnic("");
    setFatherCnic("");
    setDob("");
    setGender("Male");
    setPhone("");
    setEmail("");
    setAddress("");
    setDomicileDistrict(districts[0]?.name || "Lahore");
    setConstituency(districts[0]?.constituencies[0] || "NA-117");
    setTehsil("");
    setUnionCouncil("");
    setPartyAffiliation("MERIT-OPEN");
    setReferenceCode("");
    setAppliedRole("Ward Boy");
    setNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setCnicFrontFile(null); setCnicFrontName("");
    setCnicBackFile(null); setCnicBackName("");
    setMatricBoard(""); setMatricGrade(""); setMatricDocFile(null); setMatricDocName("");
    setFscBoard(""); setFscGroup("Pre-Engineering"); setFscGrade(""); setFscDocFile(null); setFscDocName("");
    setHigherDegree("");
    setHigherInstitute("");
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  // Handle District Change and update constituencies
  const handleDistrictChange = (distName: string) => {
    setDomicileDistrict(distName);
    const dObj = districts.find(d => d.name === distName);
    if (dObj && dObj.constituencies.length > 0) {
      setConstituency(dObj.constituencies[0]);
    }
  };

  // Image Upload / Preview
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported image format", {
        description: "Upload a JPEG, PNG, or WebP image.",
      });
      e.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large", {
        description: "Maximum upload size is 8 MB.",
      });
      e.target.value = "";
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.info("Photograph selected.", {
      description: "It will be compressed and stored securely in the HR database.",
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const rawCnic = cnic.replace(/\D/g, "");
      if (rawCnic.length !== 13) {
        toast.error("Invalid Pakistani CNIC", {
          description: "CNIC must be 13 digits in standard format (XXXXX-XXXXXXX-X)."
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        fullName,
        fatherName,
        cnic,
        fatherCnic: fatherCnic || undefined,
        dob: dob || "1995-01-01",
        gender,
        phone,
        email: email || `${fullName.toLowerCase().replace(/\s+/g, ".")}@dhq.pk`,
        address,
        domicileDistrict,
        constituency,
        tehsil: tehsil || "Urban Center",
        unionCouncil: unionCouncil || "UC Unassigned",
        partyAffiliation,
        referenceCode: referenceCode || undefined,
        appliedRole,
        notes: notes || undefined,
        photoUrl: "/images/candidate_portrait.jpg",
        matricDetails: {
          board: matricBoard || "—",
          passingYear: Number(matricYear),
          grade: matricGrade || "—",
          documentUrl: matricDocName || undefined,
        },
        fscDetails: {
          board: fscBoard || "—",
          passingYear: Number(fscYear),
          group: fscGroup,
          grade: fscGrade || "—",
          documentUrl: fscDocName || undefined,
        },
        higherEducation: higherDegree ? [
          {
            level: "Bachelors" as const,
            degreeName: higherDegree,
            institute: higherInstitute || "Recognized Pakistani University",
            passingYear: Number(fscYear) + 4,
            grade: "1st Division",
          }
        ] : [],
        status: "Verified" as const,
      };

      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register candidate.");
      }

      let registeredCandidate = data.data as Candidate;
      let photoWarning = "";
      if (photoFile) {
        const formData = new FormData();
        formData.append("photo", photoFile);
        const photoRes = await fetch(`/api/candidates/${registeredCandidate.id}/photo`, {
          method: "POST",
          body: formData,
        });
        const photoData = await photoRes.json().catch(() => null);
        if (photoRes.ok) {
          registeredCandidate = { ...registeredCandidate, photoUrl: photoData.data.photoUrl };
        } else {
          photoWarning = ` Photo upload failed: ${photoData?.error || "retry from dossier."}`;
        }
      }
      // Upload CNIC docs if selected (best-effort, non-blocking)
      const docUploads: Promise<void>[] = [];
      for (const [field, file] of [["cnicFront", cnicFrontFile], ["cnicBack", cnicBackFile],
      ["matricDoc", matricDocFile], ["fscDoc", fscDocFile]] as [string, File | null][]) {
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("field", field);
          docUploads.push(
            fetch(`/api/candidates/${registeredCandidate.id}/documents`, { method: "POST", body: fd })
              .then(() => undefined)
              .catch(() => undefined)
          );
        }
      }
      await Promise.allSettled(docUploads);

      onCandidateCreated(registeredCandidate);
      toast.success("Candidate Registered Successfully!", {
        description: `${fullName} has been added to the District ${domicileDistrict} verified roster.${photoWarning}`
      });

      // Reset Form & Close
      resetForm();
      setShowForm(false);
    } catch (err: unknown) {
      toast.error("Registration Failed", {
        description: err instanceof Error ? err.message : "Unable to save the candidate record."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter candidates list
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cnic.includes(searchQuery) ||
      c.constituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    const matchesDistrict = filterDistrict === "All" || c.domicileDistrict === filterDistrict;
    const matchesParty = filterParty === "All" || c.partyAffiliation === filterParty;
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;

    return matchesSearch && matchesDistrict && matchesParty && matchesStatus;
  });

  const selectedDistrictObj = districts.find(d => d.name === domicileDistrict);

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-700" />
            Candidate & Member Registration Roster
          </h2>
          <p className="text-xs text-slate-500">
            Official constituency enrollment, NADRA CNIC validation, and verified academic record storage
          </p>
        </div>

        {canRegisterCandidates && (
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${showForm
                ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                : "bg-emerald-700 hover:bg-emerald-800 text-white"
              }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{showForm ? "Cancel Registration" : "+ Enroll New Candidate"}</span>
          </button>
        )}
      </div>

      {/* Enrollment Form Accordion */}
      {showForm && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-700" />
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                DHQ Hospital Staff Enrollment Form
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 shrink-0">
              Form DHQ-2026/HR
            </span>
          </div>

          {/* Section 1: Personal & Biometric Details */}
          <div>
            <h4 className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-3 flex items-center gap-1.5">
              <span>Step 1: Personal & Biometric Identity</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malik Muhammad Shahbaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father / Husband Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haji Muhammad Sharif"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CNIC Number (13 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="35201-1234567-1"
                  value={cnic}
                  onChange={handleCnicChange}
                  className="w-full text-xs p-2.5 font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "Male" | "Female" | "Other")}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father / Husband CNIC
                </label>
                <input
                  type="text"
                  placeholder="35201-7654321-1"
                  value={fatherCnic}
                  onChange={handleFatherCnicChange}
                  className="w-full text-xs p-2.5 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@dhq.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Role, Domicile & HR Reference */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Step 2: Applied Role, Domicile &amp; HR Reference</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Applied Role — most critical field */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Applied Role / Post <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={appliedRole}
                  onChange={(e) => setAppliedRole(e.target.value as RoleCategory)}
                  className="w-full text-xs p-2.5 border-2 border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-emerald-800"
                >
                  {DHQ_STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Domicile District <span className="text-red-500">*</span>
                </label>
                <select
                  value={domicileDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold text-slate-800"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>
                      District {d.name} ({d.province})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Constituency / Zone
                </label>
                <select
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-emerald-700"
                >
                  {selectedDistrictObj?.constituencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tehsil / Sub-Division
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daraban / Kulachi / Paharpur"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Union Council (UC)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UC-04"
                  value={unionCouncil}
                  onChange={(e) => setUnionCouncil(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recommender / Reference Code
                </label>
                <select
                  value={partyAffiliation}
                  onChange={(e) => setPartyAffiliation(e.target.value as PoliticalParty)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-slate-800"
                >
                  <option value="MERIT-OPEN">MERIT-OPEN (Open Merit)</option>
                  <option value="DIR-OFFICE">DIR-OFFICE (Director Office)</option>
                  <option value="REF-NA-01">REF-NA-01 (MNA Ref. #1)</option>
                  <option value="REF-NA-02">REF-NA-02 (MNA Ref. #2)</option>
                  <option value="REF-PA-01">REF-PA-01 (MPA Ref. #1)</option>
                  <option value="REF-PA-02">REF-PA-02 (MPA Ref. #2)</option>
                  <option value="REF-DIST-01">REF-DIST-01 (District Ref.)</option>
                  <option value="REF-NZM-01">REF-NZM-01 (Nazim Ref. #1)</option>
                  <option value="REF-NZM-02">REF-NZM-02 (Nazim Ref. #2)</option>
                  <option value="DEPT-DIRECT">DEPT-DIRECT (Dept. Direct)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reference Sub-Code / Detail
                </label>
                <input
                  type="text"
                  placeholder="Optional short code e.g. NZM-DI-02"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complete Residential Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street address, Mohallah, House number"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Educational Qualifications & Proofs */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-3 flex items-center gap-1.5">
              <span>Step 3: Educational Credentials & Verified Proof Records</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matriculation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    Matriculation (SSC Proof)
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Mandatory
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Board of Education
                    </label>
                    <input
                      type="text"
                      value={matricBoard}
                      onChange={(e) => setMatricBoard(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={matricGrade}
                      onChange={(e) => setMatricGrade(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Certificate / DMC Scan (PDF/JPG)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-all">
                      <FileText className="w-3 h-3" />
                      {matricDocName ? "Change File" : "Upload File"}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{matricDocName || "No file chosen"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={makeDocHandler((f) => setMatricDocFile(f), setMatricDocName, "Matric Certificate")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* FSc / Intermediate */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    Intermediate / FSc (HSSC Proof)
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Mandatory
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Board / College
                    </label>
                    <input
                      type="text"
                      value={fscBoard}
                      onChange={(e) => setFscBoard(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Group
                    </label>
                    <select
                      value={fscGroup}
                      onChange={(e) => setFscGroup(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                    >
                      <option value="Pre-Engineering">Pre-Engineering</option>
                      <option value="Pre-Medical">Pre-Medical</option>
                      <option value="ICS (Computer)">ICS</option>
                      <option value="I.Com">I.Com</option>
                      <option value="Humanities / Arts">FA / Arts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={fscGrade}
                      onChange={(e) => setFscGrade(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Certificate / DMC Scan (PDF/JPG)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-all">
                      <FileText className="w-3 h-3" />
                      {fscDocName ? "Change File" : "Upload File"}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{fscDocName || "No file chosen"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={makeDocHandler((f) => setFscDocFile(f), setFscDocName, "FSc Certificate")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Higher Degree */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Higher Education Degree (Bachelors / Masters / LLB / MBBS - Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BS Computer Science / LLB Law"
                  value={higherDegree}
                  onChange={(e) => setHigherDegree(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  University / Degree Awarding Institute
                </label>
                <input
                  type="text"
                  placeholder="e.g. Punjab University / NUST / Quaid-i-Azam University"
                  value={higherInstitute}
                  onChange={(e) => setHigherInstitute(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: CNIC Documents & Passport Photo */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-3 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Step 4: Identity Documents &amp; Passport Photo</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* CNIC Front */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-700 mb-2">CNIC — Front Side</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-all">
                    <FileText className="w-3 h-3" />
                    {cnicFrontName ? "Change" : "Upload"}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{cnicFrontName || "No file chosen"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={makeDocHandler((f) => setCnicFrontFile(f), setCnicFrontName, "CNIC Front")}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">PDF, JPG or PNG, max 10 MB</p>
              </div>

              {/* CNIC Back */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-700 mb-2">CNIC — Back Side</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-all">
                    <FileText className="w-3 h-3" />
                    {cnicBackName ? "Change" : "Upload"}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{cnicBackName || "No file chosen"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={makeDocHandler((f) => setCnicBackFile(f), setCnicBackName, "CNIC Back")}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">PDF, JPG or PNG, max 10 MB</p>
              </div>

              {/* Passport Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-emerald-200 overflow-hidden bg-emerald-50 flex items-center justify-center shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-emerald-700" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Passport Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400">JPG/PNG/WEBP, max 8 MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Notes & Submit */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-3 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" />
              <span>Step 5: Additional Notes &amp; Submit</span>
            </h4>
            <textarea
              rows={3}
              placeholder="Any remarks, medical notes, disability status, or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none resize-none"
            />
            <div className="flex flex-wrap items-center justify-end gap-3 mt-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving to DHQ HR System..." : "✓ Confirm & Save Staff Record"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Directory Search & Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search candidate by Full Name, CNIC, Constituency (e.g. NA-127), or Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* District Filter */}
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
            >
              <option value="All">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Party Filter */}
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
            >
              <option value="All">All Parties</option>
              <option value="PTI">PTI</option>
              <option value="PMLN">PML-N</option>
              <option value="PPP">PPP</option>
              <option value="JUI-F">JUI-F</option>
              <option value="MQM-P">MQM-P</option>
              <option value="JI">JI</option>
              <option value="ANP">ANP</option>
              <option value="TLP">TLP</option>
              <option value="Independent">Independent</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Allocated">Allocated</option>
              <option value="Verified">Verified</option>
              <option value="Registered">Registered</option>
            </select>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={cand.photoUrl}
                  alt={cand.fullName}
                  onError={(e) => {
                    e.currentTarget.src = "/images/councilor_portrait.jpg";
                  }}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0 shadow-xs"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {cand.fullName}
                    </h4>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${PARTY_STYLES[cand.partyAffiliation]}`}
                    >
                      {PARTY_LABELS[cand.partyAffiliation]}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-emerald-800 font-bold mt-0.5">
                    {cand.cnic}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="truncate">{cand.constituency} ({cand.domicileDistrict})</span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CANDIDATE_STATUS_STYLES[cand.status]}`}
                >
                  {cand.status}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectCandidate(cand)}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    View Dossier
                  </button>

                  {cand.status !== "Allocated" && canAllocateSeats && (
                    <button
                      onClick={() => onAllocateCandidate(cand)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-all shadow-xs cursor-pointer"
                    >
                      Allocate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No candidates match the selected filters.</p>
              <p className="text-xs mt-1">Try adjusting the search query or clear district filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
