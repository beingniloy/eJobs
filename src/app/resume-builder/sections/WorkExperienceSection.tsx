"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { job_title: "", city: "", employer: "", start_date: "", end_date: "", description: "" };
const MAX = { job_title: 100, city: 100, employer: 100 };
interface Props { data: any[]; onChange: (d: any[]) => void; isBn: boolean; }

export default function WorkExperienceSection({ data, onChange, isBn }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const update = (i: number, key: string, val: string) => {
    const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(n);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Work experience</h3>
      {data.map((exp, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-3 hover:bg-muted/50 text-left">
            <span className="text-sm font-medium truncate">{exp.job_title || exp.employer || "Work entry"}</span>
            <span className="text-xs text-muted-foreground">{exp.start_date || "—"} - {exp.end_date || "—"}</span>
          </button>
          {openIdx === i && (
            <div className="p-3 border-t space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Job Title</Label><div className="relative"><Input value={exp.job_title} onChange={(e) => update(i, "job_title", e.target.value)} placeholder="e.g. Sales Manager" className="h-8 text-sm" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{(exp.job_title || "").length}/{MAX.job_title}</span></div></div>
                <div className="space-y-1"><Label className="text-xs">City/Town</Label><div className="relative"><Input value={exp.city} onChange={(e) => update(i, "city", e.target.value)} placeholder="e.g. San Francisco" className="h-8 text-sm" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{(exp.city || "").length}/{MAX.city}</span></div></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Employer</Label><div className="relative"><Input value={exp.employer} onChange={(e) => update(i, "employer", e.target.value)} placeholder="e.g. PwC" className="h-8 text-sm" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{(exp.employer || "").length}/{MAX.employer}</span></div></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" value={exp.start_date} onChange={(e) => update(i, "start_date", e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">End Date</Label><Input type="date" value={exp.end_date} onChange={(e) => update(i, "end_date", e.target.value)} className="h-8 text-sm" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={exp.description} onChange={(e) => update(i, "description", e.target.value)} rows={3} className="text-sm" /></div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(data.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                <Button size="sm" onClick={() => toast.success("Saved!")}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => { onChange([...data, { ...EMPTY }]); setOpenIdx(data.length); }}><Plus className="h-4 w-4 mr-1" />Add another work experience</Button>
    </div>
  );
}