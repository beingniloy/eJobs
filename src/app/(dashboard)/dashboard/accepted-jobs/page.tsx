"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle, Calendar, MapPin, Video, Phone,
  MessageSquare, ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function CandidateAcceptedJobsPage() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

  useEffect(() => {
    document.title = isBn ? `গৃহীত চাকরি | ${siteName}` : `Accepted Jobs | ${siteName}`;
  }, [isBn, siteName]);

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/candidate/accepted-jobs")
      .then((res) => setApplications(res.data.data || []))
      .catch(() => toast.error(isBn ? "গৃহীত চাকরি লোড করতে ব্যর্থ" : "Failed to load accepted jobs"))
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    shortlisted: "bg-blue-100 text-blue-700",
    interview: "bg-purple-100 text-purple-700",
    hired: "bg-green-100 text-green-700",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isBn ? "গৃহীত চাকরি" : "Accepted Jobs"}</h1>
        <p className="text-sm text-muted-foreground">
          {isBn ? "শর্টলিস্টেড ও নিয়োগপ্রাপ্ত চাকরিগুলো" : "Your shortlisted and hired jobs"}
        </p>
      </div>

      <div className="grid gap-4">
        {applications.length === 0 ? (
          <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-lg font-semibold">{isBn ? "কোনো গৃহীত চাকরি নেই" : "No accepted jobs yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isBn ? "শর্টলিস্ট হouincychakরiju বর্তমানে ∅" : "Shortlisted jobs will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          applications.map((app: any) => (
            <Card key={app.id} className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{app.job?.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {app.job?.company?.name} {isBn ? "দ্বারা" : ""}
                    </p>
                  </div>
                  <Badge className={`text-xs ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>
                    {app.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{isBn ? "অবস্থান" : "Location"}</p>
                    <p className="font-medium">{app.job?.location || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isBn ? "চাকরির ধরন" : "Job Type"}</p>
                    <p className="font-medium capitalize">{app.job?.job_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isBn ? "আবেদনের সময়" : "Applied"}</p>
                    <p className="font-medium">{formatDate(app.created_at)}</p>
                  </div>
                  {app.interview && (
                    <div>
                      <p className="text-muted-foreground">{isBn ? "সাক্ষাৎকার" : "Interview"}</p>
                      <p className="font-medium">{formatDate(app.interview.scheduled_at)}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/dashboard/messages?employer=${app.job?.company?.user_id}`}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {isBn ? "বার্তা পাঠান" : "Send Message"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
