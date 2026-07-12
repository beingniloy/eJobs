"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Download, Eye, MessageSquare, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";

import { toast } from "sonner";
import type { JobApplication } from "@/types";
import Link from "next/link";

export default function ApplicantsPage() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = isBn ? `আবেদনকারী | ${siteName}` : `Applicants | ${siteName}`;
  }, [isBn, siteName]);

  useEffect(() => {
    api
      .get("/employer/applicants")
      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        // Client-side sort by profile_strength descending as fallback
        data.sort(
          (a: JobApplication, b: JobApplication) =>
            (b.profile_strength ?? 0) - (a.profile_strength ?? 0)
        );
        setApplicants(data);
      })
      .catch(() => toast.error(isBn ? "আবেদনকারী লোড করতে ব্যর্থ" : "Failed to load applicants"))
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewed: "bg-blue-100 text-blue-800",
    shortlisted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    hired: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isBn ? "আবেদনকারী" : "Applicants"}</h1>
        <p className="text-muted-foreground mt-1">
          {isBn ? "সব আবেদনকারী দেখুন" : "Review all applicants"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !applicants.length ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">
            {isBn ? "এখনো কোনো আবেদন নেই" : "No applicants yet"}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <DefaultAvatar src={app.candidate?.avatar} name={app.candidate?.name} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{app.candidate?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{app.job?.title}</p>
                  </div>
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

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Download CV */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={isBn ? "সিভি ডাউনলোড" : "Download CV"}
                      onClick={() => {
                        if (app.resume_url) {
                          window.open(app.resume_url, "_blank");
                        } else {
                          toast.info(isBn ? "কোনো সিভি পাওয়া যায়নি" : "No CV available");
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {/* View Profile */}
                    <Link
                      href={`/candidate/${app.candidate?.id}`}
                      target="_blank"
                      title={isBn ? "প্রোফাইল দেখুন" : "View Profile"}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>

                    {/* Message */}
                    <Link
                      href={`/messages?user=${app.candidate?.id}`}
                      title={isBn ? "বার্তা পাঠান" : "Send Message"}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await api.patch(`/employer/applicants/${app.id}`, { status: "shortlisted" });
                              setApplicants((prev) =>
                                prev.map((a) => (a.id === app.id ? { ...a, status: "shortlisted" } : a))
                              );
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
                              setApplicants((prev) =>
                                prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" } : a))
                              );
                              toast.success(isBn ? "প্রত্যাখ্যাত" : "Rejected");
                            } catch {
                              toast.error(isBn ? "ব্যর্থ" : "Failed");
                            }
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          {isBn ? "প্রত্যাখ্যান করুন" : "Reject"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (app.candidate?.email) {
                              window.location.href = `mailto:${app.candidate.email}`;
                            } else {
                              toast.info(isBn ? "ইমেইল পাওয়া যায়নি" : "Email not available");
                            }
                          }}
                        >
                          {isBn ? "ইমেইল পাঠান" : "Send Email"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
