"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase } from "lucide-react";
import { toast } from "sonner";
import type { JobApplication } from "@/types";

import ApplicantsFilterBar from "./ApplicantsFilterBar";
import JobGroupCard from "./JobGroupCard";
import ApplicantDetailDialog from "./ApplicantDetailDialog";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { tryEndpoints, groupByJob } from "./applicants-utils";

export default function ApplicantsClient() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [changeStatusApp, setChangeStatusApp] = useState<JobApplication | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({});
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = isBn ? `আবেদনকারী | ${siteName}` : `Applicants | ${siteName}`;
  }, [isBn, siteName]);

  useEffect(() => {
    api
      .get("/employer/applicants")
      .then((res) => {
        const data: JobApplication[] = res.data.data?.data || res.data.data || [];
        data.sort((a, b) => (b.profile_strength ?? 0) - (a.profile_strength ?? 0));
        setApplicants(data);
      })
      .catch(() => toast.error(isBn ? "আবেদনকারী লোড করতে ব্যর্থ" : "Failed to load applicants"))
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applicants.length, pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, hired: 0 };
    for (const app of applicants) {
      if (app.status && counts[app.status] !== undefined) counts[app.status]++;
    }
    return counts;
  }, [applicants]);

  const filteredApplicants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applicants.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (!q) return true;
      return (app.user?.name?.toLowerCase() || "").includes(q) || (app.job?.title?.toLowerCase() || "").includes(q);
    });
  }, [applicants, statusFilter, searchQuery]);

  const groupedByJob = useMemo(() => groupByJob(filteredApplicants), [filteredApplicants]);

  const refreshStatus = useCallback((id: number, status: string) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const handleStatusChange = useCallback(async (app: JobApplication, newStatus: string) => {
    const prevStatus = app.status || "pending";
    setPendingId(app.id);
    refreshStatus(app.id, newStatus);
    try {
      await tryEndpoints([
        () => api.patch(`/employer/applicants/${app.id}`, { status: newStatus }),
        () => api.post(`/employer/applicants/${app.id}/status`, { status: newStatus }),
      ]);
      const labels: Record<string, { en: string; bn: string }> = {
        shortlisted: { en: "Shortlisted", bn: "শর্টলিস্টে যোগ করা হয়েছে" },
        rejected: { en: "Rejected", bn: "প্রত্যাখ্যাত" },
        reviewed: { en: "Marked as reviewed", bn: "রিভিউ করা হয়েছে" },
        hired: { en: "Candidate hired", bn: "নিয়োগ দেওয়া হয়েছে" },
        pending: { en: "Marked as pending", bn: "পেন্ডিং করা হয়েছে" },
      };
      toast.success(labels[newStatus] ? (isBn ? labels[newStatus].bn : labels[newStatus].en) : "Status updated");
    } catch (err: any) {
      refreshStatus(app.id, prevStatus);
      toast.error(err?.response?.data?.message || (isBn ? "ব্যর্থ" : "Failed to update status"));
    } finally {
      setPendingId(null);
    }
  }, [isBn, refreshStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isBn ? "আবেদনকারী" : "Applicants"}</h1>
        <p className="text-muted-foreground mt-1">
          {isBn ? "চাকরি অনুযায়ী আবেদনকারী দেখুন" : "View applicants grouped by job"}
        </p>
      </div>

      <ApplicantsFilterBar
        statusFilter={statusFilter}
        statusCounts={statusCounts}
        searchQuery={searchQuery}
        isBn={isBn}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : groupedByJob.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">{isBn ? "এখনো কোনো আবেদন নেই" : "No applicants found"}</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByJob.map((group) => (
            <JobGroupCard
              key={group.jobId}
              group={group}
              isExpanded={expandedJobs[group.jobId] !== false}
              isBn={isBn}
              onToggle={() => setExpandedJobs((p) => ({ ...p, [group.jobId]: p[group.jobId] !== false ? false : true }))}
              onStatusChange={handleStatusChange}
              pendingId={pendingId}
            />
          ))}
        </div>
      )}

      <ApplicantDetailDialog
        app={selectedApp}
        isBn={isBn}
        onOpenChange={(o) => { if (!o) setSelectedApp(null); }}
        onStatusRefresh={refreshStatus}
        onOpenStatusChange={(app) => { setSelectedApp(null); setChangeStatusApp(app); }}
      />

      <StatusChangeDialog
        app={changeStatusApp}
        isBn={isBn}
        onOpenChange={(o) => { if (!o) setChangeStatusApp(null); }}
        onStatusChange={async (status) => {
          if (!changeStatusApp) return;
          await handleStatusChange(changeStatusApp, status);
          setChangeStatusApp(null);
        }}
      />
    </div>
  );
}