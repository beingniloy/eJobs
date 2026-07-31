"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import { formatCurrency } from "@/lib/utils";
import { resumeService } from "@/services/resume.service";
import { toast } from "sonner";

import ProfileHeader from "@/components/profile/overview/ProfileHeader";
import ProfileStatsBar from "@/components/profile/overview/ProfileStatsBar";
import ProfileAbout from "@/components/profile/overview/ProfileAbout";
import ProfileActivity from "@/components/profile/overview/ProfileActivity";
import ProfileStrength from "@/components/profile/overview/ProfileStrength";
import ProfileTimeline from "@/components/profile/overview/ProfileTimeline";
import ProfileSkills from "@/components/profile/overview/ProfileSkills";
import ProfileBadges from "@/components/profile/overview/ProfileBadges";
import ProfileProjects from "@/components/profile/overview/ProfileProjects";
import ProfileCertifications from "@/components/profile/overview/ProfileCertifications";
import ProfileLanguages from "@/components/profile/overview/ProfileLanguages";
import ProfileDocuments from "@/components/profile/overview/ProfileDocuments";
import ProfileBottomCards from "@/components/profile/overview/ProfileBottomCards";
import ProfileResumeDialog from "@/components/profile/overview/ProfileResumeDialog";
import ProfileViewers from "@/components/profile/overview/ProfileViewers";
import { Briefcase, GraduationCap, BookOpen } from "lucide-react";

