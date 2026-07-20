"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";
import { useEmployerCompany } from "@/hooks/use-employer-company";
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
  Building2, Upload, Loader2, Plus, Trash2, Globe, MapPin, Users, Phone,
  Shield, FileCheck, Camera, Settings, ChevronRight, ChevronLeft, Check,
  Link2, Briefcase,
} from "lucide-react";
import { DIVISIONS_BN, DIVISIONS_EN, DISTRICTS_BN, DISTRICTS_EN } from "@/lib/bd-data";

const COMPANY_TYPES = ["Private", "Government", "NGO", "Startup", "Multinational", "Sole Proprietorship", "Partnership", "Public Limited"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];
const HR_DESIGNATIONS = [
  { value: "admin", label: "Admin" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "recruiter", label: "Recruiter" },
];

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
  { key: "basic", icon: Building2, labelEn: "Basic Info", labelBn: "মৌলিক তথ্য" },
  { key: "contact", icon: Phone, labelEn: "Contact", labelBn: "যোগাযোগ" },
  { key: "address", icon: MapPin, labelEn: "Address", labelBn: "ঠিকানা" },
  { key: "overview", icon: Globe, labelEn: "Overview", labelBn: "পরিচিতি" },
  { key: "hr", icon: Users, labelEn: "HR Info", labelBn: "HR তথ্য" },
  { key: "settings", icon: Settings, labelEn: "Settings", labelBn: "সেটিংস" },
  { key: "verification", icon: Shield, labelEn: "Verification", labelBn: "ভেরিফিকেশন" },
  { key: "media", icon: Camera, labelEn: "Media", labelBn: "মিডিয়া" },
  { key: "social", icon: Link2, labelEn: "Social", labelBn: "সোশ্যাল" },
  { key: "stats", icon: Briefcase, labelEn: "Stats", labelBn: "পরিসংখ্যান" },
  { key: "team", icon: Users, labelEn: "HR Team", labelBn: "HR টিম" },
];

