"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Download,
  ClipboardList,
  Loader2,
  Calendar,
} from "lucide-react";
import type { JobApplication } from "@/types";
import { getAvailableStatuses, getStatusLabel, candidateLabel } from "./applicants-utils";

interface Props {
  app: JobApplication;
  profileUrl: string | null;
  isBn: boolean;
  onStatusChange: (app: JobApplication, status: string) => void;
  onScheduleInterview?: (app: JobApplication) => void;
  pending?: boolean;
}

export default function ApplicantActions({ app, profileUrl, isBn, onStatusChange, pending }: Props) {
  const router = useRouter();
  const available = getAvailableStatuses(app.status || "pending");

  const openMessages = () => {
    const cid = app.user?.id ?? app.id;
    if (cid) router.push(`/employer/messages?to=${cid}`);
  };

  if (pending) {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {isBn ? "আপডেট হচ্ছে..." : "Updating..."}
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      {/* Profile */}
      {profileUrl ? (
        <Button variant="ghost" size="icon" className="h-7 w-7" title={isBn ? "প্রোফাইল" : "Profile"} asChild>
          <Link href={profileUrl} target="_blank"><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled><Eye className="h-3.5 w-3.5" /></Button>
      )}

      {/* Message */}
      <Button variant="ghost" size="icon" className="h-7 w-7" title={isBn ? "বার্তা" : "Message"} onClick={openMessages}>
        <MessageSquare className="h-3.5 w-3.5" />
      </Button>

      {/* Quick status buttons for pending/reviewed */}
      {(app.status === "pending" || app.status === "reviewed") && (
        <>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="Shortlist" onClick={() => onStatusChange(app, "shortlisted")}>
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" title="Reject" onClick={() => onStatusChange(app, "rejected")}>
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      {/* Overflow dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {available.length > 0 && (
            <>
              <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isBn ? "স্ট্যাটাস পরিবর্তন" : "Change Status"}
              </p>
              {available.map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange(app, s)}>
                  {s === "shortlisted" && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                  {s === "rejected" && <XCircle className="h-4 w-4 mr-2 text-red-600" />}
                  {s === "reviewed" && <Eye className="h-4 w-4 mr-2 text-blue-600" />}
                  {s === "hired" && <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />}
                  {s === "pending" && <ClipboardList className="h-4 w-4 mr-2 text-yellow-600" />}
                  {getStatusLabel(s, isBn)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {(app as any).resume_url && (
            <DropdownMenuItem onClick={() => window.open((app as any).resume_url, "_blank")}>
              <Download className="h-4 w-4 mr-2" />{isBn ? "সিভি" : "Download CV"}
            </DropdownMenuItem>
          )}

          {profileUrl ? (
            <DropdownMenuItem asChild>
              <Link href={profileUrl} target="_blank">
                <Eye className="h-4 w-4 mr-2" />{isBn ? "প্রোফাইল" : "View Profile"}
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              <Eye className="h-4 w-4 mr-2" />{isBn ? "প্রোফাইল" : "View Profile"}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={openMessages}>
            <MessageSquare className="h-4 w-4 mr-2" />{isBn ? "বার্তা" : "Message"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}