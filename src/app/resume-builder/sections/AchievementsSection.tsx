"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface Props { data: any[]; onChange: (d: any[]) => void; isBn: boolean; }

export default function AchievementsSection({ data, onChange, isBn }: Props) {
  const entry = data[0] || { description: "" };

  const update = (val: string) => {
    const n = [...data]; n[0] = { ...n[0], description: val }; onChange(n.length ? n : [{ description: val }]);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Achievements</h3>
      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea value={entry.description || ""} onChange={(e) => update(e.target.value)} rows={4} placeholder="List your key achievements..." className="text-sm" />
      </div>
      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={() => toast.success("Saved!")}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
      </div>
    </div>
  );
}