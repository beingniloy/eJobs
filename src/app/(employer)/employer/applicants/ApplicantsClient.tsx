"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Download,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Filter,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Globe,
  Wallet,
  Briefcase,
} from "lucide-react";

import { toast } from "sonner";
import type { JobApplication } from "@/types";
import { useRouter } from "next/navigation";

type JobGroup = {
  jobId: number;
  title: string;
  isRemote: boolean;
  budget: number | null;
  budgetType: string | null;
  applications: JobApplication[];
};

export default function ApplicantsClient() {
  const { language, settings } = useThemeStore();
  const router = useRouter();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [changeStatusApp, setChangeStatusApp] = useState<JobApplication | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    document.title = isBn ? `আবেদনকারী | ${siteName}` : `Applicants | ${siteName}`;
  }, [isBn, siteName]);

  useEffect(() => {
    api
      .get("/employer/applicants")
      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        data.sort(
          (a: JobApplication, b: JobApplication) =>
            (b.profile_strength ?? 0) - (a.profile_strength ?? 0)
        );
        setApplicants(data);
      })
      .catch(() => toast.error(isBn ? "আবেদনকারী লোড করতে ব্যর্থ" : "Failed to load applicants"))
      .finally(() => setLoading(false));
  }, []);

  const refreshStatus = (id: number, status: string) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const filteredApplicants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applicants.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      const name = app.user?.name?.toLowerCase() || "";
      const job = app.job?.title?.toLowerCase() || "";
      if (!q) return true;
      return name.includes(q) || job.includes(q);
    });
  }, [applicants, statusFilter, searchQuery]);

  const groupedByJob = useMemo(() => {
    const map = new Map<number, JobGroup>();
    filteredApplicants.forEach((app) => {
      const jobId = app.job_id;
      if (!map.has(jobId)) {
        map.set(jobId, {
          jobId,
          title: app.job?.title || "Job",
          isRemote: !!(app.job as any)?.is_remote_project,
          budget: (app.job as any)?.budget ?? null,
          budgetType: (app.job as any)?.budget_type ?? null,
          applications: [],
        });
      }
      map.get(jobId)!.applications.push(app);
    });
    return Array.from(map.values()).sort((a, b) => b.applications.length - a.applications.length);
  }, [filteredApplicants]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applicants.length, pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, hired: 0 };
    applicants.forEach((app) => {
      if (app.status && counts[app.status] !== undefined) counts[app.status]++;
    });
    return counts;
  }, [applicants]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewed: "bg-blue-100 text-blue-800",
    shortlisted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    hired: "bg-green-100 text-green-800",
  };

  const statusOptions = [
    { value: "all", label: isBn ? "সব" : "All" },
    { value: "pending", label: isBn ? "পেন্ডিং" : "Pending" },
    { value: "reviewed", label: isBn ? "রিভিউ" : "Reviewed" },
    { value: "shortlisted", label: isBn ? "শর্টলিস্ট" : "Shortlisted" },
    { value: "rejected", label: isBn ? "প্রত্যাখ্যাত" : "Rejected" },
    { value: "hired", label: isBn ? "নিয়োগ" : "Hired" },
  ];

  const candidateLabel = (app: JobApplication) => app.user?.name || "Candidate";

  const getProfileUrl = (app: JobApplication) => {
    const username = (app as any).user?.username;
    const userId = (app as any).user?.id;
    if (username) return `/profile/${username}`;
    if (userId) return `/candidate/${userId}`;
    return null;
  };

  const toggleJob = (jobId: number) => {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const hireCandidate = async (app: JobApplication) => {
    try {
      await api.post(`/employer/applicants/${app.id}/hire`);
      refreshStatus(app.id, "hired");
      toast.success(isBn ? "নিয়োগ দেওয়া হয়েছে" : "Candidate hired");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isBn ? "নিয়োগ দিতে ব্যর্থ" : "Failed to hire"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isBn ? "আবেদনকারী" : "Applicants"}</h1>
        <p className="text-muted-foreground mt-1">
          {isBn ? "চাকরি অনুযায়ী আবেদনকারী দেখুন" : "View applicants grouped by job"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={statusFilter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(opt.value)}
                className="h-8 text-xs"
              >
                {opt.label}
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  {statusCounts[opt.value] ?? 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
        <input
          type="text"
          placeholder={isBn ? "নাম বা চাকরি খুঁজুন..." : "Search by name or job..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-64"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : !groupedByJob.length ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">
            {isBn ? "এখনো কোনো আবেদন নেই" : "No applicants found"}
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByJob.map((group) => {
            const isExpanded = expandedJobs[group.jobId] !== false;
            return (
              <Card key={group.jobId} className="overflow-hidden">
                {/* Job Header */}
                <button
                  onClick={() => toggleJob(group.jobId)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{group.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.applications.length} {isBn ? "জন আবেদনকারী" : "applicants"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {group.isRemote && (
                      <Badge variant="secondary" className="text-xs border-blue-300 text-blue-600">
                        <Globe className="h-3 w-3 mr-1" />
                        {isBn ? "রিমোট" : "Remote"}
                      </Badge>
                    )}
                    {group.budget != null && (
                      <Badge variant="outline" className="text-xs">
                        <Wallet className="h-3 w-3 mr-1" />
                        {Number(group.budget).toLocaleString()} ৳
                      </Badge>
                    )}
                    <Badge variant="secondary">{group.applications.length}</Badge>
                  </div>
                </button>

                {/* Applications List */}
                {isExpanded && (
                  <div className="border-t">
                    {group.applications.map((app) => {
                      const profileUrl = getProfileUrl(app);
                      return (
                        <div key={app.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                          <DefaultAvatar
                            src={(app as any).user?.avatar}
                            name={candidateLabel(app)}
                            className="h-10 w-10 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{candidateLabel(app)}</p>
                                {app.cover_letter && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {app.cover_letter}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {app.profile_strength != null && (
                                  <div className="hidden sm:flex items-center gap-2">
                                    <div className="relative h-2 w-16 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                                          app.profile_strength >= 80
                                            ? "bg-emerald-500"
                                            : app.profile_strength >= 50
                                              ? "bg-amber-500"
                                              : "bg-red-500"
                                        }`}
                                        style={{ width: `${app.profile_strength}%` }}
                                      />
                                    </div>
                                    <Badge
                                      variant={app.profile_strength >= 80 ? "success" : app.profile_strength >= 50 ? "warning" : "destructive"}
                                    >
                                      {app.profile_strength}%
                                    </Badge>
                                  </div>
                                )}
                                {app.ai_match_score && (
                                  <Badge variant="success" className="hidden sm:inline-flex">{app.ai_match_score}%</Badge>
                                )}
                                <Badge variant="outline" className={`capitalize text-xs ${statusColors[app.status as keyof typeof statusColors] || ""}`}>
                                  {app.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-1">
                              {profileUrl ? (
                                <Button variant="ghost" size="icon" className="h-7 w-7" title={isBn ? "প্রোফাইল" : "View Profile"} asChild>
                                  <Link href={profileUrl} target="_blank">
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title={isBn ? "বার্তা" : "Message"}
                                onClick={() => {
                                  const cid = app.user?.id ?? app.id;
                                  if (cid) router.push(`/employer/messages?to=${cid}`);
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>

                              {/* Hire button for shortlisted remote jobs */}
                              {group.isRemote && app.status === "shortlisted" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => hireCandidate(app)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {isBn ? "নিয়োগ দিন" : "Hire"}
                                </Button>
                              )}

                              {(app.status === "pending" || app.status === "reviewed") && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    title={isBn ? "শর্টলিস্ট" : "Shortlist"}
                                    onClick={async () => {
                                      try {
                                        await api.patch(`/employer/applicants/${app.id}`, { status: "shortlisted" });
                                        refreshStatus(app.id, "shortlisted");
                                        toast.success(isBn ? "শর্টলিস্টে যোগ করা হয়েছে" : "Shortlisted");
                                      } catch {
                                        toast.error(isBn ? "ব্যর্থ" : "Failed");
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    title={isBn ? "প্রত্যাখ্যান" : "Reject"}
                                    onClick={async () => {
                                      try {
                                        await api.patch(`/employer/applicants/${app.id}`, { status: "rejected" });
                                        refreshStatus(app.id, "rejected");
                                        toast.success(isBn ? "প্রত্যাখ্যাত" : "Rejected");
                                      } catch {
                                        toast.error(isBn ? "ব্যর্থ" : "Failed");
                                      }
                                    }}
                                  >
                                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                                  </Button>
                                </>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {app.resume_url && (
                                    <DropdownMenuItem onClick={() => window.open(app.resume_url as string, "_blank")}>
                                      <Download className="h-4 w-4 mr-2" />
                                      {isBn ? "সিভি" : "Download CV"}
                                    </DropdownMenuItem>
                                  )}
                                  {profileUrl ? (
                                    <DropdownMenuItem asChild>
                                      <Link href={profileUrl} target="_blank">
                                        <Eye className="h-4 w-4 mr-2" />
                                        {isBn ? "প্রোফাইল" : "View Profile"}
                                      </Link>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      <Eye className="h-4 w-4 mr-2" />
                                      {isBn ? "প্রোফাইল" : "View Profile"}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const cid = app.user?.id ?? app.id;
                                      if (cid) router.push(`/employer/messages?to=${cid}`);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {isBn ? "বার্তা" : "Message"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {(app.status === "pending" || app.status === "reviewed") && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          try {
                                            await api.patch(`/employer/applicants/${app.id}`, { status: "shortlisted" });
                                            refreshStatus(app.id, "shortlisted");
                                            toast.success(isBn ? "শর্টলিস্টে যোগ করা হয়েছে" : "Shortlisted");
                                          } catch {
                                            toast.error(isBn ? "ব্যর্থ" : "Failed");
                                          }
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        {isBn ? "শর্টলিস্ট" : "Shortlist"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          try {
                                            await api.patch(`/employer/applicants/${app.id}`, { status: "rejected" });
                                            refreshStatus(app.id, "rejected");
                                            toast.success(isBn ? "প্রত্যাখ্যাত" : "Rejected");
                                          } catch {
                                            toast.error(isBn ? "ব্যর্থ" : "Failed");
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                        {isBn ? "প্রত্যাখ্যান করুন" : "Reject"}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {group.isRemote && app.status === "shortlisted" && (
                                    <DropdownMenuItem onClick={() => hireCandidate(app)}>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      {isBn ? "নিয়োগ দিন" : "Hire"}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-3xl">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isBn ? "আবেদনের বিবরণ" : "Applicant Details"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <DefaultAvatar
                    src={(selectedApp as any).user?.avatar}
                    name={candidateLabel(selectedApp)}
                    className="h-14 w-14 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-base">{candidateLabel(selectedApp)}</p>
                    <p className="text-sm text-muted-foreground">{selectedApp.job?.title || "Job"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize text-xs">{selectedApp.status}</Badge>
                      {selectedApp.profile_strength != null && (
                        <Badge variant={selectedApp.profile_strength >= 80 ? "success" : selectedApp.profile_strength >= 50 ? "warning" : "destructive"}>
                          {selectedApp.profile_strength}%
                        </Badge>
                      )}
                      {selectedApp.ai_match_score && <Badge variant="success">{selectedApp.ai_match_score}% Match</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {selectedApp.expected_salary && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{isBn ? "প্রত্যাশিত বেতন" : "Expected Salary"}</p>
                      <p className="font-medium">{selectedApp.expected_salary}</p>
                    </div>
                  )}
                  {selectedApp.delivery_days && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{isBn ? "ডেলিভারি" : "Delivery"}</p>
                      <p className="font-medium">{selectedApp.delivery_days} {isBn ? "দিন" : "days"}</p>
                    </div>
                  )}
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{isBn ? "স্ট্যাটাস" : "Status"}</p>
                    <p className="font-medium capitalize">{selectedApp.status}</p>
                  </div>
                </div>

                {selectedApp.cover_letter && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        <p className="text-sm font-medium">
                          {isBn ? "আবেদন পত্র" : "Cover Letter"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedApp.cover_letter}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {selectedApp.resume_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedApp.resume_url as string, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isBn ? "সিভি" : "Download CV"}
                    </Button>
                  )}
                  {(() => {
                    const url = getProfileUrl(selectedApp);
                    return url ? (
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={url} target="_blank">
                          <Eye className="h-4 w-4 mr-2" />
                          {isBn ? "প্রোফাইল" : "View Full Profile"}
                        </Link>
                      </Button>
                    ) : null;
                  })()}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setChangeStatusApp(selectedApp)}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {isBn ? "স্ট্যাটাস পরিবর্তন" : "Change Status"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const cid = selectedApp.user?.id ?? selectedApp.id;
                      if (cid) router.push(`/employer/messages?to=${cid}`);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isBn ? "বার্তা" : "Message"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!changeStatusApp} onOpenChange={(open) => !open && setChangeStatusApp(null)}>
        <DialogContent className="max-w-sm">
          {changeStatusApp && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isBn ? "স্ট্যাটাস পরিবর্তন করুন" : "Change Applicant Status"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {candidateLabel(changeStatusApp)} — {changeStatusApp.job?.title || "Job"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["pending", "reviewed", "shortlisted", "rejected", "hired"].map((status) => (
                    <Button
                      key={status}
                      variant={changeStatusApp.status === status ? "default" : "outline"}
                      size="sm"
                      className="capitalize"
                      onClick={async () => {
                        try {
                          await api.patch(`/employer/applicants/${changeStatusApp.id}`, { status });
                          refreshStatus(changeStatusApp.id, status);
                          toast.success(isBn ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated");
                          setChangeStatusApp(null);
                        } catch {
                          toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
                        }
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
