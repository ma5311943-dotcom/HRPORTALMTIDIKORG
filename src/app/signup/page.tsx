"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  GraduationCap, 
  Lock, 
  Fingerprint, 
  Sparkles,
  FileCheck2,
  UserPlus,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { EducationRecord } from "@/types";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

interface RegisteredCandidateSummary {
  id: string;
  fullName: string;
  cnic: string;
  domicileDistrict: string;
  constituency: string;
  status: string;
}

export default function SignupPage() {
  // Form State
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [dob, setDob] = useState("2000-01-01");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [domicileDistrict, setDomicileDistrict] = useState("Dera Ismail Khan");
  const [constituency, setConstituency] = useState("NA-44");
  const [tehsil, setTehsil] = useState("Dera");
  const [address, setAddress] = useState("");
  const [highestEducation, setHighestEducation] = useState<EducationRecord["level"]>("Bachelors");
  const [degreeName, setDegreeName] = useState("BS Information Technology");
  const [quotaStream, setQuotaStream] = useState("Merit Quota");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const partyAffiliation = "Independent";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredSuccessData, setRegisteredSuccessData] = useState<RegisteredCandidateSummary | null>(null);

  // Auto-format CNIC with dashes (XXXXX-XXXXXXX-X)
  const handleCnicChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, "");
    if (raw.length <= 5) {
      setCnic(raw);
    } else if (raw.length <= 12) {
      setCnic(`${raw.slice(0, 5)}-${raw.slice(5)}`);
    } else {
      setCnic(`${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12, 13)}`);
    }
  };

  // District options with matching default constituencies
  const DISTRICT_CONSTITUENCIES: Record<string, { na: string; tehsil: string }> = {
    "Dera Ismail Khan": { na: "NA-44", tehsil: "Dera" },
  };

  const handleDistrictChange = (dist: string) => {
    setDomicileDistrict(dist);
    const def = DISTRICT_CONSTITUENCIES[dist];
    if (def) {
      setConstituency(def.na);
      setTehsil(def.tehsil);
    }
  };

  const handleQuickSampleAutoFill = () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setFullName("Muhammad Kamran Gandapur");
    setFatherName("Noor Muhammad Khan");
    setCnic(`12101-839${randNum}-1`);
    setPhone("0300-9281726");
    setEmail(`kamran.gandapur${randNum}@gmail.com`);
    setAddress("Mohallah Khakwani, Tehsil Kulachi, D.I. Khan");
    setDomicileDistrict("Dera Ismail Khan");
    setConstituency("NA-44");
    setTehsil("Kulachi");
    setHighestEducation("FSc / Intermediate");
    setDegreeName("FSc Pre-Medical - BISE D.I. Khan");
    setPassword("Pakistan2026!");
    toast.info("Sample candidate profile auto-filled!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCnicDigits = cnic.replace(/[^0-9]/g, "");
    if (cleanCnicDigits.length !== 13) {
      setErrorMsg("CNIC must contain exactly 13 digits in standard format (e.g. 35201-1849204-1).");
      return;
    }

    if (!fullName || !phone || !domicileDistrict || !constituency) {
      setErrorMsg("Please complete all mandatory marked fields.");
      return;
    }

    if (password && password.length < 8) {
      setErrorMsg("Portal password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter your portal password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName,
        fatherName: fatherName || "Not Specified",
        cnic,
        dob,
        gender,
        phone,
        email: email || `${cleanCnicDigits}@candidates.internalhr.gov.pk`,
        address: address || `${tehsil}, ${domicileDistrict}`,
        domicileDistrict,
        constituency,
        tehsil,
        partyAffiliation,
        photoUrl: gender === "Female" ? "/images/candidate_female.jpg" : "/images/candidate_portrait.jpg",
        matricDetails: {
          board: "BISE Lahore",
          passingYear: 2018,
          grade: "A+",
        },
        fscDetails: {
          board: "BISE Lahore",
          passingYear: 2020,
          group: "Pre-Engineering",
          grade: "A",
        },
        higherEducation: [
          {
            level: highestEducation,
            degreeName,
            institute: "Recognized Pakistani HEC University",
            passingYear: 2024,
            grade: "3.7 CGPA",
          },
        ],
        status: "Registered",
        password: password || undefined,
        notes: `Enrolled via Public Candidate Registration Portal under ${quotaStream}. Portal password: ${password ? "configured securely" : "not set (CNIC digits fallback)"}.`,
      };

      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register candidate.");
      }

      // Success
      setRegisteredSuccessData(data.data);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#047857", "#c5a059", "#34d399", "#ffffff"],
      });

      toast.success("Enrolment Record Created Successfully!", {
        description: `Candidate ID: ${data.data.id} • CNIC: ${cnic}`,
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred during submission.";
      setErrorMsg(message);
      toast.error("Registration Failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f6] text-slate-900 font-sans selection:bg-emerald-700 selection:text-white">
      {/* 1. Header at Top */}
      <PublicHeader activePage="signup" />

      {/* 2. Middle Auth System Route Container */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-6">
        <div className="w-full max-w-xl mx-auto space-y-3.5">
          {/* Auth Segmented Switcher in Middle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <Link
              href="/signup"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-emerald-700 text-white shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-white/80" />
              <span>Candidate Enrolment</span>
            </Link>
            <Link
              href="/login?mode=candidate"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all hover:bg-white/60"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Portal Sign In (/login)</span>
            </Link>
          </div>

          {/* Success Card View or Compact Form */}
          {registeredSuccessData ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-white p-5 text-center border-b border-slate-200 border-t-4 border-t-emerald-600">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Enrolment Certificate
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-1.5">
                  Candidate Registry Verified
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                  Enrolled into the National Constituency Human Resource Ledger.
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                <div className="bg-emerald-50/80 rounded-xl p-3.5 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <span className="text-slate-600">Full Name:</span>
                    <strong className="text-slate-900 font-bold">{registeredSuccessData.fullName}</strong>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <span className="text-slate-600">National CNIC:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {registeredSuccessData.cnic}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <span className="text-slate-600">Constituency:</span>
                    <span className="font-semibold text-slate-800">
                      District {registeredSuccessData.domicileDistrict} ({registeredSuccessData.constituency})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {registeredSuccessData.status} (Eligible)
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-[11px] leading-relaxed text-emerald-900">
                  <span className="font-bold">Portal access is ready.</span> Sign in with your CNIC
                  and the password you just created{password ? "" : " (or the 13 CNIC digits if no password was set)"}.
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <Link
                    href="/login?mode=candidate"
                    className="w-full sm:flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3.5 rounded-xl font-bold text-xs shadow-md transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 text-white/80" />
                    <span>Sign In to Candidate Portal</span>
                  </Link>

                  <button
                    onClick={() => {
                      setRegisteredSuccessData(null);
                      setCnic("");
                      setFullName("");
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                  >
                    <span>Enrol Another</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Compact Responsive Form */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Sovereign Compact Header */}
              <div className="bg-white px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 border-t-4 border-t-emerald-600">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                      <img
                        src="/images/state_emblem.jpg"
                        alt="Pakistan State Emblem"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Govt of Pakistan
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">CHR-01</span>
                      </div>
                      <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                        Candidate & Citizen Registry
                      </h1>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickSampleAutoFill}
                    className="cursor-pointer flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all shadow-xs shrink-0"
                    title="Fill sample applicant data for fast testing"
                  >
                    <Sparkles className="w-3 h-3 text-white/80" />
                    <span>Auto-Fill</span>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
                {/* Section 1: Demographics */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-700" />
                    <span>1. Citizen Identity & Demographics</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Full Name (as per CNIC) *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Zeeshan Chishti"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Father / Guardian Name
                      </label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="e.g. Haider Ali Chishti"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          13-Digit CNIC *
                        </label>
                        <span className="text-[9px] text-emerald-800 font-mono">XXXXX-XXXXXXX-X</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={cnic}
                        maxLength={15}
                        onChange={(e) => handleCnicChange(e.target.value)}
                        placeholder="35201-1234567-1"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as "Male" | "Female" | "Other")}
                          className="w-full px-2 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Domicile & Parliamentary Constituency */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>2. Domicile & Constituency</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        District *
                      </label>
                      <select
                        value={domicileDistrict}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {Object.keys(DISTRICT_CONSTITUENCIES).map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Constituency *
                      </label>
                      <input
                        type="text"
                        required
                        value={constituency}
                        onChange={(e) => setConstituency(e.target.value)}
                        placeholder="NA-127"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Tehsil
                      </label>
                      <input
                        type="text"
                        value={tehsil}
                        onChange={(e) => setTehsil(e.target.value)}
                        placeholder="Model Town"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Permanent Street / Mohallah / House Address"
                      className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Section 3: Contact, Education & Quota */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                    <span>3. Qualifications & Target Quota</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0300-4829103"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Target Quota Stream
                      </label>
                      <select
                        value={quotaStream}
                        onChange={(e) => setQuotaStream(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Merit Quota">General Merit Quota</option>
                        <option value="Provincial Quota">Provincial Allocation</option>
                        <option value="Youth Quota">Prime Minister Youth Quota</option>
                        <option value="Disabled Quota">Special Persons Quota</option>
                        <option value="Minority Quota">National Minorities Quota</option>
                        <option value="Staff Registry">Public Sector Staff Quota</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Education Level
                      </label>
                      <select
                        value={highestEducation}
                        onChange={(e) => setHighestEducation(e.target.value as EducationRecord["level"])}
                        className="w-full px-2 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Bachelors">Bachelors Degree (16 Years)</option>
                        <option value="Masters">Masters Degree (18 Years / MPhil)</option>
                        <option value="FSc / Intermediate">Intermediate (FSc / ICS / DAE)</option>
                        <option value="Matric">Matriculation</option>
                        <option value="Other">Other Diploma</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Degree / Major Title
                      </label>
                      <input
                        type="text"
                        value={degreeName}
                        onChange={(e) => setDegreeName(e.target.value)}
                        placeholder="e.g. BS Computer Science"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Portal Credentials */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>4. Secure Portal Credentials</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Portal Password
                        </label>
                        <span className="text-[9px] text-slate-400">Optional</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Minimum 8 characters"
                          className="w-full px-2.5 py-1.5 pr-8 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 transition-colors hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="mt-0.5 text-[9px] text-slate-400">Default: CNIC digits if left blank</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Email Address <span className="font-normal text-slate-400">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="candidate@example.com"
                        className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-2.5 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-1.5 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer w-full sm:flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Enrolling in National Ledger...</span>
                    ) : (
                      <>
                        <FileCheck2 className="w-3.5 h-3.5 text-white/80" />
                        <span>Register & Generate Enrolment ID</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <Link
                    href="/login?mode=candidate"
                    className="w-full sm:w-auto flex items-center justify-center gap-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 py-2.5 px-3.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Lock className="w-3 h-3 text-emerald-800" />
                    <span>Have Account? Sign In</span>
                  </Link>
                </div>

                <p className="text-[9px] text-slate-400 text-center leading-normal">
                  Encrypted under 256-bit AES pursuant to National Electronic Governance & NADRA Verification Act 2026.
                </p>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer at Bottom */}
      <PublicFooter />
    </div>
  );
}
