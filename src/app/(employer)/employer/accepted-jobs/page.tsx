"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScheduleInterviewModal from "@/components/interviews/ScheduleInterviewModal";
import InterviewDetailCard from "@/components/interviews/InterviewDetailCard";
import {
  Calendar, Clock, MapPin, Video, Phone, User,
  MessageSquare, CheckCircle, ArrowRight, Loader2, Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AcceptedJobsPage() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";

  useEffect(() => {
    document.title = isBn ? `গৃহীত চাকরি | ${siteName}` : `Accepted Jobs | ${siteName}`;
  }, [isBn, siteName]);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeTab, setActiveTab] = useState("candidates");

  useEffect(() => {
    api.get("/employer/accepted-jobs")
      .then((res) => setJobs(res.data.data || []))
      .catch(() => toast.error(isBn ? "গৃহীত চাকরি লোড করতে ব্যর্থ" : "Failed to load accepted jobs"))
      .finally(() => setLoading(false));
  }, []);

  const typeIcons: Record<string, any> = {
    in_person: MapPin,
    video: Video,
    phone: Phone,
  };

  const statusColors: Record<string, string> = {
    shortlisted: "bg-blue-100 text-blue-700",
    interview: "bg-purple-100 text-purple-700",
    hired: "bg-green-100 text-green-700",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isBn ? "গৃহীত চাকরি" : "Accepted Jobs"}</h1>
          <p className="text-sm text-muted-foreground">
            {isBn ? "ছোটলিস্টেড এবং নিয়োগপ্রাপ্ত প্রার্থীগণ" : "Shortlisted and hired candidates"}
          </p>
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-lg font-semibold">{isBn ? "কোনো গৃহীত চাকরি নেই" : "No accepted jobs yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isBn ? "প্রার্থীদের শর্টলিস্ট করলে এখানে দেখা যাবে" : "Shortlisted candidates will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {job.accepted_count} {isBn ? "জন প্রার্থী" : "candidates accepted"}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {job.accepted_count} {isBn ? "জন" : "hired"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.applications?.map((app: any) => (
                    <div
                      key={app.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedApplication?.id === app.id
                          ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300"
                          : "bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-200/50"
                      }`}
                      onClick={() => {
                        setSelectedJob(job);
                        setSelectedApplication(app);
                        setActiveTab("candidates");
                      }}
                    >
                      <DefaultAvatar src={app.user?.avatar} name={app.user?.name} className="h-10 w-10" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{app.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{app.user?.email}</p>
                      </div>
                      <Badge className={`text-xs ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>
                        {app.status}
                      </Badge>
                      {app.interview && (
                        <Badge className="text-xs bg-purple-100 text-purple-700">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(app.interview.scheduled_at)}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJob(job);
                          setSelectedApplication(app);
                          setShowScheduleModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selected Application Detail */}
      {selectedApplication && (
        <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {isBn ? "বিস্তারিত" : "Details"} — {selectedApplication.user?.name}
              </CardTitle>
              <Button size="sm" onClick={() => setShowScheduleModal(true)}>
                <Calendar className="h-4 w-4 mr-1" />
                {isBn ? "সাক্ষাৎকার নির্ধারণ" : "Schedule Interview"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="candidates">{isBn ? "তথ্য" : "Info"}</TabsTrigger>
                <TabsTrigger value="interviews">{isBn ? "সাক্ষাৎকার" : "Interviews"}</TabsTrigger>
                <TabsTrigger value="messages">{isBn ? "বার্তা" : "Messages"}</TabsTrigger>
              </TabsList>

              <TabsContent value="candidates" className="mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{isBn ? "চাকরি" : "Job"}</p>
                    <p className="font-medium">{selectedJob?.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isBn ? "স্ট্যাটাস" : "Status"}</p>
                    <Badge className={statusColors[selectedApplication.status]}>
                      {selectedApplication.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isBn ? "আবেদনের সময়" : "Applied"}</p>
                    <p className="font-medium">{formatDate(selectedApplication.created_at)}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="interviews" className="mt-4">
                {selectedApplication.interview ? (
                  <InterviewDetailCard interview={selectedApplication.interview} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isBn ? "কোনো সাক্ষাৎকার নির্ধারিত হয়নি" : "No interview scheduled yet"}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="messages" className="mt-4">
                <Link
                  href={`/employer/messages?candidate=${selectedApplication.user_id}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <MessageSquare className="h-4 w-4" />
                  {isBn ? "বার্তা পাঠান" : "Send Message"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <ScheduleInterviewModal
          application={selectedApplication}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            setShowScheduleModal(false);
            // Refresh data
            api.get("/employer/accepted-jobs")
              .then((res) => setJobs(res.data.data || []))
              .catch(() => toast.error(isBn ? "গৃহীত চাকরি লোড করতে ব্যর্থ" : "Failed to load accepted jobs"));
          }}
        />
      )}
    </div>
  );
}
