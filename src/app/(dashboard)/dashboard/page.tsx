"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import RecommendedJobs from "@/components/jobs/RecommendedJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Briefcase,
  Send,
  Bookmark,
  FileText,
  Eye,
  TrendingUp,
  ArrowRight,
  CreditCard,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface DashboardData {
  applied_jobs_count: number;
  saved_jobs_count: number;
  profile_views: number;
  match_score: number;
  recent_applications: {
    id: number;
    job_title: string;
    company_name: string;
    status: string;
    created_at: string;
  }[];
  wallet_balance: number;
}

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<any>(null);

  useEffect(() => {
    api
      .get("/candidate/dashboard")
      .then((res) => setData(res.data.data))
      .catch(() => toast.error("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api
      .get("/verifications/status")
      .then((res) => setVerification(res.data))
      .catch(() => toast.error("Failed to load verification status"));
  }, []);

  const stats = [
    {
      title: isBn ? "আবেদন" : "Applications",
      value: data?.applied_jobs_count || 0,
      icon: Send,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: isBn ? "সংরক্ষিত" : "Saved Jobs",
      value: data?.saved_jobs_count || 0,
      icon: Bookmark,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: isBn ? "প্রোফাইল ভিউ" : "Profile Views",
      value: data?.profile_views || 0,
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: isBn ? "AI ম্যাচ স্কোর" : "AI Match Score",
      value: `${data?.match_score || 0}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewed: "bg-blue-100 text-blue-800",
    shortlisted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    hired: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          {isBn ? `স্বাগতম, ${user?.name}` : `Welcome back, ${user?.name}`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isBn
            ? "আপনার কর্মজীবন ড্যাশবোর্ড"
            : "Here's an overview of your career dashboard"}
        </p>
      </div>

      {/* Verification Warning Bar */}
      {verification && !verification.summary?.is_fully_verified && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="font-medium text-sm">
                {isBn ? "আপনার অ্যাকাউন্ট যাচাইকৃত নয়" : "Your account is not fully verified"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`flex items-center gap-1 ${verification.summary?.email_verified ? "text-emerald-600" : "text-muted-foreground"}`}>
                {verification.summary?.email_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {isBn ? "ইমেইল" : "Email"}
              </span>
              <span className={`flex items-center gap-1 ${verification.summary?.phone_verified ? "text-emerald-600" : "text-muted-foreground"}`}>
                {verification.summary?.phone_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {isBn ? "ফোন" : "Phone"}
              </span>
              <span className={`flex items-center gap-1 ${verification.summary?.nid_verified ? "text-emerald-600" : "text-muted-foreground"}`}>
                {verification.summary?.nid_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {isBn ? "NID" : "NID"}
              </span>
            </div>
            <Button asChild size="sm" variant="outline" className="sm:ml-auto border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900">
              <Link href="/dashboard/verify">
                {isBn ? "এখনই যাচাই করুন" : "Verify Now"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className={`${stat.bg} border-none`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white/60 dark:bg-white/10`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <Link href="/jobs" className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60">
                  <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-foreground">{isBn ? "চাকরি খুঁজুন" : "Browse Jobs"}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <Link href="/dashboard/resume" className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-foreground">{isBn ? "সিভি আপডেট" : "Update Resume"}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <Link href="/ai-assistant" className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-foreground">{isBn ? "AI ক্যারিয়ার" : "AI Career Coach"}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Jobs */}
      <RecommendedJobs />

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isBn ? "সাম্প্রতিক আবেদন" : "Recent Applications"}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/applied-jobs">
              {isBn ? "সব দেখুন" : "View All"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : !data?.recent_applications?.length ? (
            <p className="text-muted-foreground text-center py-4">
              {isBn ? "এখনো কোনো আবেদন নেই" : "No applications yet"}
            </p>
          ) : (
            <div className="space-y-3">
              {data.recent_applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{app.job_title}</p>
                    <p className="text-sm text-muted-foreground">{app.company_name}</p>
                  </div>
                  <Badge variant="outline" className={`capitalize shrink-0 ${statusColors[app.status] || ""}`}>
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
