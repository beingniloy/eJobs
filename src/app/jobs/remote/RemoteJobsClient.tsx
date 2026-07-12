"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DefaultAvatar, CompanyLogo } from "@/components/ui/default-avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Globe, Calendar, Tag, Send, ChevronLeft, ChevronRight,
  Briefcase, Upload, X, Sparkles, Loader2, Wallet, FileText,
  CheckCircle2, Star, Clock, Shield, MapPin, Users, TrendingUp,
  CreditCard, ArrowRight, ChevronDown, ChevronUp, Zap, Target,
  Eye, Bookmark, MessageSquare, ShieldCheck, Banknote, Award,
  Building2, ExternalLink, Lock, IndianRupee,
} from "lucide-react";
import { formatCurrency, formatDate, truncate, stripHtml } from "@/lib/utils";
import { aiService } from "@/services/ai.service";
import { subscriptionService, type QuotaInfo } from "@/services/subscription.service";
import type { Job } from "@/types";

// ── How It Works steps ──
const HOW_IT_WORKS = [
  { step: 1, icon: Search, text: "Company Remotely কাজ পোস্ট করে" },
  { step: 2, icon: Users, text: "Company প্রয়োজনীয় তথ্য দেখায়" },
  { step: 3, icon: Send, text: "Candidates Apply করে" },
  { step: 4, icon: MessageSquare, text: "Company Candidate দেখে ও শুরু করে" },
  { step: 5, icon: CheckCircle2, text: "Company কাজ রিভিউ করে" },
  { step: 6, icon: CreditCard, text: "Payment Release হয়" },
  { step: 7, icon: Star, text: "জববাজার রিভিউ দেয়" },
];

const BUDGET_RANGES = [
  { label: "All Budget", min: "", max: "" },
  { label: "৳ 0 - ৳5,000", min: "0", max: "5000" },
  { label: "৳5,001 - ৳15,000", min: "5001", max: "15000" },
  { label: "৳15,001 - ৳30,000", min: "15001", max: "30000" },
  { label: "৳30,001 - ৳60,000+", min: "30001", max: "60000" },
];

const EXPERIENCE_LEVELS = ["All Levels", "Entry Level", "1 - 2 Years", "3 - 5 Years", "5+ Years"];
const PROJECT_DURATIONS = ["Any Duration", "< 1 Week", "1 - 4 Weeks", "1 - 3 Months", "> 3 Months"];
const JOB_TYPES_FILTER = ["All Types", "Fixed Price", "Hourly", "Long Term", "Short Term"];

