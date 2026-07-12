"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Calendar, Clock, MapPin, Video, Phone, CheckCircle, XCircle,
  ArrowRight, Loader2, Building2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CandidateInterviewsPage() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/candidate/interviews")
      .then((res) => setInterviews(res.data.data?.data || []))
      .catch(() => { toast.error(isBn ? "সাক্ষাৎকার লোড করতে ব্যর্থ" : "Failed to load interviews"); })
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (interviewId: number, response: "accepted" | "declined") => {
    setSubmitting(true);
    try {
      await api.post(`/candidate/interviews/${interviewId}/respond`, {
        candidate_response: response,
        candidate_note: responseNote || undefined,
      });
      toast.success(response === "accepted"
        ? (isBn ? "সাক্ষাৎকার গৃহীত হয়েছে" : "Interview accepted")
        : (isBn ? "সাক্ষাৎকার প্রত্যাখ্যাত" : "Interview declined")
      );
      setRespondingTo(null);
      setResponseNote("");
      // Refresh
      api.get("/candidate/interviews")
        .then((res) => setInterviews(res.data.data?.data || []))
        .catch(() => { /* silent refresh after action */ });
    } catch {
      toast.error(isBn ? "ব্যর্থ" : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const typeIcons: Record<string, any> = { video: Video, in_person: MapPin, phone: Phone };
  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-orange-100 text-orange-700",
  };
  const responseColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
  };

  const upcoming = interviews.filter((i) => new Date(i.scheduled_at) >= new Date() && i.status === "scheduled");
  const past = interviews.filter((i) => new Date(i.scheduled_at) < new Date() || i.status !== "scheduled");

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isBn ? "সাক্ষাৎকার" : "Interviews"}</h1>
        <p className="text-sm text-muted-foreground">
          {isBn ? "আপনার আসন্ন এবং অতীত সাক্ষাৎকারসমূহ" : "Your upcoming and past interviews"}
        </p>
      </div>

      {/* Upcoming Interviews */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          {isBn ? "আসন্ন সাক্ষাৎকার" : "Upcoming Interviews"}
          <Badge className="bg-blue-100 text-blue-700 text-xs">{upcoming.length}</Badge>
        </h2>
        {upcoming.length === 0 ? (
          <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 text-center">
              <Calendar className="h-10 w-10 text-blue-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{isBn ? "কোনো আসন্ন সাক্ষাৎকার নেই" : "No upcoming interviews"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((interview) => {
              const Icon = typeIcons[interview.type] || Video;
              const scheduled = new Date(interview.scheduled_at);
              return (
                <Card key={interview.id} className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm">{interview.job?.title}</h3>
                          <Badge className={`text-xs ${statusColors[interview.status]}`}>
                            {interview.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {scheduled.toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {scheduled.toLocaleTimeString(isBn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>{interview.duration_minutes} min</span>
                        </div>
                        {interview.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />
                            {interview.type === "video" ? (
                              <a href={interview.location} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{interview.location}</a>
                            ) : interview.location}
                          </p>
                        )}
                        {interview.notes && (
                          <p className="text-xs text-muted-foreground italic mb-2">"{interview.notes}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-xs ${responseColors[interview.candidate_response]}`}>
                            {interview.candidate_response === "pending" ? (isBn ? "অপেক্ষমান" : "Pending") :
                             interview.candidate_response === "accepted" ? (isBn ? "গৃহীত" : "Accepted") :
                             (isBn ? "প্রত্যাখ্যাত" : "Declined")}
                          </Badge>
                          {interview.candidate_response === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleRespond(interview.id, "accepted")} disabled={submitting}>
                                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                {isBn ? "গ্রহণ" : "Accept"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRespond(interview.id, "declined")} disabled={submitting}>
                                {isBn ? "প্রত্যাখ্যান" : "Decline"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Interviews */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            {isBn ? "অতীত সাক্ষাৎকার" : "Past Interviews"}
            <Badge className="bg-gray-100 text-gray-700 text-xs">{past.length}</Badge>
          </h2>
          <div className="grid gap-3">
            {past.map((interview) => {
              const Icon = typeIcons[interview.type] || Video;
              const scheduled = new Date(interview.scheduled_at);
              return (
                <Card key={interview.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">{interview.job?.title}</h3>
                          <div className="flex gap-2">
                            <Badge className={`text-xs ${statusColors[interview.status]}`}>{interview.status}</Badge>
                            <Badge className={`text-xs ${responseColors[interview.candidate_response]}`}>
                              {interview.candidate_response}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {scheduled.toLocaleDateString()} {scheduled.toLocaleTimeString(isBn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {interview.outcome && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{interview.outcome}"</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
