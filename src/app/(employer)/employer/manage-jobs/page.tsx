"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import BoostJobDialog from "@/components/jobs/BoostJobDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Briefcase, Zap, Search, Edit, Pause, Play, Trash2,
  Users, TrendingUp, Clock, XCircle, Loader2, Copy, Eye,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Job } from "@/types";

interface PromotionInfo {
  id: number;
  type: string;
  status: string;
  daily_budget: number;
  total_budget: number;
  spent_amount: number;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string;
}

export default function ManageJobsPage() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

  useEffect(() => {
    document.title = isBn ? `চাকরি পরিচালনা | ${siteName}` : `Manage Jobs | ${siteName}`;
  }, [isBn, siteName]);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [boostJobId, setBoostJobId] = useState<number | null>(null);
  const [boostJobTitle, setBoostJobTitle] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    jobId: number | null;
    jobTitle: string;
  }>({ open: false, jobId: null, jobTitle: "" });
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Refresh every 60s for boost timers
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(iv);
  }, []);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    const qs = params.toString();

    api
      .get(`/employer/jobs${qs ? `?${qs}` : ""}`)
      .then((res) => {
        const data = res.data.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setJobs(list);
      })
      .catch(() => toast.error(isBn ? "চাকরি লোড করতে ব্যর্থ" : "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, [searchQuery, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Debounced search
  const [searchDebounce, setSearchDebounce] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchDebounce), 400);
    return () => clearTimeout(timer);
  }, [searchDebounce]);

  const handleToggleStatus = async (job: any) => {
    setTogglingId(job.id);
    try {
      await api.patch(`/employer/jobs/${job.id}/toggle`);
      toast.success(
        isBn
          ? `চাকরি ${job.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"} করা হয়েছে`
          : `Job ${job.is_active ? "paused" : "resumed"} successfully`
      );
      fetchJobs();
    } catch {
      toast.error(isBn ? "সমস্যা হয়েছে" : "Failed to toggle job status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.jobId) return;
    setDeleting(true);
    try {
      await api.delete(`/employer/jobs/${deleteDialog.jobId}`);
      toast.success(isBn ? "চাকরি মুছে ফেলা হয়েছে" : "Job deleted successfully");
      setDeleteDialog({ open: false, jobId: null, jobTitle: "" });
      fetchJobs();
    } catch {
      toast.error(isBn ? "মুছে ফেলা যায়নি" : "Failed to delete job");
    } finally {
      setDeleting(false);
    }
  };

  const handleBoostClick = (job: any) => {
    setBoostJobId(job.id);
    setBoostJobTitle(job.title);
  };

  const handleCopyLink = async (job: any) => {
    const url = `${window.location.origin}/jobs/${job.id}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        await legacyCopy(url);
      }
      toast.success(isBn ? "লিংক কপি করা হয়েছে" : "Link copied to clipboard");
    } catch {
      toast.error(isBn ? "কপি করতে ব্যর্থ" : "Failed to copy link");
    }
  };

  const legacyCopy = (text: string) =>
    new Promise<void>((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); document.body.removeChild(ta); resolve(); }
      catch (e) { document.body.removeChild(ta); reject(e); }
    });

  const getStatusBadge = (job: any) => {
    const status = job.status || (job.is_active ? "active" : "inactive");
    const variants: Record<string, string> = {
      active: "success", inactive: "warning", paused: "warning",
      closed: "destructive", draft: "secondary",
    };
    const labels: Record<string, { en: string; bn: string }> = {
      active: { en: "Active", bn: "সক্রিয়" },
      inactive: { en: "Paused", bn: "বিরতি" },
      paused: { en: "Paused", bn: "বিরতি" },
      closed: { en: "Closed", bn: "বন্ধ" },
      draft: { en: "Draft", bn: "খসড়া" },
    };
    const label = labels[status] || { en: status, bn: status };
    return (
      <Badge variant={(variants[status] as any) || "outline"} className="capitalize">
        {isBn ? label.bn : label.en}
      </Badge>
    );
  };

  // Compute boost info for a job
  const getBoostInfo = (job: any): PromotionInfo | null => {
    if (!job.promotion) return null;
    return job.promotion;
  };

  const getBoostTimeRemaining = (promo: PromotionInfo): { days: number; percent: number; label: string; color: string } => {
    const start = new Date(promo.start_date).getTime();
    const end = new Date(promo.end_date).getTime();
    const total = end - start;
    const elapsed = Math.max(0, now - start);
    const remaining = Math.max(0, end - now);
    const percent = Math.min(100, Math.round((elapsed / Math.max(total, 1)) * 100));
    const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));

    if (promo.status !== "active") {
      return { days: 0, percent: 100, label: promo.status, color: "text-muted-foreground" };
    }
    if (days <= 1) return { days, percent, label: `${days}d left`, color: "text-red-500" };
    if (days <= 3) return { days, percent, label: `${days}d left`, color: "text-amber-500" };
    return { days, percent, label: `${days}d left`, color: "text-green-500" };
  };

  const boostTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      sponsored_job: isBn ? "স্পনসরড" : "Sponsored",
      awareness_ad: isBn ? "ব্র্যান্ড" : "Awareness",
    };
    return map[type] || type;
  };

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status === "active" || (j.is_active && j.status !== "paused" && j.status !== "closed")).length,
    paused: jobs.filter((j) => j.status === "paused" || j.status === "inactive").length,
    closed: jobs.filter((j) => j.status === "closed").length,
    boosted: jobs.filter((j) => j.promotion || j.is_promoted).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isBn ? "চাকরি পরিচালনা" : "Manage Jobs"}</h1>
          <p className="text-muted-foreground mt-1">{isBn ? "আপনার সব চাকরি পোস্ট দেখুন ও পরিচালনা করুন" : "View and manage all your job postings"}</p>
        </div>
        <Button asChild><Link href="/employer/post-job"><Plus className="h-4 w-4 mr-2" />{isBn ? "নতুন চাকরি পোস্ট" : "Post New Job"}</Link></Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-5 w-20 mb-2" /><Skeleton className="h-7 w-12" /></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: isBn ? "মোট" : "Total", value: stats.total, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", icon: Briefcase },
            { label: isBn ? "সক্রিয়" : "Active", value: stats.active, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", icon: TrendingUp },
            { label: isBn ? "বিরতি" : "Paused", value: stats.paused, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950", icon: Clock },
            { label: isBn ? "বন্ধ" : "Closed", value: stats.closed, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", icon: XCircle },
            { label: isBn ? "বুস্টেড" : "Boosted", value: stats.boosted, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950", icon: Zap },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                  <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={isBn ? "চাকরি খুঁজুন..." : "Search jobs by title..."} value={searchDebounce} onChange={(e) => setSearchDebounce(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={isBn ? "সব অবস্থা" : "All Statuses"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isBn ? "সব অবস্থা" : "All Statuses"}</SelectItem>
                <SelectItem value="active">{isBn ? "সক্রিয়" : "Active"}</SelectItem>
                <SelectItem value="inactive">{isBn ? "বিরতি" : "Paused"}</SelectItem>
                <SelectItem value="closed">{isBn ? "বন্ধ" : "Closed"}</SelectItem>
                <SelectItem value="draft">{isBn ? "খসড়া" : "Draft"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !jobs.length ? (
        <div className="text-center py-16">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{isBn ? "কোনো চাকরি পোস্ট নেই" : "No job posts found"}</h3>
          <p className="text-muted-foreground mb-4">{searchQuery || statusFilter !== "all" ? (isBn ? "ফিল্টার পরিবর্তন করুন" : "Try adjusting your filters") : (isBn ? "এখনো কোনো চাকরি পোস্ট করা হয়নি" : "You haven't posted any jobs yet")}</p>
          <Button asChild><Link href="/employer/post-job"><Plus className="h-4 w-4 mr-2" />{isBn ? "প্রথম চাকরি পোস্ট করুন" : "Post Your First Job"}</Link></Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isBn ? "চাকরির শিরোনাম" : "Job Title"}</TableHead>
                  <TableHead className="hidden sm:table-cell">{isBn ? "ধরন" : "Type"}</TableHead>
                  <TableHead className="text-center">{isBn ? "আবেদন" : "Apps"}</TableHead>
                  <TableHead className="hidden md:table-cell">{isBn ? "বুস্ট" : "Boost"}</TableHead>
                  <TableHead>{isBn ? "অবস্থা" : "Status"}</TableHead>
                  <TableHead className="hidden md:table-cell">{isBn ? "তারিখ" : "Date"}</TableHead>
                  <TableHead className="text-right">{isBn ? "কার্যক্রম" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: any) => {
                  const promo = getBoostInfo(job);
                  const boost = promo ? getBoostTimeRemaining(promo) : null;

                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium">{job.title}</div>
                        {job.location && <div className="text-xs text-muted-foreground sm:hidden">{job.location}</div>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell capitalize text-muted-foreground">{job.job_type || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Link href="/employer/applicants" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                          <Users className="h-3.5 w-3.5" />{job.applications_count || 0}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {promo && boost ? (
                          <div className="min-w-[160px]">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="h-3 w-3 text-amber-500" />
                              <span className="text-xs font-medium">{boostTypeLabel(promo.type)}</span>
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 ${promo.status === "active" ? "text-green-600 border-green-300" : "text-muted-foreground"}`}>
                                {promo.status}
                              </Badge>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${boost.percent}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className={`text-[10px] ${boost.color}`}>{boost.label}</span>
                              <span className="text-[10px] text-muted-foreground">{formatCurrency(promo.spent_amount)} / {formatCurrency(promo.total_budget)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(job)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{job.created_at && formatDate(job.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950" onClick={() => handleBoostClick(job)} disabled={job.status !== "active" && !job.is_active} title={isBn ? "বুস্ট" : "Boost"}>
                            <Zap className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950" onClick={() => handleCopyLink(job)} title={isBn ? "লিংক কপি" : "Copy Link"}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title={isBn ? "সম্পাদনা" : "Edit"}>
                            <Link href={`/employer/manage-jobs/${job.id}/edit`}><Edit className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className={`h-8 w-8 ${job.is_active || job.status === "active" ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-950" : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"}`} onClick={() => handleToggleStatus(job)} disabled={togglingId === job.id}>
                            {togglingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : job.is_active || job.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setDeleteDialog({ open: true, jobId: job.id, jobTitle: job.title })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Boost Dialog */}
      {boostJobId && <BoostJobDialog jobId={boostJobId} jobTitle={boostJobTitle} open={!!boostJobId} onOpenChange={(open) => { if (!open) { setBoostJobId(null); setBoostJobTitle(""); } }} onComplete={fetchJobs} />}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, jobId: null, jobTitle: "" }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBn ? "চাকরি মুছে ফেলুন" : "Delete Job"}</DialogTitle>
            <DialogDescription>{isBn ? `"${deleteDialog.jobTitle}" মুছে ফেলতে চান?` : `Delete "${deleteDialog.jobTitle}"? This cannot be undone.`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, jobId: null, jobTitle: "" })}>{isBn ? "বাতিল" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isBn ? "মুছে ফেলুন" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}