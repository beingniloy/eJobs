"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import { formatCurrency } from "@/lib/utils";
import { resumeService } from "@/services/resume.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BadgeDisplay, { BadgeGrid } from "@/components/badges/BadgeDisplay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin, Briefcase, GraduationCap, CheckCircle, Award, Globe, Code, Calendar,
  Eye, ExternalLink, Edit3, Mail, Phone, LinkIcon, Star, Trophy,
  Shield, Zap, ArrowRight, FileText, Target, TrendingUp, Clock, Loader2,
  BriefcaseBusiness, Upload, Check, Copy, BookOpen, MessageSquare,
  Users, MoreHorizontal, Settings, Share2, ChevronDown, ChevronUp,
  Download, Plus,
} from "lucide-react";

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
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [expandedAbout, setExpandedAbout] = useState(false);

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

  const handleSelectCvResume = async (uuid: string) => {
    try {
      const result: any = await resumeService.selectResume(uuid);
      const path = result?.resume_path || result?.data?.resume_path;
      if (path) setProfile((prev: any) => ({ ...prev, resume_path: path }));
      toast.success(isBn ? "রিজুমে নির্বাচিত হয়েছে" : "Resume selected");
      setResumeDialogOpen(false);
    } catch { toast.error(isBn ? "নির্বাচন ব্যর্থ হয়েছে" : "Selection failed"); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><Skeleton className="h-48 rounded-lg" /><Skeleton className="h-48 rounded-lg" /></div>
          <div className="space-y-4"><Skeleton className="h-40 rounded-lg" /><Skeleton className="h-40 rounded-lg" /></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const p = profile || {};
  const cv = cvData || {};
  const fullName = p.full_name_en || user.name || "";
  const avatar = p.avatar || "";
  const position = p.current_position || "";
  const city = p.city || "";
  const phone = p.phone || "";
  const email = user.email || "";
  const bio = p.bio || p.career_objective || "";
  const linkedin = p.linkedin_url || "";
  const github = p.github_url || "";
  const facebook = p.facebook_url || "";
  const portfolio = p.portfolio_url || "";
  const skills = Array.isArray(p.skills) ? p.skills : [];
  const experience = Array.isArray(p.experience) ? p.experience : (Array.isArray(cv.experience) ? cv.experience : []);
  const education = Array.isArray(p.education) ? p.education : (Array.isArray(cv.education) ? cv.education : []);
  const projects = Array.isArray(p.projects) ? p.projects : (Array.isArray(cv.projects) ? cv.projects : []);
  const certifications = Array.isArray(p.certifications) ? p.certifications : [];
  const applicationsCount = stats?.applied || applications.length || 0;
  const expectedSalary = p.expected_salary || "";
  const availability = p.availability_status || "Immediate";
  const experienceYears = p.experience_years || "";

  const strengthSections = [
    { label: "Basic Information", done: !!(fullName && phone && city) },
    { label: "Resume Added", done: !!(p.resume_path) },
    { label: "Skills Added", done: skills.length > 0 },
    { label: "Experience Added", done: experience.length > 0 },
    { label: "Education Added", done: education.length > 0 },
    { label: "Profile Photo", done: !!avatar },
    { label: "Contact Info", done: !!(p.district && p.division) },
    { label: "Languages", done: !!(p.language_proficiency?.length) },
    { label: "Certifications", done: certifications.length > 0 },
    { label: "Documents", done: !!(documents.length) },
  ];
  const strengthPercent = Math.round((strengthSections.filter((s) => s.done).length / strengthSections.length) * 100);

  const socialLinks = [
    linkedin && { icon: Briefcase, href: linkedin, label: "LinkedIn" },
    github && { icon: Code, href: github, label: "GitHub" },
    facebook && { icon: Globe, href: facebook, label: "Facebook" },
    portfolio && { icon: LinkIcon, href: portfolio, label: "Portfolio" },
  ].filter(Boolean) as { icon: any; href: string; label: string }[];

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">

      {/* ═══ LINKEDIN-STYLE PROFILE HEADER ═══ */}
      <Card className="overflow-hidden border-0 shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-[200px] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
          {p.cover_photo && (
            <img
              src={p.cover_photo.startsWith("http") ? p.cover_photo : `/storage/${p.cover_photo}`}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
          {/* Public/Private Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant={isPublic ? "default" : "secondary"} className="gap-1.5 text-xs">
              {isPublic ? <Globe className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              {isPublic ? (isBn ? "পাবলিক" : "Public") : (isBn ? "প্রাইভেট" : "Private")}
            </Badge>
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="relative px-6 pb-6">
          {/* Avatar - overlaps cover */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-[60px]">
            <div className="relative">
              <DefaultAvatar
                src={avatar}
                name={fullName || user.name}
                className="h-[120px] w-[120px] border-4 border-background shadow-lg"
              />
              {activeBadges.some((b: any) => b.badge_key === "premium") && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{fullName || user.name}</h1>
                {p.is_verified && (
                  <Badge variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" /> {isBn ? "যাচাইকৃত" : "Verified"}
                  </Badge>
                )}
              </div>
              {position && <p className="text-muted-foreground text-sm">{position}</p>}
              {city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{city}, Bangladesh
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/${user.username}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />{isBn ? "প্রিভিউ" : "Preview"}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard/profile">
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />{isBn ? "এডিট" : "Edit"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══ LINKEDIN-STYLE STATS BAR ═══ */}
      <div className="flex items-center gap-4 px-2">
        {[
          { label: isBn ? "আবেদন" : "Applications", value: applicationsCount, icon: FileText },
          { label: isBn ? "ভিউ" : "Profile Views", value: p.profile_views_count || profileViews.length || 0, icon: Eye },
          { label: isBn ? "সার্চ উপস্থিতি" : "Search Appearances", value: stats?.search_appearances || 0, icon: TrendingUp },
          { label: isBn ? "প্রোফাইল শক্তি" : "Profile Strength", value: `${strengthPercent}%`, icon: Shield },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{s.value}</span>
            <span className="text-muted-foreground hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ═══ ABOUT ═══ */}
      {bio && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">{isBn ? "সম্পর্কে" : "About"}</h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/dashboard/profile"><Edit3 className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <p className={`text-sm text-muted-foreground leading-relaxed ${!expandedAbout && bio.length > 300 ? "line-clamp-4" : ""}`}>
              {bio}
            </p>
            {bio.length > 300 && (
              <button
                onClick={() => setExpandedAbout(!expandedAbout)}
                className="text-sm font-medium text-primary hover:underline mt-1 flex items-center gap-1"
              >
                {expandedAbout ? (isBn ? "কম দেখুন" : "Show less") : (isBn ? "আরও দেখুন" : "Show more")}
                {expandedAbout ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ ACTIVITY ═══ */}
      {applications.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{isBn ? "সাম্প্রতিক কার্যক্রম" : "Activity"}</h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/dashboard/applied-jobs">{isBn ? "সব দেখুন" : "See all"} <ArrowRight className="h-3.5 w-3.5 ml-0.5" /></Link>
              </Button>
            </div>
            <div className="space-y-3">
              {applications.slice(0, 3).map((app: any, i: number) => {
                const statusColors: Record<string, string> = {
                  pending: "bg-amber-100 text-amber-700",
                  shortlisted: "bg-emerald-100 text-emerald-700",
                  rejected: "bg-red-100 text-red-700",
                };
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{app.job?.title || "Job"}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.job?.company?.name || ""} {app.job?.location ? `· ${app.job.location}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ${(statusColors as any)[app.status] || ""}`}>
                      {app.status || "Applied"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ PROFILE STRENGTH ═══ */}
      {strengthPercent < 80 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold">{isBn ? "প্রোফাইল শক্তি" : "Profile Strength"}</h2>
              </div>
              <span className="text-2xl font-bold text-primary">{strengthPercent}%</span>
            </div>
            <Progress value={strengthPercent} className="h-2 mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {strengthSections.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {s.done ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href="/dashboard/profile">{isBn ? "প্রোফাইল উন্নত করুন" : "Complete Profile"}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ EXPERIENCE ═══ */}
      {experience.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                {isBn ? "কর্ম অভিজ্ঞতা" : "Experience"}
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/dashboard/profile"><Plus className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="space-y-0">
              {experience.map((exp: any, i: number) => (
                <div key={i} className="relative pl-8 pb-6 last:pb-0">
                  {/* Timeline dot & line */}
                  <div className="absolute left-0 top-1.5 w-[18px] flex flex-col items-center">
                    <div className="h-[18px] w-[18px] rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    {i < experience.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{exp.position || exp.job_title}</h3>
                    <p className="text-sm text-foreground">{exp.company || exp.company_name}</p>
                    {exp.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{exp.location}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {exp.start_date}{exp.end_date ? ` - ${exp.end_date}` : exp.is_current ? ` - ${isBn ? "বর্তমান" : "Present"}` : ""}
                    </p>
                    {exp.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ EDUCATION ═══ */}
      {education.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                {isBn ? "শিক্ষা" : "Education"}
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/dashboard/profile"><Plus className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="space-y-0">
              {education.map((edu: any, i: number) => (
                <div key={i} className="relative pl-8 pb-6 last:pb-0">
                  <div className="absolute left-0 top-1.5 w-[18px] flex flex-col items-center">
                    <div className="h-[18px] w-[18px] rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    {i < education.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{edu.degree || edu.degree_name || edu.level}</h3>
                    <p className="text-sm text-foreground">{edu.institution || edu.school_name}</p>
                    {edu.field_of_study && <p className="text-xs text-muted-foreground">{edu.field_of_study}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {edu.start_date ? `${edu.start_date} - ` : ""}{edu.end_date || edu.graduation_year || ""}
                      {edu.gpa || edu.result ? ` · GPA: ${edu.gpa || edu.result}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ SKILLS ═══ */}
      {skills.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                {isBn ? "দক্ষতা" : "Skills"}
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/dashboard/profile"><Plus className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 12).map((skill: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-sm px-3 py-1">{skill}</Badge>
              ))}
              {skills.length > 12 && (
                <Badge variant="outline" className="text-sm px-3 py-1">+{skills.length - 12} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ BADGES ═══ */}
      {activeBadges.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold">{isBn ? "অর্জিত ব্যাজ" : "Badges"}</h2>
            </div>
            <BadgeGrid badges={activeBadges} size="md" />
          </CardContent>
        </Card>
      )}

      {/* ═══ PROJECTS ═══ */}
      {projects.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Code className="h-5 w-5 text-muted-foreground" />
                {isBn ? "প্রকল্প" : "Projects"}
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/dashboard/profile"><Plus className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((proj: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-border/50 hover:border-border transition-colors">
                  <h4 className="font-semibold text-sm mb-1">{proj.name || proj.project_name}</h4>
                  {proj.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{proj.description}</p>}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {proj.technologies.slice(0, 3).map((t: string, j: number) => <Badge key={j} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  )}
                  {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />View</a>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ CERTIFICATIONS ═══ */}
      {certifications.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-muted-foreground" />
              {isBn ? "সার্টিফিকেশন" : "Certifications"}
            </h2>
            <div className="space-y-2">
              {certifications.map((cert: any, i: number) => (
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
          </CardContent>
        </Card>
      )}

      {/* ═══ LANGUAGES ═══ */}
      {p.language_proficiency && p.language_proficiency.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                {isBn ? "ভাষা" : "Languages"}
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/dashboard/profile"><Edit3 className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {p.language_proficiency.map((lang: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{lang.name || lang.language}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {[lang.read && "Read", lang.write && "Write", lang.speak && "Speak"].filter(Boolean).join(" · ") || lang.proficiency || ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ DOCUMENTS ═══ */}
      {documents.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              {isBn ? "ডকুমেন্ট" : "Documents"}
            </h2>
            <div className="space-y-2">
              {documents.map((doc: any, i: number) => {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://127.0.0.1:8000";
                const docUrl = doc.url || (doc.file_path ? `${API_BASE}/storage/${doc.file_path.replace(/^\/?storage\//, "")}` : "");
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.file_path || "");
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {isImage && docUrl ? <img src={docUrl} alt={doc.type} className="h-full w-full object-cover" /> : <FileText className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">{doc.type?.replace(/_/g, " ") || doc.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{doc.file_path?.split("/").pop() || ""}</p>
                    </div>
                    {docUrl && <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">View</a>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ TRAINING ═══ */}
      {trainings.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              {isBn ? "প্রশিক্ষণ" : "Training"}
            </h2>
            <div className="space-y-0">
              {trainings.map((training: any, i: number) => (
                <div key={i} className="relative pl-8 pb-4 last:pb-0">
                  <div className="absolute left-0 top-1.5 w-[18px] flex flex-col items-center">
                    <div className="h-[18px] w-[18px] rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    {i < trainings.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{training.title}</h3>
                    {training.institute_name && <p className="text-sm text-muted-foreground">{training.institute_name}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {training.duration && `${training.duration} `}{training.year && `(${training.year})`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ SIDEBAR-STYLE CARDS (below main content) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Job Preferences */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              {isBn ? "চাকরির পছন্দ" : "Job Preferences"}
            </h3>
            <div className="space-y-2 text-sm">
              {p.current_profession && <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "পছন্দের পদবি" : "Preferred Role"}</span><span className="font-medium">{p.current_profession}</span></div>}
              {p.expected_job_category && <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "ক্যাটাগরি" : "Category"}</span><span className="font-medium">{p.expected_job_category}</span></div>}
              {p.preferred_location && <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "লোকেশন" : "Location"}</span><span className="font-medium">{p.preferred_location}</span></div>}
              {expectedSalary && <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "বেতন" : "Salary"}</span><span className="font-medium">{formatCurrency(Number(expectedSalary))}/mo</span></div>}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isBn ? "কাজের ধরন" : "Work Type"}</span>
                <span className="font-medium">{p.available_remote ? "Remote/On-site" : "On-site"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isBn ? "উপলব্ধতা" : "Availability"}</span>
                <span className="font-medium">{availability || "Immediate"}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3 text-primary" asChild>
              <Link href="/dashboard/profile">{isBn ? "এডিট করুন" : "Edit preferences"}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Resume */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {isBn ? "রিজুমে" : "Resume"}
            </h3>
            {p.resume_path ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{user.name}_Resume.pdf</p>
                    <p className="text-[10px] text-muted-foreground">PDF</p>
                  </div>
                  <a href={p.resume_path.startsWith("cv/") ? `/${p.resume_path}` : `/storage/${p.resume_path}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setResumeDialogOpen(true)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> {isBn ? "পরিবর্তন করুন" : "Change Resume"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-3">{isBn ? "কোনো রিজুমে নেই" : "No resume uploaded"}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setResumeDialogOpen(true)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> {isBn ? "আপলোড করুন" : "Upload Resume"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ PROFILE VISIBILITY ═══ */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{isBn ? "প্রোফাইল দৃশ্যমানতা" : "Profile Visibility"}</p>
              <p className="text-xs text-muted-foreground">{isPublic ? (isBn ? "নিয়োগকর্তাদের কাছে দৃশ্যমান" : "Visible to employers") : (isBn ? "নিয়োগকর্তাদের কাছে লুকানো" : "Hidden from employers")}</p>
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={toggleVisibility} />
        </CardContent>
      </Card>

      {/* ═══ WHO VIEWED ═══ */}
      {profileViews.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {isBn ? "কে দেখেছে" : "Who Viewed Your Profile"}
            </h3>
            <div className="space-y-2">
              {profileViews.slice(0, 5).map((v: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{(v.company_name || "A")[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-xs">{v.company_name || "Anonymous"}</p>
                    <p className="text-[10px] text-muted-foreground">{v.timestamp || ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ RESUME PICKER DIALOG ═══ */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isBn ? "রিজুমে নির্বাচন করুন" : "Select Resume"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{isBn ? "নতুন আপলোড করুন" : "Upload New"}</p>
              <input ref={resumeInputRef} type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors text-center"
              >
                {uploadingResume ? (
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">{isBn ? "PDF ফাইল" : "Drag PDF or click to browse"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Max 2MB</p>
                  </>
                )}
              </button>
            </div>
            <Button variant="link" size="sm" className="w-full" asChild>
              <Link href="/dashboard/resume">{isBn ? "রিজুমে ম্যানেজ করুন" : "Manage Resumes"} →</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}