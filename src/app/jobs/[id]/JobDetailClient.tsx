"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJob, useApplyToJob, useSavedJobs, useAiMatchScore } from "@/hooks/use-jobs";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import api from "@/lib/api-client";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackBehavior, useScrollDepthTracking, useClickPatternTracking, useSessionEngagementTracking } from "@/hooks/use-behavior-tracker";
import {
  MapPin, Briefcase, DollarSign, Calendar, ArrowLeft, Share2,
  Building2, CheckCircle, Clock, Send, ExternalLink, Sparkles, Loader2,
  Wallet, AlertTriangle, Shield, Flag, Target, Users, Star, Zap,
  Globe, Award, TrendingUp, ChevronRight, Search, Eye, Bookmark,
  MessageSquare, Banknote, CreditCard, Phone, Mail,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency, formatDate, stripHtml } from "@/lib/utils";
import { aiService } from "@/services/ai.service";
import DOMPurify from "dompurify";

interface Props {
  jobId: string;
}

export default function JobDetailClient({ jobId }: Props) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { language } = useThemeStore();
  const isBn = language === "bn";

  useScrollDepthTracking();
  useClickPatternTracking();
  useSessionEngagementTracking();

  const { data: job, isLoading } = useJob(jobId);
  const { data: matchData } = useAiMatchScore(Number(jobId));
  const applyMutation = useApplyToJob();
  const { data: savedJobsData, refetch: refetchSavedJobs } = useSavedJobs();
  const savedJobIds = new Set((savedJobsData as any)?.map?.((j: any) => String(j.id)) ?? []);
  const [savingJob, setSavingJob] = useState(false);

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [generatingCover, setGeneratingCover] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [applyFee, setApplyFee] = useState({ enabled: false, amount: 0 });
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [complaintPhone, setComplaintPhone] = useState("");
  const [complaintEmail, setComplaintEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "company">("overview");

  useEffect(() => {
    api.get("/settings/public").then((r) => {
      const s = r.data?.data || r.data || {};
      if (s.support_phone) setComplaintPhone(s.support_phone);
      if (s.support_email) setComplaintEmail(s.support_email);
      if (s.regular_job_apply_fee_enabled) {
        setApplyFee({
          enabled: s.regular_job_apply_fee_enabled === "1" || s.regular_job_apply_fee_enabled === "true",
          amount: Number(s.regular_job_apply_fee || 0),
        });
      }
    }).catch(() => {});
    if (isAuthenticated && user?.role === "candidate") {
      api.get("/candidate/wallet").then((r) => {
        const d = r.data;
        setWalletBalance(Number(d.wallet?.balance ?? d.balance ?? d.data?.balance ?? 0));
      }).catch(() => toast.error(isBn ? "ওয়ালেট ব্যালেন্স লোড করতে ব্যর্থ" : "Failed to load wallet balance"));
    }
  }, [isAuthenticated, user]);

  const handleApply = () => {
    const data: Record<string, any> = { cover_letter: coverLetter };
    if (portfolioLink) data.portfolio_link = portfolioLink;
    if (job?.is_remote_project) {
      data.delivery_days = Number(deliveryDays) || 7;
    }
    applyMutation.mutate(
      { jobId: Number(jobId), data },
      {
        onSuccess: () => {
          setShowApplyDialog(false);
          setCoverLetter("");
          setDeliveryDays("");
          setPortfolioLink("");
        },
      }
    );
  };

  const handleApplyClick = () => {
    if (!user?.is_verified) {
      toast.warning(
        isBn ? "আপনাকে প্রথমে যাচাই করতে হবে। আবেদন করতে প্রোফাইল যাচাই সম্পন্ন করুন।" : "Please verify your profile first. Complete verification to apply for jobs.",
        { action: { label: isBn ? "যাচাই করুন" : "Verify Now", onClick: () => router.push("/dashboard/verify") } }
      );
      return;
    }
    setShowApplyDialog(true);
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingCover(true);
    try {
      const res = await aiService.generateCoverLetter({
        job_title: job?.title || "",
        company_name: (typeof job?.company === "object" ? job?.company?.name : job?.company) || "",
        job_description: job?.description || "",
      });
      if (res.cover_letter) {
        setCoverLetter(res.cover_letter);
        toast.success(isBn ? "কভার লেটার তৈরি হয়েছে!" : "Cover letter generated!");
      }
    } catch {
      toast.error(isBn ? "কভার লেটার তৈরি করতে ব্যর্থ" : "Failed to generate cover letter");
    } finally {
      setGeneratingCover(false);
    }
  };

  useEffect(() => {
    if (job) {
      trackBehavior("job_view", { targetId: Number(jobId), metaData: { title: job.title, company: typeof job.company === "object" ? job.company?.name : job.company } });
    }
  }, [job, jobId]);

  const handleSave = async () => {
    if (!isAuthenticated) { toast.error(isBn ? "লগইন করুন" : "Please login first"); return; }
    setSavingJob(true);
    try {
      const res = await api.post(`/candidate/toggle-save/${jobId}`);
      const saved = res.data?.data?.saved ?? res.data?.saved;
      if (saved === true) {
        toast.success(isBn ? "চাকরি সেভ হয়েছে" : "Job saved");
      } else if (saved === false) {
        toast.success(isBn ? "চাকরি আনসেভ হয়েছে" : "Job unsaved");
      } else {
        toast.success(isBn ? "চাকরি সেভ হয়েছে" : "Job saved");
      }
      refetchSavedJobs();
    } catch {
      toast.error(isBn ? "সেভ করতে ব্যর্থ" : "Failed to save job");
    } finally {
      setSavingJob(false);
    }
  };


  const handleReport = async () => {
    if (!isAuthenticated) { toast.error(isBn ? "রিপোর্ট করতে লগইন করুন" : "Please login to report"); return; }
    if (!reportReason) { toast.error(isBn ? "অনুগ্রহ করে একটি কারণ নির্বাচন করুন" : "Please select a reason"); return; }
    setSubmittingReport(true);
    try {
      await api.post("/reports", { reportable_type: "job", reportable_id: Number(jobId), reason: reportReason, description: reportDescription });
      toast.success(isBn ? "রিপোর্ট জমা হয়েছে। ধন্যবাদ!" : "Report submitted. Thank you!");
      setShowReportDialog(false); setReportReason(""); setReportDescription("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isBn ? "রিপোর্ট জমা দিতে ব্যর্থ" : "Failed to submit report"));
    } finally { setSubmittingReport(false); }
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-background py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-2/3 mb-3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6">
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ── Not Found ──
  if (!job) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">{isBn ? "চাকরি পাওয়া যায়নি" : "Job not found"}</h2>
          <Button asChild><Link href="/jobs"><ArrowLeft className="h-4 w-4 mr-2" />{isBn ? "ফিরে যান" : "Back to Jobs"}</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const matchScore = matchData?.score || matchData?.match_score;
  const matchedSkills = matchData?.matched_skills || matchData?.analysis?.matched_skills || [];
  const missingSkills = matchData?.missing_skills || matchData?.analysis?.missing_skills || [];
  const matchAdvice = matchData?.advice || matchData?.analysis?.advice || "";
  const profileStrength = matchData?.profile_strength || matchData?.analysis?.profile_strength;
  const companyName = typeof job.company === "object" ? job.company?.name : job.company;
  const companySlug = typeof job.company === "object" ? job.company?.slug : "";
  const companyLogo = typeof job.company === "object" ? job.company?.logo : null;
  const companyLocation = typeof job.company === "object" ? job.company?.location : null;
  const skills = (job.required_skills || []).filter(Boolean);
  const salaryDisplay = job.salary_range || (job.salary_min ? `${formatCurrency(job.salary_min)}${job.salary_max ? ` - ${formatCurrency(job.salary_max)}` : ""}` : null);

  return (
    <PublicLayout>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "JobPosting", title: job.title, description: job.description,
        datePosted: job.created_at, validThrough: job.deadline,
        employmentType: job.job_type?.toUpperCase()?.replace("-", "_"),
        hiringOrganization: { "@type": "Organization", name: companyName, logo: companyLogo },
        jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } },
      }) }} />

      {/* ═══ Hero Section ═══ */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-background py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" asChild className="mb-3">
            <Link href="/jobs"><ArrowLeft className="h-4 w-4 mr-1" />{isBn ? "চাকরি তালিকায় ফিরে যান" : "Back to Jobs"}</Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {companyLogo && <img src={companyLogo} alt={companyName} className="w-14 h-14 rounded-xl object-cover border shadow-sm" />}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {companyName && <Link href={`/companies/${companySlug}`} className="flex items-center gap-1 hover:text-primary font-medium"><Building2 className="h-4 w-4" />{companyName}</Link>}
                  {job.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDate(job.created_at || "")}</span>
                  {job.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{isBn ? "শেষ তারিখ:" : "Deadline:"} {formatDate(job.deadline)}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="gap-1"><Briefcase className="h-3 w-3" />{job.job_type}</Badge>
                  {job.experience_level && <Badge variant="secondary" className="gap-1"><Target className="h-3 w-3" />{job.experience_level}</Badge>}
                  {job.is_remote_project && <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"><Globe className="h-3 w-3" />Remote</Badge>}
                  {salaryDisplay && <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"><Banknote className="h-3 w-3" />{salaryDisplay}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={handleSave} disabled={savingJob} aria-label={isBn ? "সংরক্ষণ করুন" : "Save job"}>
                {savingJob ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={`h-4 w-4 ${savedJobIds.has(String(jobId)) ? "fill-primary text-primary" : ""}`} />}
              </Button>
              <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label={isBn ? "শেয়ার করুন" : "Share job"}><Share2 className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success(isBn ? "লিংক কপি হয়েছে" : "Link copied!"); setShowShareMenu(false); }}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    {isBn ? "লিংক কপি করুন" : "Copy Link"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400'); setShowShareMenu(false); }}>
                    <svg className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(job?.title || 'Check out this job')}`, '_blank', 'width=600,height=400'); setShowShareMenu(false); }}>
                    <svg className="h-4 w-4 mr-2 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X (Twitter)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`${job?.title || 'Check out this job'} ${window.location.href}`)}`, '_blank'); setShowShareMenu(false); }}>
                    <svg className="h-4 w-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(job?.title || 'Check out this job')}`, '_blank'); setShowShareMenu(false); }}>
                    <svg className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    Telegram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400'); setShowShareMenu(false); }}>
                    <svg className="h-4 w-4 mr-2 text-blue-700" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon" onClick={() => setShowReportDialog(true)} aria-label={isBn ? "রিপোর্ট করুন" : "Report job"}><Flag className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 3-Column Layout ═══ */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6">

          {/* ─── Job Info Sidebar (right on desktop) ─── */}
          <div className="space-y-4 order-3 lg:order-3">
            {/* Apply Card */}
            <Card className="border-primary/20 shadow-md">
              <CardContent className="p-6 space-y-4">
                {isAuthenticated && user?.role === "candidate" && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{isBn ? "AI ম্যাচ স্কোর" : "AI Match Score"}</span>
                      </div>
                      {matchData ? (
                        <span className={`text-lg font-bold ${(matchScore || 0) >= 70 ? "text-emerald-600" : (matchScore || 0) >= 40 ? "text-amber-600" : "text-red-500"}`}>{matchScore || 0}%</span>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">--%</span>
                      )}
                    </div>
                    {matchData && <p className="text-xs text-muted-foreground">{(matchScore || 0) >= 70 ? (isBn ? "দারুণ ম্যাচ!" : "Great match!") : (matchScore || 0) >= 40 ? (isBn ? "ভালো ম্যাচ" : "Good match") : (isBn ? "দুর্বল ম্যাচ" : "Weak match")}</p>}
                  </div>
                )}

                {isAuthenticated && user?.role === "candidate" && applyFee.enabled && applyFee.amount > 0 && walletBalance !== null && walletBalance < applyFee.amount && !job?.is_remote_project ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-400">{isBn ? "পর্যাপ্ত ব্যালেন্স নেই" : "Insufficient Balance"}</p>
                        <p className="text-amber-600/80 dark:text-amber-500/80 text-xs mt-1">{isBn ? `আবেদন ফি: ${formatCurrency(applyFee.amount)}` : `Apply fee: ${formatCurrency(applyFee.amount)}`}</p>
                      </div>
                    </div>
                    <Button className="w-full" size="lg" asChild><Link href="/dashboard/wallet"><Wallet className="h-4 w-4 mr-2" />{isBn ? "ওয়ালেটে অর্থ যোগ করুন" : "Add Funds"}</Link></Button>
                  </div>
                ) : isAuthenticated && user?.role === "candidate" ? (
                  <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                    <Button className="w-full" size="lg" onClick={handleApplyClick}><Send className="h-4 w-4 mr-2" />{isBn ? "এখনই আবেদন করুন" : "Apply Now"}</Button>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{isBn ? "আবেদন জমা দিন" : "Submit Application"}</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <Label>{isBn ? "কভার লেটার" : "Cover Letter"}</Label>
                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleGenerateCoverLetter} disabled={generatingCover}>
                              {generatingCover ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                              {isBn ? "AI তৈরি করুন" : "AI Generate"}
                            </Button>
                          </div>
                          <Textarea placeholder={isBn ? "আপনাকে কেন নিয়োগ দেওয়া উচিত তা লিখুন..." : "Write why you should be hired..."} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={5} className="mt-1" />
                        </div>
                        {job?.is_remote_project && (
                          <div><Label>{isBn ? "ডেলিভারি সময় (দিন)" : "Delivery Days"}</Label><Input type="number" placeholder={isBn ? "কত দিনে সম্পন্ন হবে" : "Days to complete"} value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} min="1" className="mt-1" /></div>
                        )}
                        <div><Label>{isBn ? "পোর্টফোলিও লিংক" : "Portfolio Link"}</Label><Input placeholder="https://..." value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} className="mt-1" /></div>
                        <Button onClick={handleApply} disabled={applyMutation.isPending} className="w-full">
                          {applyMutation.isPending ? (isBn ? "জমা দিচ্ছে..." : "Submitting...") : (isBn ? "জমা দিন" : "Submit")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : !isAuthenticated ? (
                  <Button className="w-full" size="lg" asChild><Link href="/login">{isBn ? "আবেদন করুন" : "Apply"}</Link></Button>
                ) : null}

                {salaryDisplay && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{isBn ? "অফারকৃত বেতন" : "Offered Salary"}</p>
                    <p className="text-lg font-bold text-primary">{salaryDisplay}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report this Job / Company */}
            <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {isBn ? "চাকরি/কোম্পানি রিপোর্ট" : "Report this Job/Company"}
                  </h3>
                  <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setShowReportDialog(true)}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    {isBn ? "রিপোর্ট" : "Report"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isBn
                    ? "প্রতারণামূলক প্রতিষ্ঠান সম্পর্কে খবর দিন। চাকরির নামে টাকা চাইলে রিপোর্ট করুন।"
                    : "Report fraudulent organizations. Report if asked for money in exchange for a job."}
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{complaintPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span>{complaintEmail}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            {skills.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{isBn ? "প্রয়োজনীয় দক্ষতা" : "Required Skills"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />{isBn ? "দ্রুত তথ্য" : "Quick Facts"}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />{isBn ? "সক্রিয় পোস্ট" : "Active posting"}</div>
                  <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-blue-500" />{isBn ? "যাচাইকৃত কোম্পানি" : "Verified company"}</div>
                  {job.is_remote_project && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-purple-500" />{isBn ? "রিমোট কাজ" : "Remote friendly"}</div>}
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-amber-500" />{isBn ? "দ্রুত প্রতিক্রিয়া" : "Quick response"}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Center: Job Content ─── */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {[
                { key: "overview" as const, label: isBn ? "ওভারভিউ" : "Overview" },
                { key: "requirements" as const, label: isBn ? "যোগ্যতা" : "Requirements" },
                { key: "company" as const, label: isBn ? "কোম্পানি" : "Company" },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${activeTab === tab.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>{isBn ? "বিবরণ" : "Job Description"}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || "") }} />
                  </CardContent>
                </Card>

                {job.responsibilities && (
                  <Card>
                    <CardHeader><CardTitle>{isBn ? "দায়িত্ব" : "Responsibilities"}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.responsibilities) }} />
                    </CardContent>
                  </Card>
                )}

                {job.benefits && (
                  <Card>
                    <CardHeader><CardTitle>{isBn ? "সুবিধা" : "Benefits"}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.benefits) }} />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "requirements" && (
              <div className="space-y-6">
                {job.requirements && (
                  <Card>
                    <CardHeader><CardTitle>{isBn ? "যোগ্যতা" : "Requirements"}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.requirements) }} />
                    </CardContent>
                  </Card>
                )}
                {job.education_requirements && (
                  <Card>
                    <CardHeader><CardTitle>{isBn ? "শিক্ষাগত যোগ্যতা" : "Education"}</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{job.education_requirements}</p></CardContent>
                  </Card>
                )}
                {job.experience_requirements && (
                  <Card>
                    <CardHeader><CardTitle>{isBn ? "অভিজ্ঞতার প্রয়োজনীয়তা" : "Experience Requirements"}</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{job.experience_requirements}</p></CardContent>
                  </Card>
                )}
                {job.additional_requirements && (
                  <Card>
                    <CardHeader><CardTitle>{isBn ? "অতিরিক্ত প্রয়োজনীয়তা" : "Additional Requirements"}</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{job.additional_requirements}</p></CardContent>
                  </Card>
                )}
                {skills.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>{isBn ? "প্রয়োজনীয় দক্ষতা" : "Skills"}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s: string, i: number) => <Badge key={i} variant="secondary">{s}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "company" && (
              <div className="space-y-6">
                {typeof job.company === "object" && job.company ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {companyLogo && <img src={companyLogo} alt={companyName} className="w-16 h-16 rounded-xl object-cover border" />}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">{companyName}</h3>
                          {companyLocation && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" />{companyLocation}</p>}
                          {typeof job.company === "object" && job.company?.description && (
                            <p className="text-sm text-muted-foreground mt-3">{job.company.description}</p>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" asChild><Link href={`/companies/${companySlug}`}><ExternalLink className="h-3.5 w-3.5 mr-1" />{isBn ? "প্রোফাইল দেখুন" : "View Profile"}</Link></Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">{companyName || (isBn ? "তথ্য নেই" : "No info")}</p></CardContent></Card>
                )}
              </div>
            )}

            {/* AI Match Score */}
            {isAuthenticated && user?.role === "candidate" && matchData && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" />{isBn ? "AI জব ম্যাচ স্কোর" : "AI Job Match Score"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 ${(matchScore || 0) >= 70 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : (matchScore || 0) >= 40 ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"}`}>
                      <span className={`text-xl font-bold ${(matchScore || 0) >= 70 ? "text-emerald-600 dark:text-emerald-400" : (matchScore || 0) >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{matchScore || 0}%</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{(matchScore || 0) >= 70 ? (isBn ? "দারুণ ম্যাচ!" : "Great match!") : (matchScore || 0) >= 40 ? (isBn ? "ভালো ম্যাচ" : "Good match") : (isBn ? "দুর্বল ম্যাচ" : "Weak match")}</p>
                      {profileStrength != null && <p className="text-xs text-muted-foreground mt-1">{isBn ? "প্রোফাইল শক্তি:" : "Profile strength:"} {profileStrength}%</p>}
                    </div>
                  </div>
                  {matchedSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{isBn ? "ম্যাচিং দক্ষতা" : "Matching skills"}</p>
                      <div className="flex flex-wrap gap-1.5">{matchedSkills.map((s: string) => <Badge key={s} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{s}</Badge>)}</div>
                    </div>
                  )}
                  {missingSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{isBn ? "মিসিং দক্ষতা" : "Missing skills"}</p>
                      <div className="flex flex-wrap gap-1.5">{missingSkills.map((s: string) => <Badge key={s} variant="outline" className="text-xs border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">{s}</Badge>)}</div>
                    </div>
                  )}
                  {matchAdvice && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />{isBn ? "AI পরামর্শ" : "AI Recommendation"}</p>
                      <p className="text-sm">{matchAdvice}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ─── Apply Sidebar (left on desktop) ─── */}
          <div className="space-y-4 order-1 lg:order-1">
            {/* Job Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isBn ? "চাকরির তথ্য" : "Job Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {salaryDisplay && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />{isBn ? "বেতন" : "Salary"}</span>
                    <span className="font-semibold text-sm">{salaryDisplay}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" />{isBn ? "ধরন" : "Type"}</span>
                  <Badge variant="outline" className="capitalize text-xs">{job.job_type}</Badge>
                </div>
                {job.experience_level && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" />{isBn ? "অভিজ্ঞতা" : "Experience"}</span>
                    <span className="text-sm">{job.experience_level}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />{isBn ? "অবস্থান" : "Location"}</span>
                    <span className="text-sm">{job.location}</span>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />{isBn ? "শেষ তারিখ" : "Deadline"}</span>
                    <span className="text-sm">{formatDate(job.deadline)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4" />{isBn ? "আবেদন" : "Applications"}</span>
                  <span className="text-sm">{job.applications_count || 0}</span>
                </div>
                {job.vacancies && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />{isBn ? "পদ" : "Vacancies"}</span>
                    <span className="text-sm">{job.vacancies}</span>
                  </div>
                )}
                {job.workplace_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" />{isBn ? "ওয়ার্কপ্লেস" : "Workplace"}</span>
                    <span className="text-sm capitalize">{job.workplace_type}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Card */}
            {typeof job.company === "object" && job.company && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-3 text-sm">{isBn ? "কোম্পানি" : "Company"}</h3>
                  <Link href={`/companies/${companySlug}`} className="flex items-center gap-3 group">
                    {companyLogo && <img src={companyLogo} alt={companyName} className="w-12 h-12 rounded-lg object-cover border" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{companyName}</p>
                      {companyLocation && <p className="text-xs text-muted-foreground">{companyLocation}</p>}
                      {typeof job.company === "object" && job.company?.trust_score != null && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1"><Shield className="h-3 w-3" />Trust: {job.company.trust_score}%</div>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* How it Works */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3 text-sm">{isBn ? "কিভাবে কাজ করে" : "How it Works"}</h3>
                <div className="space-y-3">
                  {[
                    { icon: Search, text: isBn ? "চাকরি খুঁজুন" : "Find a job" },
                    { icon: Send, text: isBn ? "আবেদন করুন" : "Apply with cover letter" },
                    { icon: CheckCircle, text: isBn ? "নিয়োগ পান" : "Get hired" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><step.icon className="h-3.5 w-3.5 text-primary" /></div>
                      <span className="text-sm text-muted-foreground">{step.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-5 text-center space-y-2">
                <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="font-semibold text-sm">{isBn ? "নিরাপদ প্ল্যাটফর্ম" : "Secure Platform"}</h3>
                <p className="text-xs text-muted-foreground">{isBn ? "সকল তথ্য এনক্রিপ্টেড এবং নিরাপদ" : "All data is encrypted and secure"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-destructive" />{isBn ? "চাকরি রিপোর্ট করুন" : "Report this Job"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">{isBn ? "কারণ নির্বাচন করুন" : "Reason"} <span className="text-destructive">*</span></Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder={isBn ? "কারণ নির্বাচন করুন..." : "Select a reason..."} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">{isBn ? "স্প্যাম / জাল পোস্ট" : "Spam / Fake Posting"}</SelectItem>
                  <SelectItem value="scam">{isBn ? "প্রতারণা / স্ক্যাম" : "Scam / Fraud"}</SelectItem>
                  <SelectItem value="inappropriate">{isBn ? "অনুপযুক্ত বিষয়বস্তু" : "Inappropriate Content"}</SelectItem>
                  <SelectItem value="fake">{isBn ? "ভুয়া কোম্পানি / চাকরি" : "Fake Company / Job"}</SelectItem>
                  <SelectItem value="duplicate">{isBn ? "ডুপ্লিকেট পোস্ট" : "Duplicate Posting"}</SelectItem>
                  <SelectItem value="other">{isBn ? "অন্যান্য" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">{isBn ? "বিস্তারিত (ঐচ্ছিক)" : "Description (Optional)"}</Label>
              <Textarea className="mt-1.5" rows={4} placeholder={isBn ? "কেন রিপোর্ট করছেন..." : "Why are you reporting..."} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>{isBn ? "বাতিল" : "Cancel"}</Button>
              <Button variant="destructive" onClick={handleReport} disabled={submittingReport || !reportReason}>
                {submittingReport ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Flag className="h-4 w-4 mr-1" />}
                {isBn ? "রিপোর্ট জমা দিন" : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
