"use client";

import React from "react";
import Link from "next/link";
import { useAppliedJobs } from "@/hooks/use-jobs";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Send, MapPin, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AppliedJobsPage() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const { data: jobs, isLoading } = useAppliedJobs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isBn ? "আমার আবেদন" : "My Applications"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isBn ? "আপনার সব চাকরির আবেদন দেখুন" : "Track all your job applications"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : !jobs?.length ? (
        <div className="text-center py-16">
          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isBn ? "এখনো কোনো আবেদন নেই" : "No applications yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isBn ? "চাকরি খুঁজে আবেদন করুন" : "Start applying to jobs you like"}
          </p>
          <Button asChild>
            <Link href="/jobs">
              {isBn ? "চাকরি খুঁজুন" : "Browse Jobs"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((application: any) => {
            const job = application.job || application;
            return (
              <Card key={application.id || job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {job.company?.name || application.company?.name}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {job.location}
                          </span>
                        )}
                        <span>Applied {formatDate(application.created_at || job.created_at)}</span>
                        {application.status && (
                          <Badge variant={application.status === "shortlisted" ? "default" : application.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                            {application.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">
                      {job.job_type || "job"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
