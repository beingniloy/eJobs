"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/theme-store";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api-client";
import { aiService } from "@/services/ai.service";
import { subscriptionService, type QuotaInfo } from "@/services/subscription.service";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search, Globe, ChevronLeft, ChevronRight, Briefcase, Users,
  Send, Clock, Shield, MapPin, FileText, Sparkles, Loader2,
  Wallet, ArrowRight, ChevronDown, ChevronUp, Zap, Target,
  Eye, Bookmark, MessageSquare, Star, CheckCircle2, Globe as GlobeIcon,
} from "lucide-react";
import { formatCurrency, formatDate, truncate, stripHtml } from "@/lib/utils";
import type { Job } from "@/types";

const BUDGET_RANGES = [
  { label: "All Budget", min: "", max: "" },
  { label: "৳ 0 - ৳5,000", min: "0", max: "5000" },
  { label: "৳5,001 - ৳15,000", min: "5001", max: "15000" },
  { label: "৳15,001 - ৳30,000", min: "15001", max: "30000" },
  { label: "৳30,001 - ৳60,000+", min: "30001", max: "60000" },
];

const EXPERIENCE_LEVELS = ["All Levels", "Entry Level", "1 - 2 Years", "3 - 5 Years", "5+ Years"];
const PROJECT_DURATIONS = ["Any Duration", "< 1 Week", "1 - 4 Weeks", "1 - 3 Months", "> 3 Months"];
const HOW_IT_WORKS = [
  { step: 1, icon: Search, text: "Company remotely posts a job" },
  { step: 2, icon: Users, text: "Candidates apply with proposals" },
  { step: 3, icon: MessageSquare, text: "Company reviews and starts work" },
  { step: 4, icon: CheckCircle2, text: "Work delivered and approved" },
  { step: 5, icon: Star, text: "Payment released from escrow" },
];

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

  const [selectedJobType, setSelectedJobType] = useState("All Types");
  const [selectedExperience, setSelectedExperience] = useState("All Levels");
  const [selectedBudget, setSelectedBudget] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState("Any Duration");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [leftOpen, setLeftOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("remote-jobs-left-open") !== "false";
  });
  const [rightOpen, setRightOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("remote-jobs-right-open") !== "false";
  });

  useEffect(() => { localStorage.setItem("remote-jobs-left-open", String(leftOpen)); }, [leftOpen]);
  useEffect(() => { localStorage.setItem("remote-jobs-right-open", String(rightOpen)); }, [rightOpen]);

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFromProfile, setResumeFromProfile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);

  // Quotas
  const [quotas, setQuotas] = useState<Record<string, QuotaInfo>>({});

  useEffect(() => {
    if (!isAuthenticated) return;
    subscriptionService
      .getMySubscriptionWithQuotas()
      .then((result) => {
        setQuotas(result.quotas);
      })
      .catch(() => {
        // Quota fetch failed — AI button will still work but without limit check
      });
  }, [isAuthenticated]);

  const aiQuota = quotas.ai_cover_letters;
  const aiLimitReached =
    aiQuota != null &&
    aiQuota.max_limit > 0 &&
    aiQuota.remaining <= 0;

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
  useEffect(() => { setCurrentPage(1); }, [selectedExperience, selectedDuration, selectedSkills, sortBy, category]);

  useEffect(() => {
    api.get("/categories").then((res) => {
      setCategories(
        (res.data?.data || [])
          .filter((c: any) => c.is_remote)
          .map((c: any) => ({
            value: c.id.toString(),
            label: c.name_en || c.name,
            count: c.jobs_count || 0,
          }))
      );
    }).catch(() => {});
    api.get("/jobs/stats").then((res: any) => setPlatformStats(res.data || res)).catch(() => {});
    api.get("/jobs/popular-skills").then((res: any) => setTopSkills(res.data || res)).catch(() => {});
    api.get("/companies/featured").then((res: any) => setFeaturedCompanies((res.data || res).slice(0, 8))).catch(() => {});
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  /* ── AI Cover Letter Generation ── */
  const handleGenerateCoverLetter = async () => {
    if (!selectedJob) return;
    if (aiLimitReached) {
      toast.error(
        isBn
          ? "AI কোয়োটা শেষ হয়েছে। প্ল্যান আপগ্রেড করুন।"
          : "AI quota reached. Please upgrade your plan."
      );
      return;
    }
    setGeneratingCover(true);
    try {
      const companyName =
        typeof selectedJob.company === "object" && selectedJob.company
          ? selectedJob.company.name || ""
          : typeof selectedJob.company === "string"
            ? selectedJob.company
            : "";
      const res = await aiService.generateCoverLetter({
        job_title: selectedJob.title,
        company_name: companyName,
      });
      if (res?.cover_letter) {
        setCoverLetter(res.cover_letter);
        toast.success(isBn ? "কভার লেটার তৈরি হয়েছে!" : "Cover letter generated!");
      } else if (res?.response) {
        setCoverLetter(res.response);
        toast.success(isBn ? "কভার লেটার তৈরি হয়েছে!" : "Cover letter generated!");
      } else {
        toast.error(
          isBn ? "কভার লেটার তৈরি করতে ব্যর্থ। আবার চেষ্টা করুন।" : "Failed to generate cover letter. Please try again."
        );
      }
      // Refresh quotas after use
      subscriptionService
        .getMySubscriptionWithQuotas()
        .then((r) => setQuotas(r.quotas))
        .catch(() => {});
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data?.response;
      if (status === 403) {
        toast.error(
          isBn
            ? "AI ব্যবহারের জন্য প্রিমিয়াম প্ল্যান প্রয়োজন। আপগ্রেড করুন।"
            : "Premium plan required for AI features. Please upgrade."
        );
      } else if (status === 429 || msg?.includes("quota") || msg?.includes("limit")) {
        toast.error(
          isBn
            ? "AI ব্যবহারের সীমা শেষ। পরের মাসে আবার চেষ্টা করুন।"
            : "AI usage limit reached. Try again next month."
        );
      } else {
        toast.error(
          isBn
            ? "AI সার্ভিস এই মুহূর্তে কাজ করছে না। পরে আবার চেষ্টা করুন।"
            : "AI service is currently unavailable. Please try again later."
        );
      }
    } finally {
      setGeneratingCover(false);
    }
  };

  /* ── Apply Dialog ── */
  const handleApply = (job: Job) => {
    if (!isAuthenticated) {
      toast.error(isBn ? "লগইন করুন" : "Please login first");
      return;
    }
    setSelectedJob(job);
    setCoverLetter("");
    setDeliveryDays("");
    setResumeFile(null);
    setApplyDialogOpen(true);
  };

  const submitApplication = async () => {
    if (!selectedJob) return;
    if (!coverLetter.trim()) {
      toast.error(isBn ? "কভার লেটার লিখুন" : "Please write a cover letter");
      return;
    }
    if (!deliveryDays || Number(deliveryDays) < 1) {
      toast.error(isBn ? "ডেলিভারি দিন লিখুন" : "Please enter delivery days");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("cover_letter", coverLetter);
      formData.append("delivery_days", deliveryDays);
      if (resumeFile) formData.append("resume", resumeFile);
      await api.post(
        `/candidate/jobs/${selectedJob.id}/apply`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success(
        isBn ? "সফলভাবে আবেদন করা হয়েছে!" : "Application submitted successfully!"
      );
      setApplyDialogOpen(false);
      setSelectedJob(null);
      setCoverLetter("");
      setDeliveryDays("");
      setResumeFile(null);
      fetchJobs(currentPage);
    } catch (error: any) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (isBn ? "আবেদন করতে ব্যর্থ" : "Failed to submit application");
      if (status === 403) {
        toast.error(
          isBn
            ? "আপনার অ্যাকাউন্টটি ভেরিফাই করা হয়নি। আগে যাচাই সম্পন্ন করুন।"
            : "Your account is not verified. Please complete verification first."
        );
      } else if (status === 422) {
        toast.error(msg);
      } else if (status === 402) {
        toast.error(
          isBn
            ? "পর্যাপ্ত ব্যালেন্স নেই। ওয়ালেটে অর্থ যোগ করুন।"
            : "Insufficient balance. Please add funds to your wallet."
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "fixed" && job.job_type !== "fixed_price") return false;
    if (activeTab === "hourly" && job.job_type !== "hourly") return false;
    return true;
  });

  const allCats = [
    { value: "all", label: isBn ? "সব ক্যাটাগরি" : "All Categories", count: totalJobs },
    ...categories,
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-600">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative z-10">
          <div className="text-white space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1 rounded-full">
              <Shield className="h-3.5 w-3.5" /> 100% Secure — {siteName}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {isBn ? "রিমোট কাজ, নিরাপদ পেমেন্ট" : "Remote Work, Secure Payment"}
            </h1>
            <p className="text-white/80 text-lg">
              {isBn ? "যেকোনো জায়গা থেকে কাজ করুন, নিরাপদে বেতন পান" : "Work from anywhere, get paid safely"}
            </p>
            <div className="bg-white text-foreground rounded-xl p-2 flex flex-col sm:flex-row gap-2 shadow-lg max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isBn ? "চাকরি খুঁজুন..." : "Search job title or keywords..."}
                  className="pl-10 h-11 border-0 bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setCurrentPage(1)}
                />
              </div>
              <Select value={category} onValueChange={(val) => { setCategory(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-40 h-11 border-0 bg-muted/50">
                  <SelectValue placeholder={isBn ? "ক্যাটাগরি" : "All Categories"} />
                </SelectTrigger>
                <SelectContent>
                  {allCats.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => setCurrentPage(1)} className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white">
                <Search className="h-4 w-4 mr-1" /> {isBn ? "খুঁজুন" : "Search Jobs"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="border-b bg-white dark:bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {(showAllCategories ? allCats : allCats.slice(0, 6)).map((c) => (
              <button key={c.value} onClick={() => { setCategory(c.value); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${category === c.value ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
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

      {/* Stats */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { icon: GlobeIcon, label: "Total Remote Jobs", value: platformStats.remote_jobs || platformStats.total_jobs || 0 },
              { icon: Target, label: "Active Projects", value: platformStats.total_applications || 0 },
              { icon: Banknote, label: "Avg Salary", value: platformStats.avg_salary ? `৳${Number(platformStats.avg_salary).toLocaleString()}` : "৳0" },
              { icon: Users, label: "Freelancers", value: platformStats.total_candidates || 0 },
              { icon: Shield, label: "Payment Protected", value: "100%" },
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

      {/* Main 3-column */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[var(--left)_1fr_var(--right)] lg:gap-6"
          style={{ '--left': leftOpen ? '240px' : '36px', '--right': rightOpen ? '280px' : '36px' } as React.CSSProperties}>

          {/* Left sidebar */}
          <aside className="space-y-6 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setLeftOpen(!leftOpen)} className="shrink-0 h-6 w-6 rounded hover:bg-muted flex items-center justify-center">
                  {leftOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {leftOpen && <h3 className="font-semibold text-sm whitespace-nowrap">{isBn ? "ফিল্টার" : "Refine Search"}</h3>}
              </div>
              {leftOpen && (
                <button onClick={() => { setSelectedJobType("All Types"); setSelectedExperience("All Levels"); setSelectedBudget(0); setSelectedDuration("Any Duration"); setSelectedSkills([]); setBudgetMin(""); setBudgetMax(""); setCurrentPage(1); }}
                  className="shrink-0 text-xs text-primary hover:underline">
                  {isBn ? "সব মুছুন" : "Clear All"}
                </button>
              )}
            </div>
            {leftOpen && (
              <>
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">{isBn ? "চাকরির ধরন" : "Job Type"}</p>
                  <div className="space-y-1">
                    {["All Types", "Fixed Price", "Hourly", "Long Term", "Short Term"].map((t) => (
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
                </div>
                <Separator />
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
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">{isBn ? "দক্ষতা" : "Skills"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(showAllSkills ? topSkills : topSkills.slice(0, 5)).map((s) => (
                      <button key={s.skill} onClick={() => toggleSkill(s.skill)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedSkills.includes(s.skill) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground hover:border-primary"}`}>
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

          {/* Center: Job Listings */}
          <main className="space-y-4">
            <div className="flex gap-2 lg:hidden">
              <Button variant="outline" size="sm" onClick={() => setLeftOpen(!leftOpen)} className="flex-1 text-xs">
                {leftOpen ? (isBn ? "ফিল্টার লুকান" : "Hide Filters") : (isBn ? "ফিল্টার দেখান" : "Show Filters")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRightOpen(!rightOpen)} className="flex-1 text-xs">
                {rightOpen ? (isBn ? "সাইডবার লুকান" : "Hide Sidebar") : (isBn ? "সাইডবার দেখান" : "Show Sidebar")}
              </Button>
            </div>
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

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="h-5 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-12 w-full bg-muted rounded" />
                      <div className="flex gap-2"><div className="h-6 w-16 bg-muted rounded" /><div className="h-6 w-20 bg-muted rounded" /></div>
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
                <div className="space-y-4">
                  {filteredJobs.map((job) => {
                    const comp = typeof job.company === "object" ? job.company : null;
                    const description = stripHtml(job.description || "");
                    const tags = (job.skills || []).filter(Boolean);
                    const timeLeft = job.deadline ? Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000)) : null;

                    return (
                      <Card key={job.id} className="hover:shadow-md transition-shadow group">
                        <CardContent className="p-5">
                          <div className="flex gap-4">
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
                                <div className="text-right shrink-0">
                                  <p className="text-lg font-bold text-primary">{formatCurrency(job.salary_min || 0)}</p>
                                  <p className="text-xs text-muted-foreground">{job.job_type === "hourly" ? "Hourly" : "Fixed Price"}</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{truncate(description, 200)}</p>
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {tags.slice(0, 5).map((t: any, idx: number) => {
                                  const label = typeof t === "string" ? t : (t?.name || t?.name_en || String(t || ""));
                                  if (!label) return null;
                                  return <Badge key={label || idx} variant="secondary" className="text-xs">{label}</Badge>;
                                })}
                                {job.is_remote && <Badge variant="outline" className="text-xs border-green-300 text-green-600"><Globe className="h-3 w-3 mr-1" />Remote</Badge>}
                              </div>
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
                              <div className="flex items-center gap-2 mt-3">
                                <Button size="sm" onClick={() => handleApply(job)} className="h-8">
                                  <Send className="h-3.5 w-3.5 mr-1" /> {isBn ? "আবেদন করুন" : "Apply"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" asChild>
                                  <Link href={`/jobs/${job.id}`}>
                                    <Eye className="h-3.5 w-3.5 mr-1" /> {isBn ? "বিস্তারিত" : "Details"}
                                  </Link>
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Save job">
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

          {/* Right sidebar */}
          <aside className="space-y-6 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setRightOpen(!rightOpen)} className="shrink-0 h-6 w-6 rounded hover:bg-muted flex items-center justify-center">
                {rightOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              {rightOpen && <h3 className="font-semibold text-sm whitespace-nowrap">{isBn ? "সাইডবার" : "Sidebar"}</h3>}
            </div>
            {rightOpen && (
              <>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-sm mb-4">{isBn ? "কিভাবে কাজ করে" : "How It Works"}</h3>
                    <div className="space-y-3">
                      {HOW_IT_WORKS.map((step) => (
                        <div key={step.step} className="flex items-start gap-3">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <step.icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

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
                    </div>
                  </CardContent>
                </Card>

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

      {/* Apply Dialog */}
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
              <p className="text-sm text-muted-foreground">
                {isBn ? "পদ: " : "Position: "}
                {selectedJob.title}
                {selectedJob.company &&
                  ` — ${typeof selectedJob.company === "object" ? selectedJob.company.name : selectedJob.company}`}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {/* Cover Letter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{isBn ? "কভার লেটার *" : "Cover Letter *"}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleGenerateCoverLetter}
                    disabled={generatingCover || !!aiLimitReached}
                  >
                    {generatingCover ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    {isBn ? "AI তৈরি করুন" : "AI Generate"}
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder={isBn ? "আপনাকে কেন নিয়োগ দেওয়া উচিত তা লিখুন..." : "Tell us why you're the right fit..."}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                className="mt-1"
              />
              {aiLimitReached && (
                <p className="text-xs text-destructive mt-1">
                  {isBn ? "AI কোয়োটা শেষ হয়েছে" : "AI quota reached"}{" "}
                  <Link href="/pricing" className="underline">{isBn ? "আপগ্রেড" : "Upgrade"}</Link>
                </p>
              )}
              {generatingCover && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {isBn ? "AI তৈরি করছে..." : "Generating..."}
                </p>
              )}
            </div>

            {/* Delivery Days */}
            <div>
              <Label>{isBn ? "ডেলিভারি সময় (দিন) *" : "Delivery Days *"}</Label>
              <Input
                type="number"
                placeholder={isBn ? "কত দিনে সম্পন্ন হবে" : "Days to complete"}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                min="1"
                className="mt-1"
              />
            </div>

            {/* Resume */}
            <div>
              <Label>{isBn ? "রিজিউমে" : "Resume"}</Label>
              <div className="mt-1 space-y-2">
                {resumeFromProfile && !resumeFile && (
                  <div className="flex items-center justify-between p-2 border rounded-lg bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="truncate max-w-[200px]">
                        {isBn ? "প্রোফাইল থেকে রিজিউমে" : "Resume from profile"}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setResumeFromProfile(null)}>
                      {isBn ? "পরিবর্তন" : "Change"}
                    </Button>
                  </div>
                )}
                {resumeFile ? (
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setResumeFile(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : !resumeFromProfile ? (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {isBn ? "ফাইল নির্বাচন করুন" : "Choose a file (PDF, DOC)"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setResumeFile(file);
                      }}
                    />
                  </label>
                ) : null}
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={submitApplication}
              disabled={submitting || !coverLetter.trim()}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {submitting
                ? isBn ? "জমা দিচ্ছে..." : "Submitting..."
                : isBn ? "আবেদন জমা দিন" : "Submit Application"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}