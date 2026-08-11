"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  data: { name: string; designation: string; organization: string; phone: string; email: string }[];
  onChange: (d: { name: string; designation: string; organization: string; phone: string; email: string }[]) => void;
  isBn: boolean;
}

export default function ReferencesSection({ data, onChange, isBn }: Props) {
  const add = () => onChange([...data, { name: "", designation: "", organization: "", phone: "", email: "" }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, key: string, val: string) => {
    const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(n);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">References</h3>
        <Button size="sm" variant="outline" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
      </div>
      {data.length === 0 && <p className="text-sm text-muted-foreground">No references added yet.</p>}
      {data.map((ref, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2 relative">
          <button onClick={() => remove(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={ref.name} onChange={(e) => update(i, "name", e.target.value)} className="text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label className="text-xs">Designation</Label><Input value={ref.designation} onChange={(e) => update(i, "designation", e.target.value)} placeholder="e.g. Senior Manager" className="text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Organization</Label><Input value={ref.organization} onChange={(e) => update(i, "organization", e.target.value)} className="text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={ref.phone} onChange={(e) => update(i, "phone", e.target.value)} className="text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" value={ref.email} onChange={(e) => update(i, "email", e.target.value)} className="text-sm" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
