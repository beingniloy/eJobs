"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Camera, FileText, Plus, Trash2, Upload, Loader2, User, Briefcase, GraduationCap,
  Award, BookOpen, Globe, Link2, FileCheck, Shield, ChevronLeft, ChevronRight, Check,
  FileIcon, X,
} from "lucide-react";
import type { CandidateEducationEntry, CandidateExperienceEntry, CandidateTrainingEntry, CandidateCertificationEntry, CandidateDocumentEntry, LanguageProficiency } from "@/types";
import { DIVISIONS_BN, DIVISIONS_EN, DISTRICTS_BN, DISTRICTS_EN } from "@/lib/bd-data";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const EDUCATION_LEVELS = [
  { value: "ssc", label: "SSC / O-Level" },
  { value: "hsc", label: "HSC / A-Level" },
  { value: "graduation", label: "Bachelor's / Graduation" },
  { value: "post_graduation", label: "Master's / Post Graduation" },
  { value: "diploma", label: "Diploma" },
  { value: "phd", label: "PhD" },
];
const LANGUAGE_LIST = ["Bengali", "English", "Hindi", "Arabic", "Chinese", "Japanese", "Korean", "French", "German", "Spanish"];
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://127.0.0.1:8000";

function getAssetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}/storage/${path.replace(/^\/?storage\//, "")}`;
}

function Field({ label, required, children, className = "" }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

const STEPS = [
  { key: "personal", icon: User, labelEn: "Personal", labelBn: "ব্যক্তিগত" },
  { key: "contact", icon: Briefcase, labelEn: "Contact", labelBn: "যোগাযোগ" },
  { key: "career", icon: Briefcase, labelEn: "Career", labelBn: "ক্যারিয়ার" },
  { key: "education", icon: GraduationCap, labelEn: "Education", labelBn: "শিক্ষা" },
  { key: "experience", icon: Briefcase, labelEn: "Experience", labelBn: "অভিজ্ঞতা" },
  { key: "skills", icon: Award, labelEn: "Skills", labelBn: "দক্ষতা" },
  { key: "languages", icon: Globe, labelEn: "Languages", labelBn: "ভাষা" },
  { key: "training", icon: BookOpen, labelEn: "Training", labelBn: "প্রশিক্ষণ" },
  { key: "certifications", icon: Award, labelEn: "Certifications", labelBn: "সার্টিফিকেশন" },
  { key: "documents", icon: FileCheck, labelEn: "Documents", labelBn: "ডকুমেন্ট" },
  { key: "social", icon: Link2, labelEn: "Social Links", labelBn: "সোশ্যাল লিংক" },
];

export default function CandidateProfilePage() {
  const { user, setUser } = useAuthStore();
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set());
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Section 1: Personal
  const [fullNameBn, setFullNameBn] = useState("");
  const [fullNameEn, setFullNameEn] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [nationality, setNationality] = useState("Bangladeshi");
  const [nationalId, setNationalId] = useState("");
  const [birthRegNo, setBirthRegNo] = useState("");

  // Section 2: Contact
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Section 3: Career
  const [careerObjective, setCareerObjective] = useState("");
  const [currentProfession, setCurrentProfession] = useState("");
  const [expectedJobCategory, setExpectedJobCategory] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availableRemote, setAvailableRemote] = useState(false);
  const [availableRelocation, setAvailableRelocation] = useState(false);

  // Section 4: Education
  const [educations, setEducations] = useState<CandidateEducationEntry[]>([]);

  // Section 5: Experience
  const [experiences, setExperiences] = useState<CandidateExperienceEntry[]>([]);

  // Section 6: Skills
  const [skills, setSkills] = useState("");

  // Section 7: Languages
  const [languages, setLanguages] = useState<LanguageProficiency[]>([]);

  // Section 8: Training
  const [trainings, setTrainings] = useState<CandidateTrainingEntry[]>([]);

  // Section 9: Certifications
  const [certifications, setCertifications] = useState<(CandidateCertificationEntry & { _cert_file?: File })[]>([]);

  // Section 10: Documents
  const [documents, setDocuments] = useState<CandidateDocumentEntry[]>([]);
  const docTypes = [
    { value: "cv", label: "CV/Resume *" },
    { value: "nid_front", label: "NID Copy (Front)" },
    { value: "nid_back", label: "NID Copy (Back)" },
    { value: "passport", label: "Passport Copy" },
    { value: "academic_cert", label: "Academic Certificates" },
    { value: "experience_cert", label: "Experience Certificates" },
    { value: "photo", label: "Photograph" },
  ];

  // Section 11: Social Links
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [stackoverflowUrl, setStackoverflowUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");

  useEffect(() => {
    document.title = isBn ? `প্রোফাইল সম্পাদনা | ${siteName}` : `Edit Profile | ${siteName}`;
  }, [isBn, siteName]);

  useEffect(() => {
    if (!user) return;
    api.get("/candidate/dashboard").then((res) => {
      const p = res.data.user?.profile || res.data.data?.profile || {};
      setProfile(p);
      setEmail(user.email || "");
      setFullNameEn(user.name || "");
      setFullNameBn(p.full_name_bn || "");
      setFatherName(p.father_name || "");
      setMotherName(p.mother_name || "");
      setDob(p.date_of_birth || "");
      setGender(p.gender || "");
      setMaritalStatus(p.marital_status || "");
      setNationality(p.nationality || "Bangladeshi");
      setNationalId(p.national_id || "");
      setBirthRegNo(p.birth_reg_no || "");
      setPhone(p.phone || "");
      setAltPhone(p.alt_phone || "");
      setPresentAddress(p.present_address || p.address || "");
      setPermanentAddress(p.permanent_address || "");
      setDistrict(p.district || "");
      setDivision(p.division || "");
      setPostalCode(p.postal_code || "");
      setCareerObjective(p.career_objective || "");
      setCurrentProfession(p.current_profession || "");
      setExpectedJobCategory(p.expected_job_category || "");
      setPreferredLocation(p.preferred_location || "");
      setExpectedSalary(p.expected_salary || "");
      setAvailableRemote(p.available_remote || false);
      setAvailableRelocation(p.available_relocation || false);
      setSkills(Array.isArray(p.skills) ? p.skills.join(", ") : "");
      setLinkedinUrl(p.linkedin_url || "");
      setGithubUrl(p.github_url || "");
      setFacebookUrl(p.facebook_url || "");
      setPortfolioUrl(p.portfolio_url || "");
      if (p.social_links) {
        const sl = typeof p.social_links === "string" ? JSON.parse(p.social_links) : p.social_links;
        setTwitterUrl(sl.twitter_url || sl.twitter || "");
        setInstagramUrl(sl.instagram_url || sl.instagram || "");
        setYoutubeUrl(sl.youtube_url || sl.youtube || "");
        setStackoverflowUrl(sl.stackoverflow_url || sl.stackoverflow || "");
        setWhatsappUrl(sl.whatsapp_url || sl.whatsapp || "");
        setTelegramUrl(sl.telegram_url || sl.telegram || "");
      }
      if (Array.isArray(p.educations)) setEducations(p.educations);
      if (Array.isArray(p.experiences)) setExperiences(p.experiences);
      if (Array.isArray(p.language_proficiency)) setLanguages(p.language_proficiency);
      if (Array.isArray(p.trainings)) setTrainings(p.trainings);
      if (Array.isArray(p.certifications)) setCertifications(p.certifications);
      if (Array.isArray(p.documents)) setDocuments(p.documents);
      const existingAvatar = res.data.user?.avatar || p.avatar || user?.avatar || "";
      if (existingAvatar) setAvatarPreview(getAssetUrl(existingAvatar));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  // ─── Education helpers ───
  const addEducation = () => setEducations([...educations, { level: "", board: "", group_or_subject: "", institute_name: "", passing_year: undefined, gpa_or_cgpa: undefined }]);
  const removeEducation = (i: number) => setEducations(educations.filter((_, idx) => idx !== i));
  const updateEducation = (i: number, field: string, value: string | number | undefined) => {
    const next = [...educations];
    next[i] = { ...next[i], [field]: value };
    setEducations(next);
  };

  // ─── Experience helpers ───
  const addExperience = () => setExperiences([...experiences, { company_name: "", designation: "", employment_type: "Full-time", start_date: "", end_date: "", is_current: false, responsibilities: "" }]);
  const removeExperience = (i: number) => setExperiences(experiences.filter((_, idx) => idx !== i));
  const updateExperience = (i: number, field: string, value: string | boolean | undefined) => {
    const next = [...experiences];
    next[i] = { ...next[i], [field]: value };
    setExperiences(next);
  };

  // ─── Training helpers ───
  const addTraining = () => setTrainings([...trainings, { title: "", institute_name: "", duration: "", year: undefined }]);
  const removeTraining = (i: number) => setTrainings(trainings.filter((_, idx) => idx !== i));
  const updateTraining = (i: number, field: string, value: string | number | undefined) => {
    const next = [...trainings];
    next[i] = { ...next[i], [field]: value };
    setTrainings(next);
  };

  // ─── Certification helpers ───
  const addCertification = () => setCertifications([...certifications, { name: "", organization: "", issue_date: "", expiry_date: "" }]);
  const removeCertification = (i: number) => setCertifications(certifications.filter((_, idx) => idx !== i));
  const updateCertification = (i: number, field: string, value: string) => {
    const next = [...certifications];
    next[i] = { ...next[i], [field]: value };
    setCertifications(next);
  };
  const setCertFile = (i: number, file: File | undefined) => {
    const next = [...certifications];
    next[i] = { ...next[i], _cert_file: file };
    setCertifications(next);
  };

  // ─── Language helpers ───
  const toggleLanguage = (lang: string) => {
    const exists = languages.find((l) => l.name === lang);
    if (exists) {
      setLanguages(languages.filter((l) => l.name !== lang));
    } else {
      setLanguages([...languages, { name: lang, read: true, write: true, speak: true }]);
    }
  };
  const updateLangProficiency = (lang: string, field: "read" | "write" | "speak", value: boolean) => {
    setLanguages(languages.map((l) => l.name === lang ? { ...l, [field]: value } : l));
  };

  // ─── Section Save Functions ───
  const savePersonal = async () => {
    const fd = new FormData();
    fd.append("name", fullNameEn || user?.name || "");
    fd.append("full_name_bn", fullNameBn);
    fd.append("full_name_en", fullNameEn);
    fd.append("father_name", fatherName);
    fd.append("mother_name", motherName);
    fd.append("date_of_birth", dob);
    fd.append("gender", gender);
    fd.append("marital_status", maritalStatus);
    fd.append("nationality", nationality);
    fd.append("national_id", nationalId);
    fd.append("birth_reg_no", birthRegNo);
    if (avatarFile) fd.append("avatar", avatarFile);
    const res = await api.post("/candidate/profile-update", fd);
    if (res.data?.user) setUser(res.data.user);
  };

  const saveContact = async () => {
    const fd = new FormData();
    fd.append("phone", phone);
    fd.append("alt_phone", altPhone);
    fd.append("present_address", presentAddress);
    fd.append("permanent_address", permanentAddress);
    fd.append("district", district);
    fd.append("division", division);
    fd.append("postal_code", postalCode);
    fd.append("email", email);
    await api.post("/candidate/profile-update", fd);
  };

  const saveCareer = async () => {
    const fd = new FormData();
    fd.append("career_objective", careerObjective);
    fd.append("current_profession", currentProfession);
    fd.append("expected_job_category", expectedJobCategory);
    fd.append("preferred_location", preferredLocation);
    fd.append("expected_salary", expectedSalary);
    fd.append("available_remote", String(availableRemote));
    fd.append("available_relocation", String(availableRelocation));
    await api.post("/candidate/profile-update", fd);
  };

  const saveEducation = async () => {
    await api.post("/candidate/profile/educations", { educations });
  };

  const saveExperience = async () => {
    await api.post("/candidate/profile/experiences", { experiences });
  };

  const saveSkillsSection = async () => {
    const fd = new FormData();
    fd.append("skills", JSON.stringify(skills.split(",").map((s) => s.trim()).filter(Boolean)));
    await api.post("/candidate/profile-update", fd);
  };

  const saveLanguagesSection = async () => {
    const fd = new FormData();
    fd.append("language_proficiency", JSON.stringify(languages));
    await api.post("/candidate/profile-update", fd);
  };

  const saveTraining = async () => {
    await api.post("/candidate/profile/trainings", { trainings });
  };

  const saveCertification = async () => {
    const fd = new FormData();
    fd.append("certifications", JSON.stringify(certifications.map(({ _cert_file, ...rest }) => rest)));
    certifications.forEach((c, i) => {
      if (c._cert_file) fd.append(`cert_file_${i}`, c._cert_file);
    });
    await api.post("/candidate/profile/certifications", fd);
  };

  const saveDocumentSection = async () => {
    const uploads = documents.filter((d) => d._file).map((d) => {
      const fd = new FormData();
      fd.append("type", d.type);
      fd.append("file", d._file!);
      return api.post("/candidate/profile/documents", fd);
    });
    if (uploads.length > 0) {
      await Promise.all(uploads);
    } else if (documents.length === 0) {
      throw new Error(isBn ? "আপলোড করার জন্য কোনো ফাইল নেই" : "No files to upload");
    }
  };

  const saveSocial = async () => {
    const fd = new FormData();
    fd.append("linkedin_url", linkedinUrl);
    fd.append("github_url", githubUrl);
    fd.append("facebook_url", facebookUrl);
    fd.append("portfolio_url", portfolioUrl);
    fd.append("social_links", JSON.stringify({
      twitter_url: twitterUrl,
      instagram_url: instagramUrl,
      youtube_url: youtubeUrl,
      stackoverflow_url: stackoverflowUrl,
      whatsapp_url: whatsappUrl,
      telegram_url: telegramUrl,
    }));
    await api.post("/candidate/profile-update", fd);
  };

  const SECTION_SAVE_MAP: Record<string, () => Promise<void>> = {
    personal: savePersonal,
    contact: saveContact,
    career: saveCareer,
    education: saveEducation,
    experience: saveExperience,
    skills: saveSkillsSection,
    languages: saveLanguagesSection,
    training: saveTraining,
    certifications: saveCertification,
    documents: saveDocumentSection,
    social: saveSocial,
  };

  const handleSave = async (showToast = true): Promise<boolean> => {
    try {
      setSaving(true);
      const key = STEPS[step].key;
      const fn = SECTION_SAVE_MAP[key];
      if (fn) await fn();
      if (showToast) toast.success(isBn ? "সংরক্ষিত হয়েছে!" : "Saved!");
      window.dispatchEvent(new Event("candidate-profile-saved"));
      return true;
    } catch (error: any) {
      const data = error.response?.data;
      let msg = data?.message || "Failed to save profile";
      if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey) {
          const val = data.errors[firstKey];
          msg = Array.isArray(val) ? val[0] : val;
        }
      }
      if (showToast) toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const ok = await handleSave(true);
    if (ok) {
      setSavedSteps((prev) => new Set(prev).add(step));
      if (step < STEPS.length - 1) setStep(step + 1);
    }
  };

  const handleSkip = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  // ─── Completion ───
  const totalFields = 25;
  const filledFields = [fullNameEn, gender, dob, phone, presentAddress, careerObjective, skills, email].filter(Boolean).length;
  const completionPct = Math.round((filledFields / totalFields) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (STEPS[step].key) {
      case "personal":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <DefaultAvatar src={avatarPreview || null} name={fullNameEn || user?.name} className="h-20 w-20" />
                <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium">{isBn ? "প্রোফাইল ফটো" : "Profile Photo"}</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, max 2MB</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name (বাংলা)"><Input value={fullNameBn} onChange={(e) => setFullNameBn(e.target.value)} placeholder="বাংলায় পুরো নাম" /></Field>
              <Field label="Full Name (English)" required><Input value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} placeholder="Full Name" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "পিতার নাম" : "Father's Name"}><Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} /></Field>
              <Field label={isBn ? "মাতার নাম" : "Mother's Name"}><Input value={motherName} onChange={(e) => setMotherName(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={isBn ? "জন্ম তারিখ" : "Date of Birth"}><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
              <Field label={isBn ? "লিঙ্গ" : "Gender"}>
                <Select value={gender} onValueChange={setGender}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label={isBn ? "বৈবাহিক অবস্থা" : "Marital Status"}>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{MARITAL_STATUS.map((s) => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent></Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={isBn ? "জাতীয়তা" : "Nationality"}><Input value={nationality} onChange={(e) => setNationality(e.target.value)} /></Field>
              <Field label={isBn ? "জাতীয় পরিচয়পত্র" : "National ID (Optional)"}><Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} /></Field>
              <Field label={isBn ? "জন্ম নিবন্ধন নম্বর" : "Birth Registration No (Optional)"}><Input value={birthRegNo} onChange={(e) => setBirthRegNo(e.target.value)} /></Field>
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "মোবাইল নম্বর" : "Mobile Number"} required><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXXXXXXXX" /></Field>
              <Field label={isBn ? "বিকল্প মোবাইল" : "Alternative Mobile"}><Input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} /></Field>
            </div>
            <Field label={isBn ? "ইমেইল" : "Email Address"} required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label={isBn ? "বর্তমান ঠিকানা" : "Present Address"} required><Textarea value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} rows={2} /></Field>
            <Field label={isBn ? "স্থায়ী ঠিকানা" : "Permanent Address"} required><Textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} rows={2} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={isBn ? "বিভাগ" : "Division"}>
                <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(isBn ? DIVISIONS_BN : DIVISIONS_EN).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={isBn ? "জেলা" : "District"}>
                <Select value={district} onValueChange={setDistrict} disabled={!division}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{((isBn ? DISTRICTS_BN : DISTRICTS_EN)[division] || []).map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={isBn ? "পোস্টাল কোড" : "Postal Code"}><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></Field>
            </div>
          </div>
        );
      case "career":
        return (
          <div className="space-y-4">
            <Field label={isBn ? "ক্যারিয়ার উদ্দেশ্য" : "Career Objective / About Me"}>
              <Textarea value={careerObjective} onChange={(e) => setCareerObjective(e.target.value)} rows={3} placeholder={isBn ? "আপনার ক্যারিয়ার লক্ষ্য লিখুন..." : "Write your career objective..."} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "বর্তমান পেশা" : "Current Profession"}><Input value={currentProfession} onChange={(e) => setCurrentProfession(e.target.value)} /></Field>
              <Field label={isBn ? "প্রত্যাশিত বেতন (BDT)" : "Expected Salary (BDT)"}><Input value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} placeholder="e.g. 25000-40000" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "পছন্দের ক্যাটাগরি" : "Expected Job Category"}><Input value={expectedJobCategory} onChange={(e) => setExpectedJobCategory(e.target.value)} /></Field>
              <Field label={isBn ? "পছন্দের লোকেশন" : "Preferred Job Location"}><Input value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} /></Field>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Checkbox checked={availableRemote} onCheckedChange={(c) => setAvailableRemote(!!c)} id="remote" /><Label htmlFor="remote" className="cursor-pointer">{isBn ? "রিমোট কাজের জন্য প্রস্তুত" : "Available for Remote Work"}</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={availableRelocation} onCheckedChange={(c) => setAvailableRelocation(!!c)} id="reloc" /><Label htmlFor="reloc" className="cursor-pointer">{isBn ? "স্থানান্তরের জন্য প্রস্তুত" : "Available for Relocation"}</Label></div>
            </div>
          </div>
        );
      case "education":
        return (
          <div className="space-y-4">
            {educations.length === 0 && <p className="text-sm text-muted-foreground">{isBn ? "কোনো শিক্ষাগত যোগ্যতা যোগ করা হয়নি" : "No education entries added yet"}</p>}
            {educations.map((edu, i) => (
              <div key={i} className="p-4 rounded-lg border space-y-3 relative">
                <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => removeEducation(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Level" required>
                    <Select value={edu.level} onValueChange={(v) => updateEducation(i, "level", v)}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>{EDUCATION_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={edu.level === "graduation" || edu.level === "post_graduation" ? "Degree Name" : "Board"}>
                    <Input value={edu.level === "graduation" || edu.level === "post_graduation" ? (edu.degree_name || "") : (edu.board || "")} onChange={(e) => updateEducation(i, edu.level === "graduation" || edu.level === "post_graduation" ? "degree_name" : "board", e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label={edu.level === "graduation" || edu.level === "post_graduation" ? "Subject" : "Group"}>
                    <Input value={edu.group_or_subject || ""} onChange={(e) => updateEducation(i, "group_or_subject", e.target.value)} />
                  </Field>
                  <Field label="Institute"><Input value={edu.institute_name || ""} onChange={(e) => updateEducation(i, "institute_name", e.target.value)} /></Field>
                  <Field label="Year"><Input type="number" value={edu.passing_year || ""} onChange={(e) => updateEducation(i, "passing_year", parseInt(e.target.value) || undefined)} /></Field>
                </div>
                <div className="w-32">
                  <Field label={edu.level === "graduation" || edu.level === "post_graduation" ? "CGPA" : "GPA"}>
                    <Input type="number" step="0.01" max="5" value={edu.gpa_or_cgpa || ""} onChange={(e) => updateEducation(i, "gpa_or_cgpa", parseFloat(e.target.value) || undefined)} />
                  </Field>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addEducation}><Plus className="h-4 w-4 mr-1" /> {isBn ? "শিক্ষা যোগ করুন" : "Add Education"}</Button>
          </div>
        );
      case "experience":
        return (
          <div className="space-y-4">
            {experiences.length === 0 && <p className="text-sm text-muted-foreground">{isBn ? "কোনো অভিজ্ঞতা যোগ করা হয়নি" : "No experience entries added yet"}</p>}
            {experiences.map((exp, i) => (
              <div key={i} className="p-4 rounded-lg border space-y-3 relative">
                <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => removeExperience(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Company" required><Input value={exp.company_name} onChange={(e) => updateExperience(i, "company_name", e.target.value)} /></Field>
                  <Field label="Designation" required><Input value={exp.designation} onChange={(e) => updateExperience(i, "designation", e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Type">
                    <Select value={exp.employment_type || ""} onValueChange={(v) => updateExperience(i, "employment_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Start Date" required><Input type="date" value={exp.start_date || ""} onChange={(e) => updateExperience(i, "start_date", e.target.value)} /></Field>
                  <Field label="End Date">
                    <Input type="date" value={exp.end_date || ""} onChange={(e) => updateExperience(i, "end_date", e.target.value)} disabled={exp.is_current} />
                  </Field>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={exp.is_current || false} onCheckedChange={(c) => updateExperience(i, "is_current", !!c)} id={`current-${i}`} />
                  <Label htmlFor={`current-${i}`} className="cursor-pointer text-sm">{isBn ? "বর্তমানে কাজ করছেন" : "Currently working here"}</Label>
                </div>
                <Field label="Responsibilities"><Textarea value={exp.responsibilities || ""} onChange={(e) => updateExperience(i, "responsibilities", e.target.value)} rows={2} /></Field>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addExperience}><Plus className="h-4 w-4 mr-1" /> {isBn ? "অভিজ্ঞতা যোগ করুন" : "Add Experience"}</Button>
          </div>
        );
      case "skills":
        return (
          <div className="space-y-4">
            <Field label={isBn ? "দক্ষতা (কমা দিয়ে আলাদা করুন)" : "Skills (comma-separated)"}><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Python, Microsoft Office..." /></Field>
          </div>
        );
      case "languages":
        return (
          <div className="space-y-4">
            {LANGUAGE_LIST.map((lang) => {
              const entry = languages.find((l) => l.name === lang);
              const active = !!entry;
              return (
                <div key={lang} className="flex items-center gap-4 p-2 rounded-lg border">
                  <div className="flex items-center gap-2 w-32">
                    <Checkbox checked={active} onCheckedChange={() => toggleLanguage(lang)} id={`lang-${lang}`} />
                    <Label htmlFor={`lang-${lang}`} className="cursor-pointer text-sm font-medium">{lang}</Label>
                  </div>
                  {active && (
                    <div className="flex gap-4">
                      {(["read", "write", "speak"] as const).map((skill) => (
                        <div key={skill} className="flex items-center gap-1">
                          <Checkbox checked={entry![skill]} onCheckedChange={(c) => updateLangProficiency(lang, skill, !!c)} id={`${lang}-${skill}`} />
                          <Label htmlFor={`${lang}-${skill}`} className="cursor-pointer text-xs capitalize">{skill}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      case "training":
        return (
          <div className="space-y-4">
            {trainings.map((t, i) => (
              <div key={i} className="p-4 rounded-lg border space-y-3 relative">
                <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => removeTraining(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Training Title" required><Input value={t.title} onChange={(e) => updateTraining(i, "title", e.target.value)} /></Field>
                  <Field label="Institute"><Input value={t.institute_name || ""} onChange={(e) => updateTraining(i, "institute_name", e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Duration"><Input value={t.duration || ""} onChange={(e) => updateTraining(i, "duration", e.target.value)} placeholder="e.g. 3 months" /></Field>
                  <Field label="Year"><Input type="number" value={t.year || ""} onChange={(e) => updateTraining(i, "year", parseInt(e.target.value) || undefined)} /></Field>
                </div>
              </div>
            ))}
            {trainings.length === 0 && <p className="text-sm text-muted-foreground">No training entries</p>}
            <Button size="sm" variant="outline" onClick={addTraining}><Plus className="h-4 w-4 mr-1" /> {isBn ? "প্রশিক্ষণ যোগ করুন" : "Add Training"}</Button>
          </div>
        );
      case "certifications":
        return (
          <div className="space-y-4">
            {certifications.map((c, i) => (
              <div key={i} className="p-4 rounded-lg border space-y-3 relative">
                <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => removeCertification(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Certification Name" required><Input value={c.name} onChange={(e) => updateCertification(i, "name", e.target.value)} /></Field>
                  <Field label="Organization"><Input value={c.organization || ""} onChange={(e) => updateCertification(i, "organization", e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Issue Date"><Input type="date" value={c.issue_date || ""} onChange={(e) => updateCertification(i, "issue_date", e.target.value)} /></Field>
                  <Field label="Expiry Date"><Input type="date" value={c.expiry_date || ""} onChange={(e) => updateCertification(i, "expiry_date", e.target.value)} /></Field>
                </div>
                <div>
                  <Label className="text-sm font-medium">{isBn ? "সার্টিফিকেট ফাইল" : "Certificate File"}</Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    {c.certificate_path && (
                      <div className="relative group">
                        <img src={getAssetUrl(c.certificate_path)} alt="cert" className="h-14 w-14 object-cover rounded border" />
                      </div>
                    )}
                    {c._cert_file && (
                      <div className="relative">
                        {c._cert_file.type.startsWith("image/") ? (
                          <img src={URL.createObjectURL(c._cert_file)} alt="preview" className="h-14 w-14 object-cover rounded border" />
                        ) : (
                          <div className="h-14 w-14 flex items-center justify-center rounded border bg-muted">
                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <button onClick={() => setCertFile(i, undefined)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <Button size="sm" variant="outline" type="button" asChild>
                        <span><Upload className="h-3 w-3 mr-1" />{c.certificate_path || c._cert_file ? "Replace" : "Upload"}</span>
                      </Button>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCertFile(i, file);
                      }} />
                    </label>
                  </div>
                </div>
              </div>
            ))}
            {certifications.length === 0 && <p className="text-sm text-muted-foreground">No certifications added</p>}
            <Button size="sm" variant="outline" onClick={addCertification}><Plus className="h-4 w-4 mr-1" /> {isBn ? "সার্টিফিকেশন যোগ করুন" : "Add Certification"}</Button>
          </div>
        );
      case "documents":
        return (
          <div className="space-y-4">
            {docTypes.map((dt) => {
              const existing = documents.find((d) => d.type === dt.value);
              const previewUrl = existing ? (existing._file ? URL.createObjectURL(existing._file) : existing.url || getAssetUrl(existing.file_path)) : null;
              const isImage = existing && (existing._file?.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(existing.file_path || ""));
              return (
                <div key={dt.value} className="flex items-center gap-4 p-3 rounded-lg border">
                  {existing && previewUrl ? (
                    <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden border bg-muted">
                      {isImage ? (
                        <img src={previewUrl} alt={dt.label} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-12 w-12 flex-shrink-0 rounded border bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{dt.label}</p>
                    {existing && <p className="text-xs text-muted-foreground truncate mt-0.5">{(existing.file_path || "").split("/").pop()}</p>}
                  </div>
                  <label>
                    <Button size="sm" variant={existing ? "outline" : "default"} asChild>
                      <span><Upload className="h-4 w-4 mr-1" /> {existing ? "Replace" : "Upload"}</span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const entry: CandidateDocumentEntry = {
                          type: dt.value,
                          label: dt.label.replace(" *", ""),
                          file_path: URL.createObjectURL(file),
                          url: URL.createObjectURL(file),
                          _file: file,
                        };
                        setDocuments((prev) => {
                          const without = prev.filter((d) => d.type !== dt.value);
                          return [...without, entry];
                        });
                      }}
                    />
                  </label>
                  {existing && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setDocuments((prev) => prev.filter((d) => d.type !== dt.value))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        );
      case "social":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="LinkedIn"><Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" /></Field>
              <Field label="GitHub"><Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Twitter / X"><Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/username" /></Field>
              <Field label="Instagram"><Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/username" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="YouTube"><Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@username" /></Field>
              <Field label="Stack Overflow"><Input value={stackoverflowUrl} onChange={(e) => setStackoverflowUrl(e.target.value)} placeholder="https://stackoverflow.com/users/..." /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="WhatsApp"><Input value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} placeholder="https://wa.me/8801XXXXXXXXX" /></Field>
              <Field label="Telegram"><Input value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/username" /></Field>
            </div>
            <Field label="Portfolio Website"><Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yoursite.com" /></Field>
            <Field label="Facebook"><Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/username" /></Field>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isBn ? "প্রোফাইল সম্পাদনা" : "Edit Profile"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{isBn ? "ধাপে ধাপে আপনার প্রোফাইল সম্পূর্ণ করুন" : "Complete your profile step by step"}</p>
        </div>
        <Button onClick={async () => { const ok = await handleSave(true); if (ok) setSavedSteps((prev) => new Set(prev).add(step)); }} disabled={saving} variant="outline">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? (isBn ? "সংরক্ষিত হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
        </Button>
      </div>

      {/* Completion Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isBn ? "প্রোফাইল সম্পূর্ণতা" : "Profile Completion"}</p>
            <Badge variant={completionPct >= 80 ? "default" : completionPct >= 50 ? "secondary" : "outline"}>{completionPct}%</Badge>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Step Indicators */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isCompleted = savedSteps.has(i);
          return (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : isCompleted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              {isBn ? s.labelBn : s.labelEn}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {React.createElement(STEPS[step].icon, { className: "h-5 w-5 text-primary" })}
            {isBn ? STEPS[step].labelBn : STEPS[step].labelEn}
            <Badge variant="outline" className="ml-auto text-xs">{step + 1}/{STEPS.length}</Badge>
          </h2>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pb-8">
        <Button
          variant="outline"
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {isBn ? "পূর্ববর্তী" : "Previous"}
        </Button>

        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 && (
            <Button variant="ghost" onClick={handleSkip}>
              {isBn ? "এড়িয়ে যান" : "Skip"}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={handleSaveAndContinue} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isBn ? "সংরক্ষণ ও পরবর্তী" : "Save & Continue"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={async () => { const ok = await handleSave(true); if (ok) setSavedSteps((prev) => new Set(prev).add(step)); }} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isBn ? "সম্পূর্ণ সংরক্ষণ করুন" : "Save Complete Profile"}
              <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
