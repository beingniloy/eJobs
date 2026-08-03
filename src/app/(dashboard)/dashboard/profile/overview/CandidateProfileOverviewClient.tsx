"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import { resumeService } from "@/services/resume.service";
import { toast } from "sonner";
import { Briefcase, GraduationCap, BookOpen, Code, Loader2, Edit3, ArrowRight, Plus, Award } from "lucide-react";

import ProfileHeader from "@/components/profile/overview/ProfileHeader";
import ProfileStatsBar from "@/components/profile/overview/ProfileStatsBar";
import ProfileAbout from "@/components/profile/overview/ProfileAbout";
import ProfileStrengthWidget from "@/components/profile/overview/ProfileStrengthWidget";
import ProfileTimeline from "@/components/profile/overview/ProfileTimeline";
import ProfileSkills from "@/components/profile/overview/ProfileSkills";
import ProfileProjects from "@/components/profile/overview/ProfileProjects";
import ProfileBadges from "@/components/profile/overview/ProfileBadges";
import ProfileCertifications from "@/components/profile/overview/ProfileCertifications";
import ProfileLanguages from "@/components/profile/overview/ProfileLanguages";
import ProfileDocuments from "@/components/profile/overview/ProfileDocuments";
import ProfileBottomCards from "@/components/profile/overview/ProfileBottomCards";
import ProfileResumeDialog from "@/components/profile/overview/ProfileResumeDialog";
import ProfileViewers from "@/components/profile/overview/ProfileViewers";
import AiProfileInsightsCard from "@/components/profile/overview/AiProfileInsightsCard";
import ProfileTopSkills from "@/components/profile/overview/ProfileTopSkills";
import ProfileRecentActivities from "@/components/profile/overview/ProfileRecentActivities";
import ProfileJobPreferences from "@/components/profile/overview/ProfileJobPreferences";
import ProfileVisibilityCard from "@/components/profile/overview/ProfileVisibilityCard";

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
    } finally {
      setLoading(false);
    }
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
    try {
      await api.post("/candidate/profile-update", { is_public: val ? "1" : "0" });
      toast.success(val ? "Profile made public" : "Profile made private");
    } catch {
      toast.error("Failed");
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error(isBn ? "শুধুমাত্র PDF ফাইল অনুমোদিত" : "Only PDF files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isBn ? "ফাইলের সাইজ 2MB এর কম হতে হবে" : "File must be under 2MB");
      return;
    }
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const result = await resumeService.uploadResume(formData);
      setProfile((prev: any) => ({ ...prev, resume_path: result.resume_path }));
      toast.success(isBn ? "রিজুমে আপলোড হয়েছে" : "Resume uploaded successfully");
      setResumeDialogOpen(false);
    } catch {
      toast.error(isBn ? "আপলোড ব্যর্থ হয়েছে" : "Upload failed");
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6">
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
  const resumePath = p.resume_path || p.resume || null;
  const matchScore = p.match_score || stats?.match_score || 0;

  // Profile strength calculation
  const strengthSections = [
    { label: isBn ? "মৌলিক তথ্য" : "Basic Information", done: !!(fullName && p.phone && p.city) },
    { label: isBn ? "রিজুমে যোগ" : "Resume Added", done: !!resumePath },
    { label: isBn ? "স্কিল যোগ" : "Skills Added", done: skills.length > 0 },
    { label: isBn ? "অভিজ্ঞতা যোগ" : "Experience Added", done: experience.length > 0 },
    { label: isBn ? "শিক্ষা যোগ" : "Education Added", done: education.length > 0 },
    { label: isBn ? "প্রোফাইল ফটো" : "Profile Photo", done: !!p.avatar },
  ];
  const strengthPercent = Math.round((strengthSections.filter((s) => s.done).length / strengthSections.length) * 100);

  const expItems = experience.map((e: any) => ({
    title: e.position || e.job_title,
    subtitle: e.company || e.company_name,
    location: e.location,
    startDate: e.start_date,
    endDate: e.end_date || (e.is_current ? "Present" : ""),
    description: e.description,
    is_current: e.is_current,
  }));

  const eduItems = education.map((e: any) => ({
    title: e.degree || e.degree_name || e.level,
    subtitle: e.institution || e.school_name,
    location: e.field_of_study,
    startDate: e.start_date,
    endDate: e.end_date || e.graduation_year || "",
    extra: e.gpa || e.result ? `GPA: ${e.gpa || e.result}` : undefined,
  }));

  const projItems = projects.map((proj: any) => ({
    title: proj.name || proj.project_name,
    technologies: proj.technologies || [],
    url: proj.url,
    description: proj.description,
  }));

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* ═══ Header Banner ═══ */}
      <ProfileHeader profile={p} user={user} isPublic={isPublic} activeBadges={activeBadges} isBn={isBn} />

      {/* ═══ Stats Bar ═══ */}
      <ProfileStatsBar applicationsCount={applicationsCount} profileViewsCount={p.profile_views_count || profileViews.length || 0} searchAppearances={stats?.search_appearances || 0} strengthPercent={strengthPercent} isBn={isBn} profile={p} />

      {/* ═══ Main 2-Column Layout ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left Column (2/3) ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* About Me */}
          <ProfileAbout bio={bio} isBn={isBn} />

          {/* Work Experience */}
          <ProfileTimeline
            icon={Briefcase}
            title={isBn ? "কর্ম অভিজ্ঞতা" : "Work Experience"}
            items={expItems}
            editHref="/dashboard/profile"
            isBn={isBn}
          />

          {/* Education + Projects row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileTimeline
              icon={GraduationCap}
              title={isBn ? "শিক্ষা" : "Education"}
              items={eduItems}
              editHref="/dashboard/profile"
              isBn={isBn}
            />

            {projItems.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Code className="h-5 w-5 text-muted-foreground" />
                      {isBn ? "প্রকল্প" : `Projects (${projItems.length})`}
                    </h2>
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                      <Link href="/dashboard/profile">
                        <Plus className="h-3.5 w-3.5" /> {isBn ? "যোগ" : "Add Project"}
                      </Link>
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {projItems.slice(0, 4).map((proj: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm">{proj.title}</h4>
                          {proj.url && (
                            <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                            </a>
                          )}
                        </div>
                        {proj.description && <p className="text-xs text-muted-foreground line-clamp-2">{proj.description}</p>}
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.technologies.slice(0, 3).map((t: string, j: number) => (
                              <span key={j} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {projItems.length > 4 && (
                    <Button variant="link" size="sm" className="w-full mt-2 text-xs">
                      {isBn ? "সব প্রকল্প দেখুন" : "View All Projects"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Certifications */}
          {certifications.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    {isBn ? "সার্টিফিকেশন" : `Certifications (${certifications.length})`}
                  </h2>
                  <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                    <Link href="/dashboard/skill-center/certificates">
                      {isBn ? "যোগ করুন" : "Add New"}
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {certifications.slice(0, 3).map((cert: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cert.name || cert.title}</p>
                        <p className="text-xs text-muted-foreground">{cert.issuer || cert.organization} {cert.year ? `(${cert.year})` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {certifications.length > 3 && (
                  <Button variant="link" size="sm" className="w-full mt-2 text-xs">
                    {isBn ? "সব সার্টিফিকেট দেখুন" : "View All Certifications"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Activities */}
          <ProfileRecentActivities applications={applications} profileViews={profileViews} isBn={isBn} />

          {/* Job Preferences */}
          <ProfileJobPreferences profile={p} isBn={isBn} />

          {/* Resume + Visibility Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-3">{isBn ? "রিজুমে" : "Resume"}</h2>
                {resumePath ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name?.replace(/\s+/g, "_")}_Resume.pdf</p>
                        <p className="text-[10px] text-muted-foreground">PDF</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setResumeDialogOpen(true)}>
                      {isBn ? "পরিবর্তন করুন" : "Update Resume"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground mb-3">{isBn ? "কোনো রিজুমে নেই" : "No resume uploaded"}</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setResumeDialogOpen(true)}>
                      {isBn ? "আপলোড করুন" : "Upload Resume"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Visibility */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-3">{isBn ? "প্রোফাইল দৃশ্যমানতা" : "Profile Visibility"}</h2>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">
                      {isPublic ? (isBn ? "সার্বজনীন" : "Visible") : (isBn ? "গোপনীয়" : "Private")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isPublic ? (isBn ? "নিয়োগকর্তাদের কাছে দৃশ্যমান" : "Your profile is visible to employers") : (isBn ? "নিয়োগকর্তাদের কাছে লুকানো" : "Your profile is hidden from employers")}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleVisibility(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <Button variant="link" size="sm" className="mt-3 text-xs">
                  {isBn ? "প্রোফাইল লুকান" : "Make profile private"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── Right Column (1/3) ─── */}
        <div className="space-y-4">
          {/* AI Profile Insights */}
          <AiProfileInsightsCard matchScore={matchScore} profileStrength={strengthPercent} skills={skills} isBn={isBn} />

          {/* Top Skills */}
          <ProfileTopSkills skills={skills} isBn={isBn} />

          {/* Badges */}
          <ProfileBadges badges={activeBadges} isBn={isBn} />

          {/* Profile Strength */}
          <ProfileStrengthWidget strengthPercent={strengthPercent} sections={strengthSections} isBn={isBn} />

          {/* Who Viewed My Profile */}
          <ProfileViewers views={profileViews} isBn={isBn} />
        </div>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <ProfileQuickActions isBn={isBn} />

      {/* Resume Upload Dialog */}
      <ProfileResumeDialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen} uploading={uploadingResume} onUpload={handleResumeUpload} isBn={isBn} />
    </div>
  );
}