export default function CandidateProfileOverviewClient() {
  const { user } = useAuth();
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [activeBadges, setActiveBadges] = useState<any[]>([]);
  const [cvData, setCvData] = useState<any>({});
  const [profileViews, setProfileViews] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, cvRes, viewsRes] = await Promise.all([
        api.get("/candidate/dashboard"),
        api.get("/candidate/cv-data"),
        api.get("/candidate/profile-views"),
      ]);
      const d = dashRes.data;
      const profileData = d.user?.profile || {};
      if (!profileData.avatar && d.user?.avatar) profileData.avatar = d.user.avatar;
      setProfile(profileData);
      setStats(d.stats || {});
      setApplications(d.applications || []);
      setActiveBadges(d.user?.profile?.active_badges || []);
      setCvData(cvRes.data?.data || {});
      setProfileViews(viewsRes.data?.data || []);
      setIsPublic(d.user?.profile?.is_public !== false);
      setDocuments(d.user?.profile?.documents || d.documents || []);
      setTrainings(d.user?.profile?.trainings || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const handler = () => load();
    window.addEventListener("candidate-profile-saved", handler);
    return () => window.removeEventListener("candidate-profile-saved", handler);
  }, [user, isBn]);

  const toggleVisibility = async (val: boolean) => {
    setIsPublic(val);
    try { await api.post("/candidate/profile-update", { is_public: val ? "1" : "0" }); toast.success(val ? "Profile made public" : "Profile made private"); } catch { toast.error("Failed"); }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error(isBn ? "শুধুমাত্র PDF ফাইল আপলোড করুন" : "Only PDF files are allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error(isBn ? "ফাইলের সাইজ 2MB এর বেশি হতে পারে না" : "File size must be under 2MB"); return; }
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const result = await resumeService.uploadResume(formData);
      setProfile((prev: any) => ({ ...prev, resume_path: result.resume_path }));
      toast.success(isBn ? "রিজুমে আপলোড হয়েছে" : "Resume uploaded successfully");
      setResumeDialogOpen(false);
    } catch { toast.error(isBn ? "আপলোড ব্যর্থ হয়েছে" : "Upload failed"); } finally { setUploadingResume(false); }
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto space-y-6">
        <div className="h-64 w-full rounded-xl bg-muted animate-pulse" />
        <div className="h-20 w-full rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const p = profile || {};
  const cv = cvData || {};
  const fullName = p.full_name_en || user.name || "";
  const skills = Array.isArray(p.skills) ? p.skills : [];
  const experience = Array.isArray(p.experience) ? p.experience : (Array.isArray(cv.experience) ? cv.experience : []);
  const education = Array.isArray(p.education) ? p.education : (Array.isArray(cv.education) ? cv.education : []);
  const projects = Array.isArray(p.projects) ? p.projects : (Array.isArray(cv.projects) ? cv.projects : []);
  const certifications = Array.isArray(p.certifications) ? p.certifications : [];
  const applicationsCount = stats?.applied || applications.length || 0;
  const bio = p.bio || p.career_objective || "";

  const strengthSections = [
    { label: "Basic Information", done: !!(fullName && p.phone && p.city) },
    { label: "Resume Added", done: !!(p.resume_path) },
    { label: "Skills Added", done: skills.length > 0 },
    { label: "Experience Added", done: experience.length > 0 },
    { label: "Education Added", done: education.length > 0 },
    { label: "Profile Photo", done: !!p.avatar },
    { label: "Contact Info", done: !!(p.district && p.division) },
    { label: "Languages", done: !!(p.language_proficiency?.length) },
    { label: "Certifications", done: certifications.length > 0 },
    { label: "Documents", done: !!(documents.length) },
  ];
  const strengthPercent = Math.round((strengthSections.filter((s) => s.done).length / strengthSections.length) * 100);

  const expItems = experience.map((e: any) => ({
    title: e.position || e.job_title,
    subtitle: e.company || e.company_name,
    location: e.location,
    startDate: e.start_date,
    endDate: e.end_date || (e.is_current ? "Present" : ""),
    description: e.description,
  }));

  const eduItems = education.map((e: any) => ({
    title: e.degree || e.degree_name || e.level,
    subtitle: e.institution || e.school_name,
    location: e.field_of_study,
    startDate: e.start_date,
    endDate: e.end_date || e.graduation_year || "",
    extra: e.gpa || e.result ? `GPA: ${e.gpa || e.result}` : undefined,
  }));

  const trainItems = trainings.map((t: any) => ({
    title: t.title,
    subtitle: t.institute_name || "",
    startDate: "",
    endDate: t.year ? `${t.year}` : "",
    extra: t.duration,
  }));

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <ProfileHeader profile={p} user={user} isPublic={isPublic} activeBadges={activeBadges} isBn={isBn} />

      <ProfileStatsBar applicationsCount={applicationsCount} profileViewsCount={p.profile_views_count || profileViews.length || 0} searchAppearances={stats?.search_appearances || 0} strengthPercent={strengthPercent} isBn={isBn} />

      <ProfileAbout bio={bio} isBn={isBn} />

      <ProfileActivity applications={applications} isBn={isBn} />

      <ProfileStrength strengthPercent={strengthPercent} sections={strengthSections} isBn={isBn} />

      <ProfileTimeline icon={Briefcase} title={isBn ? "কর্ম অভিজ্ঞতা" : "Experience"} items={expItems} editHref="/dashboard/profile" isBn={isBn} />

      <ProfileTimeline icon={GraduationCap} title={isBn ? "শিক্ষা" : "Education"} items={eduItems} editHref="/dashboard/profile" isBn={isBn} />

      <ProfileSkills skills={skills} isBn={isBn} />

      <ProfileBadges badges={activeBadges} isBn={isBn} />

      <ProfileProjects projects={projects} isBn={isBn} />

      <ProfileCertifications certifications={certifications} isBn={isBn} />

      <ProfileLanguages languages={p.language_proficiency || []} isBn={isBn} />

      <ProfileDocuments documents={documents} isBn={isBn} />

      <ProfileTimeline icon={BookOpen} title={isBn ? "প্রশিক্ষণ" : "Training"} items={trainItems} editHref="/dashboard/profile" isBn={isBn} />

      <ProfileBottomCards profile={p} user={user} isPublic={isPublic} isBn={isBn} onToggleVisibility={toggleVisibility} onResumeUpload={handleResumeUpload} onResumeDialogOpen={() => setResumeDialogOpen(true)} uploadingResume={uploadingResume} />

      <ProfileViewers views={profileViews} isBn={isBn} />

      <ProfileResumeDialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen} uploading={uploadingResume} onUpload={handleResumeUpload} isBn={isBn} />
    </div>
  );
}