export default function RemoteJobsClient() {
  const { isAuthenticated, user } = useAuth();
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [platformStats, setPlatformStats] = useState({ total_jobs: 0, remote_jobs: 0, total_companies: 0, total_candidates: 0, total_applications: 0, avg_salary: 0 });
  const [topSkills, setTopSkills] = useState<{ skill: string; count: number }[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<any[]>([]);

  // Sidebar filters
  const [selectedJobType, setSelectedJobType] = useState("All Types");
  const [selectedExperience, setSelectedExperience] = useState("All Levels");
  const [selectedBudget, setSelectedBudget] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState("Any Duration");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Sidebar collapse (persisted in localStorage)
  const [leftOpen, setLeftOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("remote-jobs-left-open");
    return v !== null ? v === "true" : true;
  });
  const [rightOpen, setRightOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("remote-jobs-right-open");
    return v !== null ? v === "true" : true;
  });

  useEffect(() => { localStorage.setItem("remote-jobs-left-open", String(leftOpen)); }, [leftOpen]);
  useEffect(() => { localStorage.setItem("remote-jobs-right-open", String(rightOpen)); }, [rightOpen]);

  // Remote workers
  const [workers, setWorkers] = useState<any[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workerPage, setWorkerPage] = useState(1);
  const [workerTotalPages, setWorkerTotalPages] = useState(1);
  const WORKERS_PER_PAGE = 10;

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFromProfile, setResumeFromProfile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);

  // Credits
  const [quotas, setQuotas] = useState<Record<string, QuotaInfo>>({});

  useEffect(() => {
    if (!isAuthenticated) return;
    subscriptionService.getMySubscriptionWithQuotas().then((result) => setQuotas(result.quotas)).catch(() => { /* handled */ });
  }, [isAuthenticated]);

  const aiQuota = quotas.ai_cover_letters;
  const aiLimitReached = aiQuota && aiQuota.max_limit > 0 && aiQuota.remaining <= 0;

  useEffect(() => {
    if (user?.profile?.resume_path) {
      setResumeFromProfile(user.profile.resume_path);
    }
  }, [user]);

  const fetchJobs = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      if (searchQuery) params.append("search", searchQuery);
      if (category && category !== "all") params.append("category", category);
      if (budgetMin) params.append("budget_min", budgetMin);
      if (budgetMax) params.append("budget_max", budgetMax);
      if (selectedExperience && selectedExperience !== "All Levels") params.append("experience_level", selectedExperience);
      if (selectedDuration && selectedDuration !== "Any Duration") params.append("project_duration", selectedDuration);
      if (selectedSkills.length > 0) params.append("skills", selectedSkills.join(","));
      if (sortBy) params.append("sort", sortBy);

      const res = await api.get(`/jobs/remote?${params.toString()}`);
      const payload = res.data.data;

      if (Array.isArray(payload)) {
        setJobs(payload);
        setTotalPages(1);
        setTotalJobs(payload.length);
      } else if (payload?.data) {
        setJobs(payload.data);
        setTotalPages(payload.last_page || 1);
        setTotalJobs(payload.total || 0);
      } else {
        setJobs([]);
        setTotalPages(1);
        setTotalJobs(0);
      }
    } catch {
      toast.error(isBn ? "চাকরি লোড করতে ব্যর্থ" : "Failed to load remote jobs");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, budgetMin, budgetMax, selectedExperience, selectedDuration, selectedSkills, sortBy, isBn]);

  useEffect(() => { fetchJobs(currentPage); }, [currentPage, fetchJobs]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedExperience, selectedDuration, selectedSkills, sortBy, category]);

  useEffect(() => {
    api.get("/categories").then((res) => {
      const cats = (res.data?.data || []).filter((c: any) => c.is_remote).map((c: any) => ({
        value: c.id.toString(),
        label: c.name_en || c.name,
        count: c.jobs_count || 0,
      }));
      setCategories(cats);
    }).catch(() => { /* handled */ });
    api.get("/jobs/stats").then((res: any) => setPlatformStats(res.data || res)).catch(() => { /* handled */ });
    api.get("/jobs/popular-skills").then((res: any) => setTopSkills(res.data || res)).catch(() => { /* handled */ });
    api.get("/companies/featured").then((res: any) => setFeaturedCompanies((res.data || res).slice(0, 8))).catch(() => { /* handled */ });
    fetchWorkers(1);
  }, []);

  const fetchWorkers = async (page: number) => {
    setWorkersLoading(true);
    try {
      const res = await api.get(`/candidates/public?page=${page}&per_page=${WORKERS_PER_PAGE}&available_remote=true`);
      const payload = res.data.data;
      if (Array.isArray(payload)) {
        setWorkers(payload);
        setWorkerTotalPages(1);
      } else if (payload?.data) {
        setWorkers(payload.data);
        setWorkerTotalPages(payload.last_page || 1);
      }
    } catch { /* handled */ }
    finally { setWorkersLoading(false); }
  };

  const handleSearch = () => { setCurrentPage(1); };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const handleGenerateCoverLetter = async () => {
    if (!selectedJob) return;
    if (aiLimitReached) { toast.error(isBn ? "AI কোয়োটা শেষ হয়েছে" : "AI quota reached. Please upgrade your plan."); return; }
    setGeneratingCover(true);
    try {
      const res = await aiService.generateCoverLetter({ job_title: selectedJob.title, company_name: typeof selectedJob.company === "object" ? selectedJob.company?.name || "" : "" });
      if (res.cover_letter) { setCoverLetter(res.cover_letter); toast.success(isBn ? "কভার লেটার তৈরি হয়েছে!" : "Cover letter generated!"); subscriptionService.getMySubscriptionWithQuotas().then((r) => setQuotas(r.quotas)).catch(() => { /* handled */ }); }
    } catch { toast.error(isBn ? "কভার লেটার তৈরি করতে ব্যর্থ" : "Failed to generate cover letter"); } finally { setGeneratingCover(false); }
  };

  const handleApply = (job: Job) => {
    if (!isAuthenticated) { toast.error(isBn ? "লগইন করুন" : "Please login first"); return; }
    setSelectedJob(job); setCoverLetter(""); setDeliveryDays(""); setResumeFile(null); setApplyDialogOpen(true);
  };

  const submitApplication = async () => {
    if (!selectedJob) return;
    if (!coverLetter.trim()) { toast.error(isBn ? "কভার লেটার লিখুন" : "Please write a cover letter"); return; }
    if (!deliveryDays || Number(deliveryDays) < 1) { toast.error(isBn ? "ডেলিভারি দিন লিখুন" : "Please enter delivery days"); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("cover_letter", coverLetter);
      formData.append("delivery_days", deliveryDays);
      if (resumeFile) formData.append("resume", resumeFile);
      await api.post(`/candidate/jobs/${selectedJob.id}/apply`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(isBn ? "সফলভাবে আবেদন করা হয়েছে!" : "Application submitted successfully!");
      setApplyDialogOpen(false); setSelectedJob(null); setCoverLetter(""); setDeliveryDays(""); setResumeFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isBn ? "আবেদন করতে ব্যর্থ" : "Failed to submit application"));
    } finally { setSubmitting(false); }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "fixed" && job.job_type !== "fixed_price") return false;
    if (activeTab === "hourly" && job.job_type !== "hourly") return false;
    return true;
  });

  const allCats = [{ value: "all", label: isBn ? "সব ক্যাটাগরি" : "All Categories", count: totalJobs }, ...categories];

  return (
    <PublicLayout>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-600">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-white space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Secure — {siteName} Protected
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {isBn ? "রিমোট কাজ, নিরাপদ পেমেন্ট" : "Remote Work, Secure Payment"}
              </h1>
              <p className="text-white/80 text-lg">
                {isBn ? "যেকোনো জায়গা থেকে কাজ করুন, নিরাপদে বেতন পান" : "Work from anywhere, get paid safely"}
              </p>
              <p className="text-white/60 text-sm">
                {isBn ? "কোম্পানি বিএন হাজার হাজার টাকা টাকা কাজ করুন এবং রিমোট থেকে অর্থনৈতিক সুবিধা পান" : "Company Bn thousands of taka work and benefit financially from remote"}
              </p>

              {/* Search Bar */}
              <div className="bg-white text-foreground rounded-xl p-2 flex flex-col sm:flex-row gap-2 shadow-lg max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
<Input
                      placeholder={isBn ? "চাকরি খুঁজুন..." : "Search job title or keywords..."}
                      className="pl-10 h-11 border-0 bg-transparent text-gray-900 dark:text-gray-900"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <Select value={category} onValueChange={(val) => { setCategory(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full sm:w-40 h-11 border-0 bg-muted/50"><SelectValue placeholder={isBn ? "ক্যাটাগরি" : "All Categories"} /></SelectTrigger>
                  <SelectContent>
                    {allCats.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-40 h-11 border-0 bg-muted/50"><SelectValue placeholder={isBn ? "অভিজ্ঞতা" : "All Experience"} /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((l) => <SelectItem key={l} value={l.toLowerCase().replace(/\s+/g, "-")}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white">
                  <Search className="h-4 w-4 mr-1" /> {isBn ? "খুঁজুন" : "Search Jobs"}
                </Button>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="hidden lg:flex justify-end">
              <div className="relative w-80 h-64">
                <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm" />
                <div className="absolute inset-4 flex items-center justify-center">
                  <div className="text-center text-white/80">
                    <Globe className="h-16 w-16 mx-auto mb-2 text-white/60" />
                    <p className="text-sm font-medium">{isBn ? "বিশ্বব্যাপী রিমোট কাজ" : "Global Remote Jobs"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORY TABS ═══════════ */}
      <div className="border-b bg-white dark:bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {(showAllCategories ? allCats : allCats.slice(0, 6)).map((c) => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === c.value ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
                {c.count != null && <span className="text-xs opacity-70">{c.count.toLocaleString()}</span>}
              </button>
            ))}
            {allCats.length > 6 && (
              <button onClick={() => setShowAllCategories(!showAllCategories)} className="flex items-center gap-1 px-3 py-2 text-sm text-primary">
                {showAllCategories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAllCategories ? "Less" : "More"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ STATS BAR ═══════════ */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { icon: Globe, label: "Total Remote Jobs", value: platformStats.remote_jobs || platformStats.total_jobs || 0 },
              { icon: Target, label: "Active Projects", value: platformStats.total_applications || 0 },
              { icon: Banknote, label: "Avg Salary", value: platformStats.avg_salary ? `৳${Number(platformStats.avg_salary).toLocaleString()}` : "৳0" },
              { icon: Users, label: "Freelancers", value: platformStats.total_candidates || 0 },
              { icon: ShieldCheck, label: "Payment Protected", value: "100%" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN 3-COLUMN ═══════════ */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[var(--left)_1fr_var(--right)] lg:gap-6"
          style={{ '--left': leftOpen ? '240px' : '36px', '--right': rightOpen ? '280px' : '36px' } as React.CSSProperties}>

          {/* ── LEFT SIDEBAR: Refine Search ── */}
          <aside className="space-y-6 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setLeftOpen(!leftOpen)} className="shrink-0 h-6 w-6 rounded hover:bg-muted flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" title={leftOpen ? (isBn ? "সঙ্কুচিত" : "Collapse") : (isBn ? "প্রসারিত" : "Expand")}>
                  {leftOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {leftOpen && <h3 className="font-semibold text-sm whitespace-nowrap">{isBn ? "ফিল্টার" : "Refine Search"}</h3>}
              </div>
              {leftOpen && <button onClick={() => { setSelectedJobType("All Types"); setSelectedExperience("All Levels"); setSelectedBudget(0); setSelectedDuration("Any Duration"); setSelectedSkills([]); setBudgetMin(""); setBudgetMax(""); setCurrentPage(1); }} className="shrink-0 text-xs text-primary hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {isBn ? "সব মুছুন" : "Clear All"}
              </button>}
            </div>

            {leftOpen && (
              <>
                {/* Job Type */}
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">{isBn ? "চাকরির ধরন" : "Job Type"}</p>
                  <div className="space-y-1">
                    {JOB_TYPES_FILTER.map((t) => (
                      <button key={t} onClick={() => setSelectedJobType(t)} className={`flex items-center gap-2 w-full text-sm cursor-pointer transition-colors ${selectedJobType === t ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedJobType === t ? 'border-primary' : 'border-muted-foreground/30'}`}>
                          {selectedJobType === t && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Experience Level */}
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">{isBn ? "অভিজ্ঞতা" : "Experience Level"}</p>
                  <div className="space-y-1">
                    {EXPERIENCE_LEVELS.map((l) => (
                      <button key={l} onClick={() => setSelectedExperience(l)} className={`flex items-center gap-2 w-full text-sm cursor-pointer transition-colors ${selectedExperience === l ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedExperience === l ? 'border-primary' : 'border-muted-foreground/30'}`}>
                          {selectedExperience === l && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Budget Range */}
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">{isBn ? "বাজেট" : "Budget Range (৳)"}</p>
                  <div className="space-y-1">
                    {BUDGET_RANGES.map((b, i) => (
                      <button key={i} onClick={() => { setSelectedBudget(i); setBudgetMin(b.min); setBudgetMax(b.max); setCurrentPage(1); }} className={`flex items-center gap-2 w-full text-sm cursor-pointer transition-colors ${selectedBudget === i ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedBudget === i ? 'border-primary' : 'border-muted-foreground/30'}`}>
                          {selectedBudget === i && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input type="number" placeholder="Min" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="h-8 text-xs" />
                    <Input type="number" placeholder="Max" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>

                <Separator />

                {/* Project Duration */}
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">{isBn ? "সময়কাল" : "Project Duration"}</p>
                  <div className="space-y-1">
                    {PROJECT_DURATIONS.map((d) => (
                      <button key={d} onClick={() => setSelectedDuration(d)} className={`flex items-center gap-2 w-full text-sm cursor-pointer transition-colors ${selectedDuration === d ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedDuration === d ? 'border-primary' : 'border-muted-foreground/30'}`}>
                          {selectedDuration === d && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Skills */}
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">{isBn ? "দক্ষতা" : "Skills"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(showAllSkills ? topSkills : topSkills.slice(0, 5)).map((s) => (
                      <button key={s.skill} onClick={() => toggleSkill(s.skill)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selectedSkills.includes(s.skill) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground hover:border-primary"}`}>
                        {s.skill}
                      </button>
                    ))}
                    {topSkills.length > 5 && (
                      <button onClick={() => setShowAllSkills(!showAllSkills)} className="px-2.5 py-1 text-xs text-primary">
                        {showAllSkills ? "- Less" : "+ More"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </aside>

          {/* ── CENTER: Job Listings ── */}
          <main className="space-y-4">
            {/* Mobile sidebar toggles */}
            <div className="flex gap-2 lg:hidden">
              <Button variant="outline" size="sm" onClick={() => setLeftOpen(!leftOpen)} className="flex-1 text-xs">
                {leftOpen ? <ChevronLeft className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
                {leftOpen ? (isBn ? "ফিল্টার লুকান" : "Hide Filters") : (isBn ? "ফিল্টার দেখান" : "Show Filters")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRightOpen(!rightOpen)} className="flex-1 text-xs">
                {rightOpen ? <ChevronRight className="h-3.5 w-3.5 mr-1" /> : <ChevronLeft className="h-3.5 w-3.5 mr-1" />}
                {rightOpen ? (isBn ? "সাইডবার লুকান" : "Hide Sidebar") : (isBn ? "সাইডবার দেখান" : "Show Sidebar")}
              </Button>
            </div>
            {/* Tabs & Sort */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                {[
                  { key: "all", label: `All Jobs (${totalJobs})` },
                  { key: "fixed", label: `Fixed Price (${jobs.filter((j) => j.job_type === "fixed_price").length || 0})` },
                  { key: "hourly", label: `Hourly (${jobs.filter((j) => j.job_type === "hourly").length || 0})` },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{isBn ? "সাম্প্রতিক" : "Most Recent"}</SelectItem>
                  <SelectItem value="budget_high">{isBn ? "বেশি বাজেট" : "Budget: High to Low"}</SelectItem>
                  <SelectItem value="budget_low">{isBn ? "কম বাজেট" : "Budget: Low to High"}</SelectItem>
                  <SelectItem value="proposals">{isBn ? "কম প্রপোজাল" : "Least Proposals"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="h-5 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-12 w-full bg-muted rounded" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-muted rounded" />
                        <div className="h-6 w-20 bg-muted rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{isBn ? "কোনো চাকরি পাওয়া যায়নি" : "No remote jobs found"}</h3>
                <p className="text-muted-foreground">{isBn ? "অন্য কীওয়ার্ড বা ফিল্টার দিয়ে খুঁজে দেখুন" : "Try different keywords or adjust your filters"}</p>
              </div>
            ) : (
              <>
                {/* Job Cards */}
                <div className="space-y-4">
                  {filteredJobs.map((job) => {
                    const comp = typeof job.company === "object" ? job.company : null;
                    const description = stripHtml(job.description || "");
                    const tags = (job.skills || []).filter(Boolean);
                    if (job.category && typeof job.category === "object" && "name" in job.category && job.category.name) {
                      tags.push(job.category.name);
                    }
                    const timeLeft = job.deadline ? Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000)) : null;

                    return (
                      <Card key={job.id} className="hover:shadow-md transition-shadow group">
                        <CardContent className="p-5">
                          <div className="flex gap-4">
                            {/* Company Logo */}
                            <div className="shrink-0 hidden sm:block">
                              <CompanyLogo src={comp?.logo} name={comp?.name} className="w-12 h-12 rounded-lg object-cover border">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                  {comp?.name?.charAt(0) || "C"}
                                </div>
                              </CompanyLogo>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <Link href={`/jobs/${job.id}`} className="font-semibold text-base hover:text-primary transition-colors line-clamp-1">
                                    {job.title}
                                  </Link>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3.5 w-3.5" />
                                      {comp?.name || "Company"}
                                    </span>
                                    {comp?.rating != null && comp.rating > 0 && (
                                      <span className="flex items-center gap-0.5 text-amber-500">
                                        <Star className="h-3.5 w-3.5 fill-amber-500" /> {comp.rating}
                                        <span className="text-muted-foreground">({comp.reviews_count || 0})</span>
                                      </span>
                                    )}
                                    {job.location && (
                                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Price */}
                                <div className="text-right shrink-0">
                                  <p className="text-lg font-bold text-primary">{formatCurrency(job.salary_min || 0)}</p>
                                  <p className="text-xs text-muted-foreground">{job.job_type === "hourly" ? "Hourly" : "Fixed Price"}</p>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{truncate(description, 200)}</p>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {tags.slice(0, 5).map((t: any, idx: number) => {
                                  const label = typeof t === "string" ? t : (t?.name || t?.name_en || String(t || ""));
                                  if (!label) return null;
                                  return (
                                    <Badge key={label || idx} variant="secondary" className="text-xs">
                                      {label}
                                    </Badge>
                                  );
                                })}
                                {job.is_remote && <Badge variant="outline" className="text-xs border-green-300 text-green-600"><Globe className="h-3 w-3 mr-1" />Remote</Badge>}
                              </div>

                              {/* Meta Row */}
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                                {timeLeft != null && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {timeLeft} {isBn ? "দিন বাকি" : "Days Left"}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {job.applications_count || 0} {isBn ? "প্রপোজাল" : "Proposals"}
                                </span>
                                {job.vacancies && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    {job.vacancies} {isBn ? "পদ" : "Vacancies"}
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 mt-3">
                                <Button size="sm" onClick={() => handleApply(job)} className="h-8">
                                  <Send className="h-3.5 w-3.5 mr-1" /> {isBn ? "আবেদন করুন" : "Apply"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" asChild>
                                  <Link href={`/jobs/${job.id}`}>
                                    <Eye className="h-3.5 w-3.5 mr-1" /> {isBn ? "বিস্তারিত" : "Details"}
                                  </Link>
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label={isBn ? "সংরক্ষণ করুন" : "Save job"}>
                                  <Bookmark className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-8">
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                      <Button key={p} variant={p === currentPage ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p)}>
                        {p}
                      </Button>
                    ))}
                    {totalPages > 7 && <span className="text-muted-foreground">...</span>}
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="space-y-6 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setRightOpen(!rightOpen)} className="shrink-0 h-6 w-6 rounded hover:bg-muted flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" title={rightOpen ? (isBn ? "সঙ্কুচিত" : "Collapse") : (isBn ? "প্রসারিত" : "Expand")}>
                {rightOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              {rightOpen && <h3 className="font-semibold text-sm whitespace-nowrap">{isBn ? "সাইডবার" : "Sidebar"}</h3>}
            </div>

            {rightOpen && (
              <>
                {/* How It Works */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-sm mb-4">{isBn ? "কিভাবে কাজ করে" : "How It Works"}</h3>
                    <div className="space-y-3">
                      {HOW_IT_WORKS.map((step) => {
                        const stepText = step.step === 7
                          ? (isBn ? `${siteName === "eJobs" ? "ই-জবস" : siteName} রিভিউ দেয়` : `${siteName} reviews jobs`)
                          : step.text;
                        return (
                          <div key={step.step} className="flex items-start gap-3">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <step.icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{stepText}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment System */}
                <Card className="border-primary/20">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      {isBn ? "নিরাপদ পেমেন্ট" : "Secure Payment System"}
                    </h3>
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-primary" /></div>
                        <p>{isBn ? `কোম্পানি → ${siteName}` : `Company → ${siteName}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0"><ShieldCheck className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="font-medium text-foreground">Payment Held in Escrow</p>
                          <p className="text-[11px]">{isBn ? "নিরাপদে সংরক্ষিত" : "Securely held until work completion"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center shrink-0"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                        <div>
                          <p className="font-medium text-foreground">Released After Approval</p>
                          <p className="text-[11px]">{isBn ? "অনুমোদনের পর মুক্তি" : "Funds released to freelancer"}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Project Amount</span><span className="font-medium text-foreground">৳ 15,000</span></div>
                        <div className="flex justify-between"><span>Service Fee (5%)</span><span className="text-foreground">- ৳ 750</span></div>
                        <Separator />
                        <div className="flex justify-between font-semibold"><span>Freelancer Gets</span><span className="text-green-600">৳ 14,250</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick CTA — hide when logged in */}
                {!isAuthenticated && (
                  <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <CardContent className="p-5 text-center space-y-3">
                      <Zap className="h-8 w-8 mx-auto" />
                      <h3 className="font-semibold">{isBn ? "দ্রুত শুরু করুন" : "Start Hiring Today"}</h3>
                      <p className="text-xs text-primary-foreground/80">{isBn ? "আপনার প্রতিভা প্রদর্শন করুন" : "Showcase your talent to top companies"}</p>
                      <Button variant="secondary" size="sm" className="w-full" asChild>
                        <Link href="/register">{isBn ? "ফ্রি অ্যাকাউন্ট খুঁজুন" : "Create Free Account"}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </aside>
        </div>
      </div>

      {/* ═══════════ BOTTOM SECTIONS ═══════════ */}
      <div className="border-t bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Top Hiring Companies */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{isBn ? "শীর্ষ নিয়োগকারী" : "Top Hiring Companies"}</h3>
                <Link href="/companies" className="text-xs text-primary hover:underline">{isBn ? "সব দেখুন" : "View all"}</Link>
              </div>
              <div className="space-y-3">
                {featuredCompanies.length > 0 ? featuredCompanies.slice(0, 5).map((c: any) => (
                  <div key={c.id || c.name} className="flex items-center gap-3">
                    <CompanyLogo src={c.logo} name={c.name} className="w-8 h-8 rounded-lg object-cover">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{c.name?.charAt(0) || "C"}</div>
                    </CompanyLogo>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.jobs_count || 0} {isBn ? "জব" : "jobs"}</p>
                    </div>
                    {c.rating != null && c.rating > 0 && (
                      <div className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Star className="h-3 w-3 fill-amber-500" /> {Number(c.rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">{isBn ? "কোনো কোম্পানি পাওয়া যায়নি" : "No companies found"}</p>
                )}
              </div>
            </div>

            {/* Why Choose Remote */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{isBn ? `কেন ${siteName} রিমোট` : `Why Choose ${siteName} Remote Jobs?`}</h3>
                <Link href="/about" className="text-xs text-primary hover:underline">{isBn ? "সব দেখুন" : "View all"}</Link>
              </div>
              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, text: isBn ? "১০০% নিরাপদ পেমেন্ট" : "100% Secure Payment" },
                  { icon: Award, text: isBn ? "ভেরিফাইড কোম্পানি" : "Verified Companies" },
                  { icon: Zap, text: isBn ? "দ্রুত এবং স্বচ্ছ" : "Fast & Transparent" },
                  { icon: Clock, text: isBn ? "২৪/৭ সাপোর্ট" : "24/7 Support" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{isBn ? "সাম্প্রতিক পেমেন্ট" : "Recent Payments"}</h3>
                <Link href="/payments" className="text-xs text-primary hover:underline">{isBn ? "সব দেখুন" : "View all"}</Link>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Niloy Hassan", amount: "৳ 18,250", project: "Logo & Brand Identity" },
                  { name: "Tanvir Ahmed", amount: "৳ 14,250", project: "Data Analysis Project" },
                  { name: "Rafiqul Islam", amount: "৳ 24,700", project: "Web Development" },
                  { name: "Fatima Khan", amount: "৳ 11,800", project: "Content Writing" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">{p.name.split(" ").map((n) => n[0]).join("")}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.project}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA — hide when logged in */}
          {!isAuthenticated && (
            <div className="mt-10 bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-2">{isBn ? "আপনার রিমোট ক্যারিয়ার শুরু করুন" : "Ready to Start Your Remote Career?"}</h2>
              <p className="text-white/80 mb-4 max-w-lg mx-auto">{isBn ? "হাজার হাজার কোম্পানি ইতিমধ্যে আপনার মতো প্রতিভাবান মানুষদের খুঁজছে" : "Thousands of companies are already looking for talented people like you"}</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/register">{isBn ? "ফ্রি অ্যাকাউন্ট খুঁজুন" : "Create Free Account"}</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" asChild>
                  <Link href="/jobs">{isBn ? "লগইন" : "Login"}</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Remote Workers */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{isBn ? "রিমোট ওয়ার্কার প্রোফাইল" : "Remote Worker Profiles"}</h3>
              <Link href="/candidates" className="text-xs text-primary hover:underline">{isBn ? "সব দেখুন" : "View all"}</Link>
            </div>
            {workersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : workers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isBn ? "কোনো ওয়ার্কার পাওয়া যায়নি" : "No workers found"}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {workers.map((w: any) => {
                    const profile = w.profile || w.user_profile || {};
                    const name = w.name || profile.full_name || "Unknown";
                    const title = profile.current_position || profile.title || "";
                    const location = profile.city || profile.location || "";
                    const skills = profile.skills || [];
                    const avatar = w.avatar || profile.avatar || "";
                    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <Link key={w.id} href={`/profile/${w.username || w.id}`} className="block group">
                        <Card className="hover:shadow-md transition-shadow h-full">
                          <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-bold text-sm">
                              {avatar ? <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" /> : initials}
                            </div>
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{name}</p>
                            {title && <p className="text-xs text-muted-foreground truncate">{title}</p>}
                            {location && <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><MapPin className="h-3 w-3" />{location}</p>}
                            {skills.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1 mt-2">
                                {skills.slice(0, 2).map((s: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                                ))}
                                {skills.length > 2 && <span className="text-[10px] text-muted-foreground">+{skills.length - 2}</span>}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                {/* Workers Pagination */}
                {workerTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-6">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={workerPage <= 1} onClick={() => { setWorkerPage(p => p - 1); fetchWorkers(workerPage - 1); }}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: Math.min(workerTotalPages, 5) }, (_, i) => i + 1).map((p) => (
                      <Button key={p} variant={p === workerPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => { setWorkerPage(p); fetchWorkers(p); }}>
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={workerPage >= workerTotalPages} onClick={() => { setWorkerPage(p => p + 1); fetchWorkers(workerPage + 1); }}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Trust Logos */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground mb-3">{isBn ? "হাজার হাজার কোম্পানি এবং ফ্রিল্যান্সারদের দ্বারা বিশ্বস্ত" : "Trusted by thousands of companies and freelancers worldwide"}</p>
            <div className="flex items-center justify-center gap-8 text-muted-foreground/50">
              {["Google", "Microsoft", "Amazon", "IBM", "PayPal"].map((name) => (
                <span key={name} className="text-sm font-semibold tracking-wide">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ APPLY DIALOG ═══════════ */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isBn ? "আবেদন জমা দিন" : "Submit Application"}</span>
              {isAuthenticated && aiQuota && aiQuota.max_limit > 0 && (
                <Badge variant={aiLimitReached ? "destructive" : "secondary"} className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> {aiQuota.remaining} {isBn ? "বাকি" : "left"}
                </Badge>
              )}
            </DialogTitle>
            {selectedJob && (
              <p className="text-sm text-muted-foreground">{isBn ? "পদ: " : "Position: "}{selectedJob.title}{selectedJob.company && ` — ${typeof selectedJob.company === "object" ? selectedJob.company.name : selectedJob.company}`}</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{isBn ? "কভার লেটার *" : "Cover Letter *"}</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleGenerateCoverLetter} disabled={generatingCover || aiLimitReached}>
                    {generatingCover ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    {isBn ? "AI তৈরি করুন" : "AI Generate"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link href="/dashboard/wallet"><Wallet className="h-3 w-3 mr-1" />{user?.wallet_balance ? formatCurrency(user.wallet_balance) : isBn ? "ক্রেডিট" : "Credit"}</Link>
                  </Button>
                </div>
              </div>
              <Textarea placeholder={isBn ? "আপনাকে কেন নিয়োগ দেওয়া উচিত তা লিখুন..." : "Tell us why you're the right fit..."} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={5} className="mt-1" />
              {aiLimitReached && <p className="text-xs text-destructive mt-1">{isBn ? "AI কোয়োটা শেষ হয়েছে" : "AI quota reached"} <Link href="/pricing" className="underline">{isBn ? "আপগ্রেড" : "Upgrade"}</Link></p>}
            </div>
            <div>
              <Label>{isBn ? "ডেলিভারি সময় (দিন) *" : "Delivery Days *"}</Label>
              <Input type="number" placeholder={isBn ? "কত দিনে সম্পন্ন হবে" : "Days to complete"} value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} min="1" className="mt-1" />
            </div>
            <div>
              <Label>{isBn ? "রিজিউমে" : "Resume"}</Label>
              <div className="mt-1 space-y-2">
                {resumeFromProfile && !resumeFile && (
                  <div className="flex items-center justify-between p-2 border rounded-lg bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="truncate max-w-[200px]">{isBn ? "প্রোফাইল থেকে রিজিউমে" : "Resume from profile"}</span></div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setResumeFromProfile(null)}>{isBn ? "পরিবর্তন" : "Change"}</Button>
                  </div>
                )}
                {resumeFile ? (
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" /><span className="truncate max-w-[200px]">{resumeFile.name}</span></div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setResumeFile(null)}><X className="h-3 w-3" /></Button>
                  </div>
                ) : !resumeFromProfile ? (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{isBn ? "ফাইল নির্বাচন করুন" : "Choose a file (PDF, DOC)"}</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setResumeFile(file); }} />
                  </label>
                ) : null}
              </div>
            </div>
            <Button onClick={submitApplication} disabled={submitting || !coverLetter.trim()} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {submitting ? (isBn ? "জমা দিচ্ছে..." : "Submitting...") : (isBn ? "আবেদন জমা দিন" : "Submit Application")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