export default function EmployerProfilePage() {
  const { user } = useAuthStore();
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";
  const { company: hookCompany, stats: hookStats, loading: hookLoading, updateCompany, lastSyncedAt } = useEmployerCompany();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set());

  // Section 1: Basic Info
  const [companyName, setCompanyName] = useState("");
  const [companyNameBn, setCompanyNameBn] = useState("");
  const [tagline, setTagline] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [tradeLicenseNo, setTradeLicenseNo] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  // Section 2: Contact Info
  const [contactPerson, setContactPerson] = useState("");
  const [contactDesignation, setContactDesignation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAltPhone, setContactAltPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Section 3: Address
  const [headOffice, setHeadOffice] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [googleMap, setGoogleMap] = useState("");

  // Section 4: Overview
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [values, setValues] = useState("");
  const [servicesProducts, setServicesProducts] = useState("");
  const [workingCulture, setWorkingCulture] = useState("");
  const [whyJoinUs, setWhyJoinUs] = useState<string[]>([]);
  const [whyJoinUsInput, setWhyJoinUsInput] = useState("");
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [topSkillsInput, setTopSkillsInput] = useState("");

  // Section 5: HR Info
  const [hrName, setHrName] = useState("");
  const [hrPhone, setHrPhone] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [recruitmentPolicy, setRecruitmentPolicy] = useState("");
  const [hiringProcess, setHiringProcess] = useState("");

  // Section 6: Job Posting Settings
  const [allowJobPosting, setAllowJobPosting] = useState(true);
  const [postingLimit, setPostingLimit] = useState("");
  const [featuredAllowed, setFeaturedAllowed] = useState(false);
  const [autoApproval, setAutoApproval] = useState(false);
  const [expiryDays, setExpiryDays] = useState("30");

  // Section 7: Verification
  const [tradeLicenseFile, setTradeLicenseFile] = useState<File | null>(null);
  const [nidFile, setNidFile] = useState<File | null>(null);
  const [regCertFile, setRegCertFile] = useState<File | null>(null);
  const [tinNumber, setTinNumber] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [tradeLicensePath, setTradeLicensePath] = useState("");
  const [nidPath, setNidPath] = useState("");
  const [regCertPath, setRegCertPath] = useState("");

  // Section 8: Media
  const [videoUrl, setVideoUrl] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [instagramProfile, setInstagramProfile] = useState("");

  // Section 9: Social
  const [facebookPage, setFacebookPage] = useState("");
  const [linkedinPage, setLinkedinPage] = useState("");

  // Section 11: HR Team
  const [hrTeam, setHrTeam] = useState<{ name: string; email: string; phone: string; designation: string }[]>([]);

  useEffect(() => {
    document.title = isBn ? `কোম্পানি প্রোফাইল | ${siteName}` : `Company Profile | ${siteName}`;
  }, [isBn, siteName]);

  useEffect(() => {
    if (hookLoading) return;
    setLoading(false);
    const c = hookCompany;
    if (c) {
      setCompany(c);
      setCompanyName(c.name || "");
      setCompanyNameBn(c.name_bn || "");
      setTagline(c.tagline || "");
      setCompanyType(c.company_type || "");
      setIndustry(c.industry || "");
      setBusinessRegNo(c.business_registration_number || "");
      setTradeLicenseNo(c.trade_license_number || "");
      setFoundedYear(c.founded_year || "");
      setCompanySize(c.size || "");
      setEmployeeCount(c.employee_count || "");
      setDescription(c.description || "");
      setLogoPreview(c.logo ? `/storage/${c.logo}` : "");
      setCoverPreview(c.cover_photo ? `/storage/${c.cover_photo}` : "");
      setContactPerson(c.contact_person_name || user?.name || "");
      setContactDesignation(c.contact_person_designation || "");
      setContactPhone(c.contact_phone || "");
      setContactAltPhone(c.contact_alt_phone || "");
      setContactEmail(c.contact_email || user?.email || "");
      setWebsite(c.website || "");
      setFacebookPage(c.facebook || "");
      setLinkedinPage(c.linkedin || "");
      setHeadOffice(c.head_office_address || c.location || "");
      setCountry(c.address_country || "Bangladesh");
      setDivision(c.address_division || "");
      setDistrict(c.address_district || "");
      setPostalCode(c.address_postal_code || "");
      setGoogleMap(c.google_map_embed || "");
      setMission(c.mission || "");
      setVision(c.vision || "");
      setValues(c.values || "");
      setServicesProducts(c.services_products || "");
      setWorkingCulture(c.working_culture || "");
      const wju = c.why_join_us;
      if (Array.isArray(wju)) setWhyJoinUs(wju);
      else if (wju && typeof wju === "object" && wju.benefits) setWhyJoinUs(wju.benefits);
      else setWhyJoinUs([]);
      setTopSkills(Array.isArray(c.top_skills) ? c.top_skills : []);
      setHrName(c.hr_manager_name || "");
      setHrPhone(c.hr_contact_number || "");
      setHrEmail(c.hr_email || "");
      setRecruitmentPolicy(c.recruitment_policy || "");
      setHiringProcess(c.hiring_process || "");
      setAllowJobPosting(c.allow_job_posting !== false);
      setPostingLimit(c.job_posting_limit_monthly || "");
      setFeaturedAllowed(c.featured_job_allowed || false);
      setAutoApproval(c.auto_approval || false);
      setExpiryDays(String(c.job_expiry_days || 30));
      setTinNumber(c.tin_number || "");
      setVerificationStatus(c.verification_status || "pending");
      setTradeLicensePath(c.trade_license_document || "");
      setNidPath(c.nid_document || "");
      setRegCertPath(c.registration_certificate || "");
      setVideoUrl(c.company_video_url || "");
      setYoutubeChannel(c.youtube_channel || "");
      setInstagramProfile(c.instagram_profile || "");
      if (c.hr_team && Array.isArray(c.hr_team)) {
        setHrTeam(c.hr_team.map((h: any) => ({ name: h.name || "", email: h.email || "", phone: h.phone || "", designation: h.designation || "recruiter" })));
      }
    }
  }, [hookCompany, hookLoading, user]);

  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append("company_name", companyName);
    fd.append("name_bn", companyNameBn);
    fd.append("tagline", tagline);
    fd.append("company_type", companyType);
    fd.append("industry", industry);
    fd.append("business_registration_number", businessRegNo);
    fd.append("trade_license_number", tradeLicenseNo);
    fd.append("founded_year", foundedYear);
    fd.append("size", companySize);
    fd.append("employee_count", employeeCount);
    fd.append("description", description);
    fd.append("contact_person_name", contactPerson);
    fd.append("contact_person_designation", contactDesignation);
    fd.append("contact_phone", contactPhone);
    fd.append("contact_alt_phone", contactAltPhone);
    fd.append("contact_email", contactEmail);
    fd.append("website", website);
    fd.append("facebook", facebookPage);
    fd.append("linkedin", linkedinPage);
    fd.append("head_office_address", headOffice);
    fd.append("address_country", country);
    fd.append("address_division", division);
    fd.append("address_district", district);
    fd.append("address_postal_code", postalCode);
    fd.append("google_map_embed", googleMap);
    fd.append("location", headOffice);
    fd.append("mission", mission);
    fd.append("vision", vision);
    fd.append("values", values);
    fd.append("services_products", servicesProducts);
    fd.append("working_culture", workingCulture);
    fd.append("why_join_us", JSON.stringify(whyJoinUs));
    fd.append("top_skills", JSON.stringify(topSkills));
    fd.append("hr_manager_name", hrName);
    fd.append("hr_contact_number", hrPhone);
    fd.append("hr_email", hrEmail);
    fd.append("recruitment_policy", recruitmentPolicy);
    fd.append("hiring_process", hiringProcess);
    fd.append("allow_job_posting", String(allowJobPosting));
    fd.append("job_posting_limit_monthly", postingLimit);
    fd.append("featured_job_allowed", String(featuredAllowed));
    fd.append("auto_approval", String(autoApproval));
    fd.append("job_expiry_days", expiryDays);
    fd.append("tin_number", tinNumber);
    fd.append("company_video_url", videoUrl);
    fd.append("youtube_channel", youtubeChannel);
    fd.append("instagram_profile", instagramProfile);
    if (logoFile) fd.append("logo", logoFile);
    if (coverFile) fd.append("cover_photo", coverFile);
    if (tradeLicenseFile) fd.append("trade_license_document", tradeLicenseFile);
    if (nidFile) fd.append("nid_document", nidFile);
    if (regCertFile) fd.append("registration_certificate", regCertFile);
    return fd;
  };

  const handleSave = async (showToast = true): Promise<boolean> => {
    try {
      setSaving(true);
      const fd = buildFormData();
      const success = await updateCompany(fd);
      if (success) {
        if (hrTeam.length > 0) {
          try { await api.post("/employer/hr-team", { members: hrTeam }); } catch {}
        }
        const c = hookCompany;
        if (c) {
          setCompany(c);
          setLogoPreview(c.logo ? `/storage/${c.logo}` : logoPreview);
          setCoverPreview(c.cover_photo ? `/storage/${c.cover_photo}` : coverPreview);
        }
        if (showToast) toast.success(isBn ? "সংরক্ষিত হয়েছে!" : "Profile saved!");
        window.dispatchEvent(new Event("employer-company-saved"));
        return true;
      } else {
        if (showToast) toast.error(isBn ? "সংরক্ষণ ব্যর্থ হয়েছে" : "Failed to save profile");
        return false;
      }
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

  const addHrMember = () => setHrTeam([...hrTeam, { name: "", email: "", phone: "", designation: "recruiter" }]);
  const removeHrMember = (i: number) => setHrTeam(hrTeam.filter((_, idx) => idx !== i));
  const updateHrMember = (i: number, key: string, val: string) => {
    const next = [...hrTeam];
    next[i] = { ...next[i], [key]: val };
    setHrTeam(next);
  };

  const totalFields = 30;
  const filledFields = [companyName, industry, description, contactPerson, contactPhone, contactEmail, headOffice, district].filter(Boolean).length;
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
      case "basic":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <DefaultAvatar name={companyName || "C"} src={logoPreview} className="h-20 w-20 text-lg" />
                <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); } }} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium">{isBn ? "কোম্পানি লোগো" : "Company Logo"}</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, max 2MB</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{isBn ? "কোভার ফোটো" : "Cover Photo"}</p>
              {coverPreview && <img src={coverPreview} alt="Cover" className="w-full h-32 object-cover rounded-lg mb-2" />}
              <label>
                <Button size="sm" variant="outline" asChild><span><Upload className="h-4 w-4 mr-1" /> {isBn ? "কোভার আপলোড করুন" : "Upload Cover"}</span></Button>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "কোম্পানির নাম (English)" : "Company Name (English)"} required><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
              <Field label={isBn ? "কোম্পানির নাম (বাংলা)" : "Company Name (বাংলা)"}><Input value={companyNameBn} onChange={(e) => setCompanyNameBn(e.target.value)} placeholder="বাংলায় নাম" /></Field>
            </div>
            <Field label={isBn ? "ট্যাগলাইন / স্লোগান" : "Tagline / Slogan"}><Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Building the future" /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "কোম্পানির ধরন" : "Company Type"}>
                <Select value={companyType} onValueChange={setCompanyType}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{COMPANY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={isBn ? "শিল্পের ধরন" : "Industry Type"} required>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology, Healthcare" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={isBn ? "ব্যবসায়িক নিবন্ধন নম্বর" : "Business Registration No."}><Input value={businessRegNo} onChange={(e) => setBusinessRegNo(e.target.value)} /></Field>
              <Field label={isBn ? "ট্রেড লাইসেন্স নম্বর (ঐচ্ছিক)" : "Trade License No. (Optional)"}><Input value={tradeLicenseNo} onChange={(e) => setTradeLicenseNo(e.target.value)} /></Field>
              <Field label={isBn ? "প্রতিষ্ঠার বছর" : "Year of Establishment"}><Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="YYYY" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "কোম্পানির সাইজ" : "Company Size"}>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={isBn ? "কর্মী সংখ্যা" : "Employee Count"}><Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} /></Field>
            </div>
            <Field label={isBn ? "কোম্পানি বিবরণ" : "Company Description"} required><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Tell candidates about your company..." /></Field>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "যোগাযোগকারীর নাম" : "Contact Person Name"} required><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></Field>
              <Field label={isBn ? "পদবি" : "Designation"} required><Input value={contactDesignation} onChange={(e) => setContactDesignation(e.target.value)} placeholder="e.g. CEO, HR Director" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "মোবাইল নম্বর" : "Mobile Number"} required><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></Field>
              <Field label={isBn ? "বিকল্প ফোন" : "Alternative Phone"}><Input value={contactAltPhone} onChange={(e) => setContactAltPhone(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "অফিসিয়াল ইমেইল" : "Official Email"} required><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></Field>
              <Field label={isBn ? "ওয়েবসাইট" : "Website URL"}><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></Field>
            </div>
          </div>
        );
      case "address":
        return (
          <div className="space-y-4">
            <Field label={isBn ? "হেড অফিস ঠিকানা" : "Head Office Address"} required><Textarea value={headOffice} onChange={(e) => setHeadOffice(e.target.value)} rows={2} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "দেশ" : "Country"}><Input value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
              <Field label={isBn ? "পোস্টাল কোড" : "Postal Code"}><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isBn ? "বিভাগ" : "Division"}>
                <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(isBn ? DIVISIONS_BN : DIVISIONS_EN).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={isBn ? "জেলা" : "District"} required>
                <Select value={district} onValueChange={setDistrict} disabled={!division}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{((isBn ? DISTRICTS_BN : DISTRICTS_EN)[division] || []).map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={isBn ? "গুগল ম্যাপ এম্বেড লিংক" : "Google Map Embed Link"}><Input value={googleMap} onChange={(e) => setGoogleMap(e.target.value)} placeholder="https://www.google.com/maps/embed?..." /></Field>
          </div>
        );
      case "overview":
        return (
          <div className="space-y-4">
            <Field label={isBn ? "মিশন স্টেটমেন্ট" : "Mission Statement"}><Textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={3} placeholder="Your company mission..." /></Field>
            <Field label={isBn ? "ভিশন স্টেটমেন্ট" : "Vision Statement"}><Textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={3} placeholder="Your company vision..." /></Field>
            <Field label={isBn ? "মূল মূল্যবোধ" : "Core Values"}><Textarea value={values} onChange={(e) => setValues(e.target.value)} rows={3} placeholder="Innovation, Integrity, Teamwork..." /></Field>
            <Field label={isBn ? "সেবা / পণ্য বিবরণ" : "Services / Products Description"}><Textarea value={servicesProducts} onChange={(e) => setServicesProducts(e.target.value)} rows={3} /></Field>
            <Field label={isBn ? "ওয়ার্কিং কালচার" : "Working Culture"}><Textarea value={workingCulture} onChange={(e) => setWorkingCulture(e.target.value)} rows={3} /></Field>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isBn ? "কেন আমাদের সাথে যোগ দেবেন" : "Why Join Us (Benefits)"}</Label>
              <div className="flex gap-2">
                <Input value={whyJoinUsInput} onChange={(e) => setWhyJoinUsInput(e.target.value)} placeholder={isBn ? "একটি বেনিফিট যোগ করুন..." : "Add a benefit..."} onKeyDown={(e) => { if (e.key === "Enter" && whyJoinUsInput.trim()) { e.preventDefault(); setWhyJoinUs([...whyJoinUs, whyJoinUsInput.trim()]); setWhyJoinUsInput(""); } }} />
                <Button type="button" size="sm" variant="outline" onClick={() => { if (whyJoinUsInput.trim()) { setWhyJoinUs([...whyJoinUs, whyJoinUsInput.trim()]); setWhyJoinUsInput(""); } }}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {whyJoinUs.map((item, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => setWhyJoinUs(whyJoinUs.filter((_, idx) => idx !== i))}>
                    {item} <span className="text-muted-foreground ml-0.5">&times;</span>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isBn ? "শীর্ষ দক্ষতা" : "Top Skills We Hire"}</Label>
              <div className="flex gap-2">
                <Input value={topSkillsInput} onChange={(e) => setTopSkillsInput(e.target.value)} placeholder={isBn ? "একটি স্কিল যোগ করুন..." : "Add a skill..."} onKeyDown={(e) => { if (e.key === "Enter" && topSkillsInput.trim()) { e.preventDefault(); setTopSkills([...topSkills, topSkillsInput.trim()]); setTopSkillsInput(""); } }} />
                <Button type="button" size="sm" variant="outline" onClick={() => { if (topSkillsInput.trim()) { setTopSkills([...topSkills, topSkillsInput.trim()]); setTopSkillsInput(""); } }}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => setTopSkills(topSkills.filter((_, idx) => idx !== i))}>
                    {skill} <span className="text-muted-foreground ml-0.5">&times;</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );
      case "hr":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={isBn ? "HR ম্যানেজারের নাম" : "HR Manager Name"}><Input value={hrName} onChange={(e) => setHrName(e.target.value)} /></Field>
              <Field label={isBn ? "HR যোগাযোগ নম্বর" : "HR Contact Number"}><Input value={hrPhone} onChange={(e) => setHrPhone(e.target.value)} /></Field>
              <Field label={isBn ? "HR ইমেইল" : "HR Email"}><Input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} /></Field>
            </div>
            <Field label={isBn ? "নিয়োগ নীতি" : "Recruitment Policy"}><Textarea value={recruitmentPolicy} onChange={(e) => setRecruitmentPolicy(e.target.value)} rows={3} /></Field>
            <Field label={isBn ? "নিয়োগ প্রক্রিয়া" : "Hiring Process Description"}><Textarea value={hiringProcess} onChange={(e) => setHiringProcess(e.target.value)} rows={3} /></Field>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Checkbox id="allowPosting" checked={allowJobPosting} onCheckedChange={(v) => setAllowJobPosting(!!v)} />
                <Label htmlFor="allowPosting" className="text-sm">{isBn ? "চাকরি পোস্টিং অনুমতি" : "Allow Job Posting"}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="featuredAllowed" checked={featuredAllowed} onCheckedChange={(v) => setFeaturedAllowed(!!v)} />
                <Label htmlFor="featuredAllowed" className="text-sm">{isBn ? "ফিচার্ড জব অনুমতি" : "Featured Job Allowed"}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="autoApproval" checked={autoApproval} onCheckedChange={(v) => setAutoApproval(!!v)} />
                <Label htmlFor="autoApproval" className="text-sm">{isBn ? "অটো অনুমোদন" : "Auto Approval"}</Label>
              </div>
              <Field label={isBn ? "মাসিক পোস্ট সীমা" : "Monthly Posting Limit"}>
                <Input type="number" value={postingLimit} onChange={(e) => setPostingLimit(e.target.value)} placeholder="Unlimited" />
              </Field>
            </div>
            <Field label={isBn ? "চাকরি মেয়াদ (দিন)" : "Job Expiry Duration (days)"}>
              <Input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} />
            </Field>
          </div>
        );
      case "verification":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { label: isBn ? "ট্রেড লাইসেন্স (ঐচ্ছিক)" : "Trade License (Optional)", file: tradeLicenseFile, setFile: setTradeLicenseFile, path: tradeLicensePath },
                { label: isBn ? "অনুমোদিত ব্যক্তির NID" : "NID of Authorized Person", file: nidFile, setFile: setNidFile, path: nidPath },
                { label: isBn ? "কোম্পানি নিবন্ধন সার্টিফিকেট" : "Company Registration Certificate", file: regCertFile, setFile: setRegCertFile, path: regCertPath },
              ].map((doc) => (
                <div key={doc.label} className="flex items-center gap-4 p-3 rounded-lg border">
                  <FileCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.label}</p>
                    {doc.path && !doc.file && <p className="text-xs text-green-600">Uploaded</p>}
                    {doc.file && <p className="text-xs text-muted-foreground">{doc.file.name}</p>}
                  </div>
                  <label>
                    <Button size="sm" variant={doc.path && !doc.file ? "outline" : "default"} asChild>
                      <span><Upload className="h-4 w-4 mr-1" /> {doc.path && !doc.file ? "Replace" : "Upload"}</span>
                    </Button>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) doc.setFile(f); }} />
                  </label>
                </div>
              ))}
            </div>
            <Field label={isBn ? "TIN নম্বর" : "Tax Identification Number (TIN)"}><Input value={tinNumber} onChange={(e) => setTinNumber(e.target.value)} /></Field>
          </div>
        );
      case "media":
        return (
          <div className="space-y-4">
            <Field label={isBn ? "কোম্পানি ভিডিও URL" : "Company Video URL"}><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="YouTube Channel"><Input value={youtubeChannel} onChange={(e) => setYoutubeChannel(e.target.value)} placeholder="https://youtube.com/@..." /></Field>
              <Field label="Instagram Profile"><Input value={instagramProfile} onChange={(e) => setInstagramProfile(e.target.value)} placeholder="https://instagram.com/..." /></Field>
            </div>
          </div>
        );
      case "social":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Facebook Page"><Input value={facebookPage} onChange={(e) => setFacebookPage(e.target.value)} placeholder="https://facebook.com/..." /></Field>
              <Field label="LinkedIn Page"><Input value={linkedinPage} onChange={(e) => setLinkedinPage(e.target.value)} placeholder="https://linkedin.com/company/..." /></Field>
            </div>
          </div>
        );
      case "stats":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: isBn ? "মোট চাকরি" : "Total Jobs", value: hookStats?.total_jobs || 0, color: "text-blue-600" },
                { label: isBn ? "সক্রিয়" : "Active", value: hookStats?.active_jobs || 0, color: "text-green-600" },
                { label: isBn ? "মোট আবেদন" : "Applications", value: hookStats?.total_applications || 0, color: "text-purple-600" },
                { label: isBn ? "শর্টলিস্ট" : "Shortlisted", value: hookStats?.shortlisted || 0, color: "text-amber-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case "team":
        return (
          <div className="space-y-4">
            {hrTeam.map((member, i) => (
              <div key={i} className="p-4 rounded-lg border space-y-3 relative">
                <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => removeHrMember(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name" required><Input value={member.name} onChange={(e) => updateHrMember(i, "name", e.target.value)} /></Field>
                  <Field label="Designation">
                    <Select value={member.designation} onValueChange={(v) => updateHrMember(i, "designation", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{HR_DESIGNATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Email"><Input type="email" value={member.email} onChange={(e) => updateHrMember(i, "email", e.target.value)} /></Field>
                  <Field label="Phone"><Input value={member.phone} onChange={(e) => updateHrMember(i, "phone", e.target.value)} /></Field>
                </div>
              </div>
            ))}
            {hrTeam.length === 0 && <p className="text-sm text-muted-foreground">{isBn ? "কোনো HR সদস্য যোগ করা হয়নি" : "No HR team members added"}</p>}
            <Button size="sm" variant="outline" onClick={addHrMember}><Plus className="h-4 w-4 mr-1" /> {isBn ? "সদস্য যোগ করুন" : "Add Member"}</Button>
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
          <h1 className="text-2xl font-bold">{isBn ? "কোম্পানি প্রোফাইল সম্পাদনা" : "Edit Company Profile"}</h1>
          {lastSyncedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {isBn ? "সর্বশেষ সিঙ্ক:" : "Last synced:"} {lastSyncedAt.toLocaleTimeString()}
            </p>
          )}
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
