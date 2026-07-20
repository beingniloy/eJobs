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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import {
  MapPin, Briefcase, GraduationCap, CheckCircle, Award, Globe, Code, Calendar,
  Eye, Users, ExternalLink, Edit3, Mail, Phone, LinkIcon, Star, Trophy,
  Shield, Zap, ArrowRight, FileText, Target, TrendingUp, Clock, Loader2,
  BriefcaseBusiness, Briefcase as LinkedinIcon, Globe as GithubIcon, Users as FacebookIcon,
  Upload, ChevronDown, Check, Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [cvResumes, setCvResumes] = useState<any[]>([]);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

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
      if (!profileData.avatar && d.user?.avatar) {
        profileData.avatar = d.user.avatar;
      }
      setProfile(profileData);
      setStats(d.stats || {});
      setApplications(d.applications || []);
      setActiveBadges(d.user?.profile?.active_badges || []);
      setCvData(cvRes.data?.data || {});
      setProfileViews(viewsRes.data?.data || []);
      setIsPublic(d.user?.profile?.is_public !== false);
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
    } catch { toast.error("Failed"); }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error(isBn ? "শুধুমাত্র PDF ফাইল আপলোড করুন" : "Only PDF files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isBn ? "ফাইলের সাইজ 2MB এর বেশি হতে পারে না" : "File size must be under 2MB");
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

  const handleSelectCvResume = async (uuid: string) => {
    try {
      const result: any = await resumeService.selectResume(uuid);
      const path = result?.resume_path || result?.data?.resume_path;
      if (path) setProfile((prev: any) => ({ ...prev, resume_path: path }));
      toast.success(isBn ? "রিজুমে নির্বাচিত হয়েছে" : "Resume selected");
      setResumeDialogOpen(false);
    } catch {
      toast.error(isBn ? "নির্বাচন ব্যর্থ হয়েছে" : "Selection failed");
    }
  };

  const EmptySection = ({ text }: { text: string }) => (
    <div className="text-center py-6 text-sm text-muted-foreground">
      <p>{text}</p>
      <Button variant="link" size="sm" className="mt-1 h-auto p-0" asChild>
        <Link href="/dashboard/profile">Add now</Link>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><Skeleton className="h-64 rounded-lg" /><Skeleton className="h-48 rounded-lg" /></div>
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
  const shortlistedCount = stats?.shortlisted || 0;
  const expectedSalary = p.expected_salary || "";
  const availability = p.availability_status || "Immediate";
  const experienceYears = p.experience_years || "";
  const profileStrength = p.profile_completion_percentage || 0;

  // Compute profile strength sections
  const strengthSections = [
    { label: "Basic Information", done: !!(fullName && phone && city) },
    { label: "Resume Added", done: !!(p.resume_path) },
    { label: "Skills Added", done: skills.length > 0 },
    { label: "Experience Added", done: experience.length > 0 },
    { label: "Education Added", done: education.length > 0 },
    { label: "Profile Photo", done: !!avatar },
  ];
  const strengthPercent = Math.round((strengthSections.filter((s) => s.done).length / strengthSections.length) * 100);

  const socialLinks = [
    linkedin && { icon: LinkedinIcon, href: linkedin, label: "LinkedIn" },
    github && { icon: GithubIcon, href: github, label: "GitHub" },
    facebook && { icon: FacebookIcon, href: facebook, label: "Facebook" },
    portfolio && { icon: LinkIcon, href: portfolio, label: "Portfolio" },
  ].filter(Boolean) as { icon: any; href: string; label: string }[];

  return (
    <div className="space-y-6">
      {/* ── Profile Header ── */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/company-bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <DefaultAvatar src={avatar} name={fullName || user.name} className="h-24 w-24 border-4 border-white/20 shadow-xl" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{fullName || user.name}</h1>
                {p.is_verified && <><CheckCircle className="h-5 w-5 text-green-400 fill-green-400/20" /><span className="text-xs text-green-400 font-medium">Verified</span></>}
                {activeBadges.some((b: any) => b.badge_key === "premium") && <Badge className="bg-yellow-500 text-white text-xs"><Zap className="h-3 w-3 mr-1" />Pro</Badge>}
              </div>
              {position && <p className="text-white/70 mt-1">{position}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/60">
                {city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{city}, Bangladesh</span>}
                {phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{phone}</span>}
                {email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{email}</span>}
              </div>
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {socialLinks.map((sl, i) => (
                    <a key={i} href={sl.href} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <sl.icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="border-white/40 dark:text-white text-foreground hover:bg-white/10" asChild>
                <Link href={`/profile/${user.username}`} target="_blank"><Eye className="h-4 w-4 mr-1" />Preview Profile</Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/dashboard/profile"><Edit3 className="h-4 w-4 mr-1" />Edit Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Briefcase, label: "Experience", value: experienceYears ? `${experienceYears}+ Years` : `${experience.length} Positions` },
          { icon: FileText, label: "Total Applications", value: String(applicationsCount) },
          { icon: Eye, label: "Profile Views", value: String(p.profile_views_count || profileViews.length || 0) },
          { icon: Award, label: "Endorsed", value: String(activeBadges.length) },
          { icon: TrendingUp, label: "Expected Salary", value: expectedSalary ? `${formatCurrency(Number(expectedSalary))}/month` : "Not set" },
          { icon: Clock, label: "Availability", value: availability || "Immediate" },
        ].map((s) => (
          <Card key={s.label} className="text-center p-3">
            <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-sm font-bold mt-0.5">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Earned Badges ── */}
      {activeBadges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" />Earned Badges ({activeBadges.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeGrid badges={activeBadges} size="md" />
          </CardContent>
        </Card>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content (left) */}
        <div className="lg:col-span-8 space-y-6">
          {/* About Me */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">About Me</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/dashboard/profile"><Edit3 className="h-3.5 w-3.5 mr-1" />Edit</Link></Button>
            </CardHeader>
            <CardContent>
              {bio ? <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p> : <EmptySection text="Add a bio to tell employers about yourself" />}
              {skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Key Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 8).map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                    {skills.length > 8 && <Badge variant="outline" className="text-xs">+{skills.length - 8} more</Badge>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" />Work Experience ({experience.length})</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/dashboard/profile">Add Experience</Link></Button>
            </CardHeader>
            <CardContent>
              {experience.length > 0 ? (
                <div className="space-y-4">
                  {experience.map((exp: any, i: number) => (
                    <div key={i} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-0">
                      <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary" />
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{exp.position || exp.job_title}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company || exp.company_name}</p>
                          {exp.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{exp.location}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {exp.start_date} - {exp.end_date || (exp.is_current ? "Present" : "")}
                        </span>
                      </div>
                      {exp.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : <EmptySection text="Add your work experience to stand out" />}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" />Education ({education.length})</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/dashboard/profile">Add Education</Link></Button>
            </CardHeader>
            <CardContent>
              {education.length > 0 ? (
                <div className="space-y-4">
                  {education.map((edu: any, i: number) => (
                    <div key={i} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-0">
                      <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary" />
                      <h4 className="font-semibold text-sm">{edu.degree || edu.degree_name || edu.level}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution || edu.school_name}</p>
                      {edu.field_of_study && <p className="text-xs text-muted-foreground">{edu.field_of_study}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {edu.start_date ? `${edu.start_date} - ` : ""}{edu.end_date || edu.graduation_year || ""}
                        {edu.gpa || edu.result ? ` | GPA: ${edu.gpa || edu.result}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : <EmptySection text="Add your educational background" />}
            </CardContent>
          </Card>

          {/* Projects */}
          {projects.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" />Projects ({projects.length})</CardTitle>
                <Button variant="ghost" size="sm" asChild><Link href="/dashboard/profile">Add Project</Link></Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.map((proj: any, i: number) => (
                    <Card key={i} className="p-3">
                      <h4 className="font-semibold text-sm">{proj.name || proj.project_name}</h4>
                      {proj.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>}
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.technologies.slice(0, 3).map((t: string, j: number) => <Badge key={j} variant="outline" className="text-[10px]">{t}</Badge>)}
                        </div>
                      )}
                      {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />View</a>}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" />Certifications ({certifications.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certifications.map((cert: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0"><Award className="h-5 w-5 text-primary" /></div>
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

          {/* Recent Applications */}
          {applications.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Recent Applications</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {applications.slice(0, 5).map((app: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{app.job?.title || "Job"}</p>
                        <p className="text-xs text-muted-foreground">{app.job?.company?.name || ""} {app.job?.location ? `- ${app.job.location}` : ""}</p>
                      </div>
                      <Badge variant={app.status === "shortlisted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="text-xs shrink-0 ml-2">
                        {app.status || "Applied"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (right) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Profile Strength */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Profile Strength</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - strengthPercent / 100)}`} className="text-primary" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-bold">{strengthPercent}%</span></div>
                </div>
              </div>
              <p className="text-center text-sm font-medium">{strengthPercent >= 80 ? "Excellent" : strengthPercent >= 50 ? "Good" : "Needs Improvement"}</p>
              <div className="space-y-1.5">
                {strengthSections.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle className={`h-3.5 w-3.5 ${s.done ? "text-green-500" : "text-muted-foreground/40"}`} />
                    <span className={s.done ? "" : "text-muted-foreground"}>{s.label}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild><Link href="/dashboard/profile">Improve Profile</Link></Button>
            </CardContent>
          </Card>

          {/* AI Profile Insights */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />AI Profile Insights</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{Math.min(100, strengthPercent + 10)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {strengthPercent >= 70 ? "Your profile matches well with many jobs" : "Complete your profile to improve job matches"}
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild><Link href="/dashboard/ai-match">Get AI Suggestions</Link></Button>
            </CardContent>
          </Card>

          {/* Top Skills */}
          {skills.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Top Skills</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {skills.slice(0, 8).map((skill: string, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{skill}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.max(50, 95 - i * 5)} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{Math.max(50, 95 - i * 5)}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Who Viewed My Profile */}
          {profileViews.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" />Who Viewed My Profile</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {profileViews.slice(0, 5).map((v: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{(v.company_name || "A")[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs">{v.company_name || "Anonymous"}</p>
                      <p className="text-[10px] text-muted-foreground">{v.timestamp || ""}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Job Preferences */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Job Preferences</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/dashboard/profile"><Edit3 className="h-3 w-3" /></Link></Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {p.current_profession && <div className="flex justify-between"><span className="text-muted-foreground">Preferred Role</span><span className="font-medium">{p.current_profession}</span></div>}
              {p.expected_job_category && <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{p.expected_job_category}</span></div>}
              {p.preferred_location && <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{p.preferred_location}</span></div>}
              {expectedSalary && <div className="flex justify-between"><span className="text-muted-foreground">Salary</span><span className="font-medium">{formatCurrency(Number(expectedSalary))}/mo</span></div>}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Type</span>
                <span className="font-medium">{p.available_remote ? "Remote/On-site" : "On-site"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Availability</span>
                <span className="font-medium">{availability || "Immediate"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />{isBn ? "রিজুমে" : "Resume"}</CardTitle></CardHeader>
            <CardContent>
              {p.resume_path ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user.name}_Resume.pdf</p>
                      <p className="text-[10px] text-muted-foreground">PDF</p>
                    </div>
                    <a href={p.resume_path.startsWith("cv/") ? `/${p.resume_path}` : `/storage/${p.resume_path}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></a>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setResumeDialogOpen(true)}>
                    <Upload className="h-3.5 w-3.5" /> {isBn ? "রিজুমে পরিবর্তন করুন" : "Change Resume"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">{isBn ? "কোনো রিজুমে আপলোড হয়নি" : "No resume uploaded"}</p>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setResumeDialogOpen(true)}>
                    <Upload className="h-3.5 w-3.5" /> {isBn ? "রিজুমে আপলোড করুন" : "Upload Resume"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume Picker Dialog */}
          <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isBn ? "রিজুমে নির্বাচন করুন" : "Select Resume"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Upload New */}
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
                        <p className="text-xs text-muted-foreground">{isBn ? "PDF ফাইল ড্র্যাগ করুন অথবা ক্লিক করুন" : "Drag PDF or click to browse"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Max 2MB</p>
                      </>
                    )}
                  </button>
                </div>

                {/* Existing CV Builder Resumes */}
                {cvResumes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{isBn ? "CV থেকে নির্বাচন করুন" : "Select from CV Builder"}</p>
                    <div className="space-y-1.5">
                      {cvResumes.map((resume: any) => {
                        const isActive = p.resume_path === `cv/share/${resume.uuid}`;
                        return (
                          <button
                            key={resume.uuid}
                            onClick={() => handleSelectCvResume(resume.uuid)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                              isActive ? "border-primary bg-primary/5" : "hover:border-primary/50"
                            }`}
                          >
                            <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{resume.title}</p>
                              <p className="text-[10px] text-muted-foreground">{resume.template_slug}</p>
                            </div>
                            {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button variant="link" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/resume">{isBn ? "রিজুমে ম্যানেজ করুন" : "Manage Resumes"} →</Link>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Profile Visibility */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Profile Visibility</p>
                <p className="text-xs text-muted-foreground">{isPublic ? "Your profile is visible to employers" : "Your profile is hidden from employers"}</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={toggleVisibility} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
