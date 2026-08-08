"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { useAuthStore } from "@/store/auth-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getStorageUrl } from "@/lib/utils";
import {
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  RefreshCw,
  Send,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  FileArchive,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DeliveryRecord {
  id: number;
  message: string;
  attachments?: string[];
  status: string;
  created_at: string;
}

interface WorkspaceProject {
  id: number;
  job_id: number;
  title: string;
  description?: string;
  budget?: number;
  project_status: "in_progress" | "submitted" | "revision_requested" | "completed" | "disputed";
  candidate?: { id: number; name: string; avatar?: string };
  assigned_to?: number;
  company?: { id: number; name: string; logo?: string };
  escrow?: { amount: number; status: string; platform_fee?: number };
  deliveries?: DeliveryRecord[];
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  pending?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: Clock },
  submitted: { label: "Submitted", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300", icon: Send },
  revision_requested: { label: "Revision Requested", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300", icon: RefreshCw },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: CheckCircle },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: AlertTriangle },
};

function formatChatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function EmployerWorkspacePage() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const siteName = settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs";
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  useEffect(() => {
    document.title = isBn ? `কর্মক্ষেত্র | ${siteName}` : `Workspace | ${siteName}`;
  }, [isBn, siteName]);

  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loading } = useQuery<WorkspaceProject[]>({
    queryKey: ["employer", "workspace"],
    queryFn: async () => {
      const res = await api.get("/employer/workspace");
      return res.data.data || [];
    },
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  const [selectedProject, setSelectedProject] = useState<WorkspaceProject | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionProject, setRevisionProject] = useState<WorkspaceProject | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);

  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [showSubmissionInfo, setShowSubmissionInfo] = useState(true);
  const [releaseProject, setReleaseProject] = useState<WorkspaceProject | null>(null);
  const [releasing, setReleasing] = useState(false);

  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeProject, setDisputeProject] = useState<WorkspaceProject | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputing, setDisputing] = useState(false);

  const otherParty = useMemo(() => selectedProject?.candidate, [selectedProject]);

  const invalidateProjects = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["employer", "workspace"] });
  }, [queryClient]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async (targetUserId: number) => {
    try {
      const res = await api.get(`/messages/direct/${targetUserId}`);
      setChatMessages(res.data.data?.messages || []);
    } catch { /* silent on poll */ }
  }, []);

  const selectProject = useCallback(async (project: WorkspaceProject) => {
    setSelectedProject(project);
    setShowMobileChat(true);
    setChatMessages([]);
    setChatInput("");
    const other = project.candidate;
    if (!other) return;
    setChatLoading(true);
    try {
      const res = await api.get(`/messages/direct/${other.id}`);
      setChatMessages(res.data.data?.messages || []);
    } catch {
      toast.error(isBn ? "বার্তা লোড করতে ব্যর্থ" : "Failed to load messages");
    } finally {
      setChatLoading(false);
    }
  }, [isBn]);

  useEffect(() => {
    const other = selectedProject?.candidate;
    if (other) {
      pollRef.current = setInterval(() => fetchMessages(other.id), 10000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedProject, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [chatMessages, scrollToBottom]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !otherParty || !currentUserId) return;
    const text = chatInput.trim();
    const tempId = -Date.now();
    setChatMessages((prev) => [
      ...prev,
      { id: tempId, sender_id: currentUserId, receiver_id: otherParty.id, message: text, created_at: new Date().toISOString(), is_read: true, pending: true },
    ]);
    setChatInput("");
    setSendingMessage(true);
    try {
      const res = await api.post(`/messages/direct/${otherParty.id}`, { message: text });
      const saved = res.data.data;
      setChatMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatInput(text);
      toast.error(isBn ? "বার্তা পাঠাতে ব্যর্থ" : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRelease = async () => {
    if (!releaseProject) return;
    setReleasing(true);
    try {
      await api.post(`/employer/workspace/${releaseProject.job_id}/release`);
      toast.success(isBn ? "পেমেন্ট সফলভাবে মুক্তি দেওয়া হয়েছে!" : "Payment released successfully!");
      setReleaseDialogOpen(false);
      invalidateProjects();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (isBn ? "মুক্তি দিতে ব্যর্থ" : "Failed to release payment");
      toast.error(msg);
    } finally {
      setReleasing(false);
    }
  };

  const handleOpenRevision = (project: WorkspaceProject) => {
    setRevisionProject(project);
    setRevisionNote("");
    setRevisionDialogOpen(true);
  };

  const handleRequestRevision = async () => {
    if (!revisionProject || !revisionNote.trim()) {
      toast.error(isBn ? "পুনর্দর্শন নোট লিখুন" : "Please write a revision note");
      return;
    }
    setRevisionLoading(true);
    try {
      await api.post(`/employer/workspace/${revisionProject.job_id}/revision`, { revision_note: revisionNote });
      toast.success(isBn ? "পুনর্দর্শন অনুরোধ পাঠানো হয়েছে!" : "Revision requested successfully!");
      setRevisionDialogOpen(false);
      invalidateProjects();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (isBn ? "পুনর্দর্শন অনুরোধ করতে ব্যর্থ" : "Failed to request revision");
      toast.error(msg);
    } finally {
      setRevisionLoading(false);
    }
  };

  const handleOpenDispute = (project: WorkspaceProject) => {
    setDisputeProject(project);
    setDisputeReason("");
    setDisputeDialogOpen(true);
  };

  const handleDispute = async () => {
    if (!disputeProject || !disputeReason.trim()) {
      toast.error(isBn ? "কারণ লিখুন" : "Please provide a reason");
      return;
    }
    setDisputing(true);
    try {
      await api.post(`/employer/workspace/${disputeProject.job_id}/dispute`, { reason: disputeReason });
      toast.success(isBn ? "বিরোধ জমা দেওয়া হয়েছে" : "Dispute submitted");
      setDisputeDialogOpen(false);
      invalidateProjects();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (isBn ? "বিরোধ জমা দিতে ব্যর্থ" : "Failed to submit dispute");
      toast.error(msg);
    } finally {
      setDisputing(false);
    }
  };

  const canRelease = (s: string) => s === "submitted";
  const canRevision = (s: string) => s === "submitted";

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] -m-6 md:-mx-6 md:-my-6 overflow-hidden">
      {/* LEFT PANEL */}
      <div className={`${showMobileChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-1/3 lg:w-[30%] border-r bg-background overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">{isBn ? "কর্মক্ষেত্র" : "Workspace"}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={invalidateProjects} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4"><div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{isBn ? "এখনো কোনো প্রজেক্ট নেই" : "No projects in workspace yet"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {projects.map((project) => {
                const si = statusConfig[project.project_status] || statusConfig.in_progress;
                const active = selectedProject?.id === project.id;
                const other = project.candidate;
                return (
                  <button key={project.id} onClick={() => selectProject(project)} className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${active ? "bg-muted/70" : ""}`}>
                    <div className="flex items-start gap-3">
                      <DefaultAvatar src={other?.avatar} name={other?.name} className="h-10 w-10 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium truncate">{project.title}</h3>
                          <Badge className={`shrink-0 text-[10px] px-1.5 py-0 ${si.color}`}>{si.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{other?.name || (isBn ? "কোনো প্রার্থী বরাদ্দ হয়নি" : "No candidate assigned")}</p>
                        {project.budget != null && <p className="text-xs font-medium mt-1">{formatCurrency(project.budget)}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`${showMobileChat ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0 bg-background overflow-hidden`}>
        {!selectedProject ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <Briefcase className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-1">{isBn ? "চ্যাট শুরু করতে একটি প্রজেক্ট নির্বাচন করুন" : "Select a project to start chatting"}</h3>
              <p className="text-sm text-muted-foreground/60">{isBn ? "বাম পাশের তালিকা থেকে একটি প্রজেক্ট বেছে নিন" : "Pick a project from the list on the left"}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden shrink-0" onClick={() => setShowMobileChat(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DefaultAvatar src={otherParty?.avatar} name={otherParty?.name} className="h-9 w-9 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{selectedProject.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{otherParty?.name || ""}</p>
              </div>
              {(() => {
                const si = statusConfig[selectedProject.project_status] || statusConfig.in_progress;
                const Icon = si.icon;
                return <Badge className={`shrink-0 ${si.color}`}><Icon className="h-3 w-3 mr-1" />{si.label}</Badge>;
              })()}
            </div>

            <div className="border-b shrink-0">
              {/* Collapsible header */}
              <button
                type="button"
                onClick={() => setShowSubmissionInfo(!showSubmissionInfo)}
                className="w-full px-4 py-3 bg-muted/30 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {selectedProject.budget != null && (
                    <span className="flex items-center gap-1 font-semibold text-sm"><DollarSign className="h-4 w-4" />{formatCurrency(selectedProject.budget)}</span>
                  )}
                  {selectedProject.deliveries && selectedProject.deliveries.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {selectedProject.deliveries.length} {isBn ? "জমাকৃত" : "submitted"}
                    </span>
                  )}
                </div>
                {showSubmissionInfo ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {/* Collapsible content */}
              {showSubmissionInfo && (
                <div className="px-4 py-3 bg-muted/30">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {selectedProject.escrow && (
                      <>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {isBn ? "এসক্রো:" : "Escrow:"}{" "}
                          <span className="font-medium text-foreground">{formatCurrency(selectedProject.escrow.amount)}</span>
                          <Badge variant="outline" className="text-[10px] ml-0.5">{selectedProject.escrow.status}</Badge>
                        </span>
                        {selectedProject.escrow.platform_fee != null && (
                          <span className="text-muted-foreground text-xs">{isBn ? "প্ল্যাটফর্ম ফি:" : "Fee:"} {formatCurrency(selectedProject.escrow.platform_fee)}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {canRelease(selectedProject.project_status) && (
                      <Button size="sm" onClick={() => { setReleaseProject(selectedProject); setReleaseDialogOpen(true); }}>
                        <CheckCircle className="h-4 w-4 mr-1.5" />{isBn ? "পেমেন্ট মুক্তি দিন" : "Approve & Release"}
                      </Button>
                    )}
                    {canRevision(selectedProject.project_status) && (
                      <Button size="sm" variant="outline" onClick={() => handleOpenRevision(selectedProject)}>
                        <RefreshCw className="h-4 w-4 mr-1.5" />{isBn ? "পুনর্দর্শন" : "Request Revision"}
                      </Button>
                    )}
                    {selectedProject.project_status !== "completed" && selectedProject.project_status !== "disputed" && (
                      <Button size="sm" variant="outline" onClick={() => handleOpenDispute(selectedProject)}>
                        <AlertTriangle className="h-4 w-4 mr-1.5" />{isBn ? "বিরোধ" : "Open Dispute"}
                      </Button>
                    )}
                  </div>

                  {/* Deliveries */}
                  {selectedProject.deliveries && selectedProject.deliveries.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {isBn ? "জমাকৃত কাজ" : "Submissions"} ({selectedProject.deliveries.length})
                      </p>
                      {selectedProject.deliveries.map((d) => {
                        const hasAttachments = d.attachments && d.attachments.length > 0;
                        return (
                          <div key={d.id} className="p-2 rounded-lg bg-background border text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant={d.status === "submitted" ? "default" : d.status === "revision_requested" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                                  {d.status}
                                </Badge>
                                {d.message && <span className="text-muted-foreground truncate">{d.message}</span>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {hasAttachments && (
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <FileArchive className="h-3 w-3" />
                                    {d.attachments!.length}
                                  </span>
                                )}
                                <span className="text-muted-foreground">{formatDate(d.created_at)}</span>
                              </div>
                            </div>
                            {hasAttachments && (
                              <div className="mt-2 pt-2 border-t space-y-1.5">
                                {d.attachments!.map((attPath, i) => {
                                  const fileUrl = getStorageUrl(attPath) || `/storage/${attPath}`;
                                  const fileName = attPath.split("/").pop() || "file";
                                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attPath);
                                  return (
                                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/50">
                                      {isImage ? (
                                        <img src={fileUrl} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
                                      ) : (
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                      )}
                                      <span className="truncate flex-1 text-muted-foreground">{fileName}</span>
                                      <a href={fileUrl} download className="shrink-0 p-1 rounded hover:bg-background transition-colors">
                                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                      </a>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                      <Skeleton className="h-10 w-48 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">{isBn ? "এখনো কোনো বার্তা নেই। চ্যাট শুরু করুন!" : "No messages yet. Start the conversation!"}</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"} ${msg.pending ? "opacity-70" : ""}`}>
                        {!isOwn && otherParty && <p className="text-xs font-medium mb-0.5 opacity-70">{otherParty.name}</p>}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-1 flex items-center gap-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {msg.pending && <Loader2 className="h-3 w-3 animate-spin" />}
                          {msg.pending ? (isBn ? "পাঠানো হচ্ছে..." : "Sending...") : formatChatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={isBn ? "বার্তা লিখুন..." : "Type a message..."} disabled={sendingMessage} className="flex-1" autoComplete="off" />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!chatInput.trim() || sendingMessage}>
                  {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Release Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{isBn ? "পেমেন্ট মুক্তি দিন" : "Approve & Release Payment"}</DialogTitle>
            {releaseProject && <p className="text-sm text-muted-foreground">{releaseProject.title}</p>}
          </DialogHeader>
          <div className="space-y-4">
            {releaseProject?.escrow && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isBn ? "মোট এসক্রো" : "Total Escrow"}</span>
                  <span className="font-semibold">{formatCurrency(releaseProject.escrow.amount)}</span>
                </div>
                {releaseProject.escrow.platform_fee != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isBn ? "প্ল্যাটফর্ম ফি" : "Platform Fee"}</span>
                    <span>{formatCurrency(releaseProject.escrow.platform_fee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>{isBn ? "প্রার্থীর অংশ" : "Candidate Receives"}</span>
                  <span>{formatCurrency(releaseProject.escrow.amount - (releaseProject.escrow.platform_fee || 0))}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{isBn ? "পেমেন্ট মুক্তি দেওয়া হলে এসক্রো থেকে তহবিল প্রার্থীকে প্রদান করা হবে।" : "Releasing payment will transfer the escrowed funds to the candidate."}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReleaseDialogOpen(false)}>{isBn ? "বাতিল" : "Cancel"}</Button>
              <Button onClick={handleRelease} disabled={releasing} className="flex-1">{releasing ? (isBn ? "মুক্তি দিচ্ছে..." : "Releasing...") : (isBn ? "মুক্তি দিন" : "Release Payment")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{isBn ? "পুনর্দর্শন অনুরোধ" : "Request Revision"}</DialogTitle>
            {revisionProject && <p className="text-sm text-muted-foreground">{revisionProject.title}</p>}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isBn ? "পুনর্দর্শন নোট *" : "Revision Note *"}</Label>
              <Textarea placeholder={isBn ? "কী পরিবর্তন প্রয়োজন তা বিস্তারিত লিখুন..." : "Explain what changes are needed..."} value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} rows={4} className="mt-1" />
            </div>
            <Button onClick={handleRequestRevision} disabled={revisionLoading || !revisionNote.trim()} className="w-full">
              {revisionLoading ? (isBn ? "পাঠাচ্ছে..." : "Sending...") : (isBn ? "পুনর্দর্শন অনুরোধ পাঠান" : "Send Revision Request")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{isBn ? "বিরোধ খোলুন" : "Open Dispute"}</DialogTitle>
            {disputeProject && <p className="text-sm text-muted-foreground">{disputeProject.title}</p>}
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-950 p-3 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
              <p className="text-orange-800 dark:text-orange-300">{isBn ? "বিরোধ খোলা হলে এসক্রো পেমেন্ট স্থগিত থাকবে যতক্ষণ না সমাধান হয়।" : "Opening a dispute will pause the escrow payment until resolved."}</p>
            </div>
            <div>
              <Label>{isBn ? "কারণ *" : "Reason *"}</Label>
              <Textarea placeholder={isBn ? "বিরোধের কারণ বিস্তারিত লিখুন..." : "Explain the reason for the dispute..."} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={4} className="mt-1" />
            </div>
            <Button onClick={handleDispute} disabled={disputing || !disputeReason.trim()} className="w-full" variant="destructive">
              {disputing ? (isBn ? "জমা দিচ্ছে..." : "Submitting...") : (isBn ? "বিরোধ জমা দিন" : "Submit Dispute")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
