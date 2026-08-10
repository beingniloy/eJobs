"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Briefcase, Globe, Wallet } from "lucide-react";
import type { JobApplication } from "@/types";
import type { JobGroup } from "./applicants-utils";
import ApplicantRow from "./ApplicantRow";

interface Props {
  group: JobGroup;
  isExpanded: boolean;
  isBn: boolean;
  onToggle: () => void;
  onStatusChange: (app: JobApplication, status: string) => void;
  onScheduleInterview?: (app: JobApplication) => void;
  pendingId?: number | null;
}

export default function JobGroupCard({ group, isExpanded, isBn, onToggle, onStatusChange, onScheduleInterview, pendingId }: Props) {
  return (
    <Card className="overflow-hidden">
      {/* Header — click to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{group.title}</p>
          <p className="text-xs text-muted-foreground">
            {group.applications.length}{" "}
            {isBn ? "জন আবেদনকারী" : "applicants"}
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

      {/* Applicant list */}
      {isExpanded && (
        <div className="border-t divide-y">
          {group.applications.map((app) => (
            <ApplicantRow
              key={app.id}
              app={app}
              isBn={isBn}
              onStatusChange={onStatusChange}
              onScheduleInterview={onScheduleInterview}
              pending={pendingId === app.id}
            />
          ))}
        </div>
      )}
    </Card>
  );
}