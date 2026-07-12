"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Plus,
  Eye,
  MousePointerClick,
  Star,
  Wallet,
  Loader2,
  Pause,
  Play,
  Pencil,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Job } from "@/types";

interface Promotion {
  id: number;
  title: string;
  type: string;
  status: string;
  daily_budget: number;
  total_budget: number;
  spent_amount: number;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string;
  job_id: number;
}

interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  applications: number;
  ctr: number;
  cvr: number;
  cpa: number;
  remaining_budget: number;
}

export default function PromotionsPage() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = isBn ? `প্রচারণা | ${siteName}` : `Promotions | ${siteName}`;
  }, [isBn, siteName]);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [boostType, setBoostType] = useState("sponsored_job");
  const [duration, setDuration] = useState("7");
  const [dailyBudget, setDailyBudget] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [editDailyBudget, setEditDailyBudget] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  // Analytics dialog
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPromo, setAnalyticsPromo] = useState<Promotion | null>(null);

  const totalBudget = dailyBudget
    ? parseFloat(dailyBudget) * parseInt(duration, 10)
    : 0;

  const fetchPromotions = useCallback(() => {
    setLoading(true);
    api
      .get("/employer/promotions")
      .then((res) => setPromotions(res.data.data?.data || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    if (createOpen) {
      setLoadingJobs(true);
      setLoadingWallet(true);
      api.get("/employer/jobs").then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        setJobs(Array.isArray(data) ? data : []);
      }).catch(() => setJobs([])).finally(() => setLoadingJobs(false));
      api.get("/employer/wallet").then((res) => {
        const raw = res.data;
        const balance = Number(raw?.wallet?.balance ?? raw?.data?.balance ?? raw?.balance ?? 0);
        setWalletBalance(isNaN(balance) ? 0 : balance);
      }).catch(() => setWalletBalance(0)).finally(() => setLoadingWallet(false));
    }
  }, [createOpen]);

  const resetCreateForm = () => {
    setSelectedJobId("");
    setBoostType("sponsored_job");
    setDuration("7");
    setDailyBudget("");
  };

  const handleCreate = async () => {
    if (!selectedJobId) {
      toast.error(isBn ? "একটি চাকরি নির্বাচন করুন" : "Please select a job");
      return;
    }
    if (!dailyBudget || parseFloat(dailyBudget) <= 0) {
      toast.error(isBn ? "দৈনিক বাজেট দিন" : "Please enter a daily budget");
      return;
    }
    if (walletBalance !== null && totalBudget > walletBalance) {
      toast.error(isBn ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient wallet balance");
      return;
    }

    setSubmitting(true);
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + parseInt(duration, 10));
    const selectedJob = jobs.find((j) => String(j.id) === selectedJobId);
    const jobTitle = selectedJob?.title || "Job Promotion";
    const typeLabel = boostTypes.find((bt) => bt.value === boostType)?.label || "Promotion";

    try {
      await api.post("/employer/promotions", {
        title: `${jobTitle} - ${typeLabel}`,
        job_id: parseInt(selectedJobId, 10),
        type: boostType,
        daily_budget: parseFloat(dailyBudget),
        total_budget: totalBudget,
        start_date: now.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });
      toast.success(isBn ? "প্রচারণা সফলভাবে তৈরি হয়েছে!" : "Promotion created successfully!");
      setCreateOpen(false);
      resetCreateForm();
      fetchPromotions();
    } catch {
      toast.error(isBn ? "প্রচারণা তৈরি করতে ব্যর্থ" : "Failed to create promotion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (promo: Promotion) => {
    try {
      await api.patch(`/employer/promotions/${promo.id}/toggle`);
      toast.success(
        isBn
          ? `প্রচারণা ${promo.status === "active" ? "বিরতি" : "সক্রিয়"} হয়েছে`
          : `Campaign ${promo.status === "active" ? "paused" : "activated"}`
      );
      fetchPromotions();
    } catch {
      toast.error(isBn ? "স্ট্যাটাস পরিবর্তন করতে ব্যর্থ" : "Failed to toggle status");
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setEditDailyBudget(String(promo.daily_budget));
    setEditEndDate(promo.end_date?.split("T")[0] || "");
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingPromo) return;
    const newDaily = parseFloat(editDailyBudget);
    if (!newDaily || newDaily <= 0) {
      toast.error(isBn ? "দৈনিক বাজেট দিন" : "Please enter a daily budget");
      return;
    }

    setSubmitting(true);
    try {
      const start = editingPromo.start_date?.split("T")[0] || new Date().toISOString().split("T")[0];
      const endDiff = Math.max(1, Math.ceil((new Date(editEndDate).getTime() - new Date(start).getTime()) / 86400000));
      await api.put(`/employer/promotions/${editingPromo.id}`, {
        title: editingPromo.title || "Campaign Update",
        daily_budget: newDaily,
        total_budget: newDaily * endDiff,
        start_date: start,
        end_date: editEndDate,
      });
      toast.success(isBn ? "প্রচারণা আপডেট হয়েছে!" : "Campaign updated!");
      setEditOpen(false);
      setEditingPromo(null);
      fetchPromotions();
    } catch {
      toast.error(isBn ? "আপডেট করতে ব্যর্থ" : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAnalytics = async (promo: Promotion) => {
    setAnalyticsPromo(promo);
    setAnalyticsOpen(true);
    setAnalyticsLoading(true);
    try {
      const res = await api.get(`/employer/promotions/${promo.id}/analytics`);
      setAnalytics(res.data.data?.metrics || res.data.metrics || null);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const boostTypes = [
    { value: "sponsored_job", label: isBn ? "স্পনসরড চাকরি" : "Sponsored Job", description: isBn ? "সার্চে শীর্ষে প্রদর্শন" : "Top placement in search results", icon: Star },
    { value: "awareness_ad", label: isBn ? "ব্র্যান্ড অ্যাওয়্যারনেস" : "Brand Awareness", description: isBn ? "বিজ্ঞাপন ব্যানার প্লেসমেন্ট" : "Ad banner across the platform", icon: Megaphone },
  ];

  const statusColor = (s: string) => {
    if (s === "active") return "success";
    if (s === "paused") return "warning";
    if (s === "pending_review") return "outline";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isBn ? "প্রচারণা" : "Promotions"}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {isBn ? "নতুন প্রচারণা" : "New Promotion"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : !promotions.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">{isBn ? "কোনো প্রচারণা নেই" : "No promotions yet"}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isBn ? "আপনার চাকরি পোস্ট প্রচার করুন" : "Promote your job posts to reach more candidates"}
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isBn ? "প্রথম প্রচারণা তৈরি করুন" : "Create First Promotion"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {promotions.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{p.title || p.type?.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {p.type === "sponsored_job" ? "Sponsored" : p.type === "awareness_ad" ? "Awareness" : p.type?.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant={statusColor(p.status)} className="capitalize text-[10px]">
                        {p.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(p.start_date)} - {formatDate(p.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewAnalytics(p)} title={isBn ? "বিশ্লেষণ" : "Analytics"}>
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)} title={isBn ? "সম্পাদনা" : "Edit"}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(p)} title={p.status === "active" ? (isBn ? "বিরতি" : "Pause") : (isBn ? "সক্রিয়" : "Resume")}>
                      {p.status === "active" ? <Pause className="h-4 w-4 text-amber-500" /> : <Play className="h-4 w-4 text-green-500" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.impressions}</span>
                  <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{p.clicks}</span>
                  <span className="font-medium text-foreground">{formatCurrency(p.spent_amount)} / {formatCurrency(p.total_budget)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {isBn ? "নতুন প্রচারণা তৈরি করুন" : "Create New Promotion"}
            </DialogTitle>
            <DialogDescription>
              {isBn ? "আপনার চাকরি পোস্ট প্রচার করুন" : "Promote your job post to reach more candidates"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{isBn ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}</span>
            </div>
            <span className="font-semibold">
              {loadingWallet ? <Loader2 className="h-4 w-4 animate-spin" /> : walletBalance !== null ? formatCurrency(walletBalance) : "--"}
            </span>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isBn ? "চাকরি নির্বাচন করুন" : "Select Job"}</Label>
              {loadingJobs ? <Skeleton className="h-9 w-full" /> : (
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isBn ? "চাকরি বাছাই করুন" : "Choose a job to promote"} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.length === 0 ? (
                      <SelectItem value="none" disabled>{isBn ? "কোনো চাকরি পাওয়া যায়নি" : "No jobs available"}</SelectItem>
                    ) : jobs.filter((j) => j.status === "active").map((job) => (
                      <SelectItem key={job.id} value={String(job.id)}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>{isBn ? "প্রচারণার ধরন" : "Promotion Type"}</Label>
              <div className="grid grid-cols-1 gap-2">
                {boostTypes.map((bt) => (
                  <button key={bt.value} type="button" onClick={() => setBoostType(bt.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${boostType === bt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                    <bt.icon className={`h-5 w-5 shrink-0 ${boostType === bt.value ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{bt.label}</p>
                      <p className="text-xs text-muted-foreground">{bt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isBn ? "সময়কাল" : "Duration"}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{isBn ? "৭ দিন" : "7 Days"}</SelectItem>
                  <SelectItem value="14">{isBn ? "১৪ দিন" : "14 Days"}</SelectItem>
                  <SelectItem value="30">{isBn ? "৩০ দিন" : "30 Days"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isBn ? "দৈনিক বাজেট" : "Daily Budget"}</Label>
              <Input type="number" min="0" step="10" placeholder="0" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-sm text-muted-foreground">{isBn ? "মোট খরচ" : "Total Cost"}</span>
              <span className="font-semibold text-lg">{formatCurrency(totalBudget)}</span>
            </div>
            {walletBalance !== null && totalBudget > 0 && totalBudget > walletBalance && (
              <p className="text-sm text-destructive">{isBn ? "অপর্যাপ্ত ব্যালেন্স।" : "Insufficient balance."}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm(); }} disabled={submitting}>
              {isBn ? "বাতিল" : "Cancel"}
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !selectedJobId || !dailyBudget || parseFloat(dailyBudget) <= 0}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBn ? "প্রচারণা তৈরি করুন" : "Create Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              {isBn ? "প্রচারণা সম্পাদনা" : "Edit Campaign"}
            </DialogTitle>
            <DialogDescription>{editingPromo?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isBn ? "দৈনিক বাজেট" : "Daily Budget"}</Label>
              <Input type="number" min="0" step="10" value={editDailyBudget} onChange={(e) => setEditDailyBudget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isBn ? "শেষ তারিখ" : "End Date"}</Label>
              <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
            </div>
            {editingPromo && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <span className="text-sm text-muted-foreground">{isBn ? "বর্তমান খরচ" : "Spent so far"}</span>
                <span className="font-semibold">{formatCurrency(editingPromo.spent_amount)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingPromo(null); }} disabled={submitting}>
              {isBn ? "বাতিল" : "Cancel"}
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBn ? "সংরক্ষণ করুন" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {isBn ? "প্রচারণার বিশ্লেষণ" : "Campaign Analytics"}
            </DialogTitle>
            <DialogDescription>{analyticsPromo?.title}</DialogDescription>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xl font-bold">{analytics.impressions}</p>
                  <p className="text-[10px] text-muted-foreground">{isBn ? "ইম্প্রেশন" : "Impressions"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xl font-bold">{analytics.clicks}</p>
                  <p className="text-[10px] text-muted-foreground">{isBn ? "ক্লিক" : "Clicks"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xl font-bold">{analytics.applications}</p>
                  <p className="text-[10px] text-muted-foreground">{isBn ? "আবেদন" : "Applications"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xl font-bold">{analytics.ctr}%</p>
                  <p className="text-[10px] text-muted-foreground">CTR</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xl font-bold">{analytics.cvr}%</p>
                  <p className="text-[10px] text-muted-foreground">CVR</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xl font-bold">{formatCurrency(analytics.cpa)}</p>
                  <p className="text-[10px] text-muted-foreground">CPA</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">{isBn ? "তথ্য পাওয়া যায়নি" : "No data available"}</p>
          )}
          {analytics && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border mt-2">
              <span className="text-sm text-muted-foreground">{isBn ? "বাকি বাজেট" : "Remaining Budget"}</span>
              <span className="font-semibold text-green-600">{formatCurrency(analytics.remaining_budget)}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
