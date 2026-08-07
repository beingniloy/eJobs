"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { JobApplication } from "@/types";
import { candidateLabel } from "./applicants-utils";

interface Props {
  app: JobApplication | null;
  isBn: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: string) => Promise<void>;
}

const STATUSES = ["pending", "reviewed", "shortlisted", "rejected", "hired"];

export function StatusChangeDialog({ app, isBn, onOpenChange, onStatusChange }: Props) {
  if (!app) return null;

  return (
    <Dialog open={!!app} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isBn ? "স্ট্যাটাস পরিবর্তন করুন" : "Change Applicant Status"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {candidateLabel(app)} — {app.job?.title || "Job"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={app.status === s ? "default" : "outline"}
                size="sm"
                className="capitalize"
                onClick={() => onStatusChange(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}