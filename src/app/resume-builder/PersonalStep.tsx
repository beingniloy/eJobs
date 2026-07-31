"use client";

import React, { useState } from "react";
import type { useResumeWizard } from "@/hooks/use-resume-wizard";
import { useThemeStore } from "@/store/theme-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronDown, ChevronUp, User, Upload } from "lucide-react";
import { toast } from "sonner";

const MAX_CHARS = { full_name: 80, email: 80, phone: 30, address: 100, zip_code: 20, city: 50 };
const GENDERS = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];

export default function PersonalStep({ wizard }: { wizard: ReturnType<typeof useResumeWizard> }) {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const { data, setStep } = wizard;
  const p = data.personal;
  const [showMore, setShowMore] = useState(false);

  const set = (key: string, val: string, max?: number) => {
    if (max && val.length > max) return;
    wizard.updatePersonal({ [key]: val });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <h2 className="text-xl font-bold">Personal details</h2>
        <p className="text-sm text-muted-foreground">Resume language: English</p>

        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden">
            {p.photo_url ? <img src={p.photo_url} alt="Photo" className="w-full h-full object-cover rounded-lg" /> : <User className="h-8 w-8 text-muted-foreground/40" />}
          </div>
          <div className="text-sm">
            <p className="font-medium">Add photo (optional)</p>
            <p className="text-muted-foreground text-xs">JPEG/PNG/WebP — max 2MB. Auto-compressed to WebP.</p>
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First name <span className="text-destructive">*</span></Label>
            <div className="relative"><Input value={p.first_name} onChange={(e) => { set("first_name", e.target.value, MAX_CHARS.full_name); set("full_name", (e.target.value + " " + p.last_name).trim()); }} placeholder="" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.first_name.length}/{MAX_CHARS.full_name}</span></div>
          </div>
          <div className="space-y-1.5">
            <Label>Last name <span className="text-destructive">*</span></Label>
            <div className="relative"><Input value={p.last_name} onChange={(e) => { set("last_name", e.target.value, MAX_CHARS.full_name); set("full_name", (p.first_name + " " + e.target.value).trim()); }} placeholder="" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.last_name.length}/{MAX_CHARS.full_name}</span></div>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label>Email address <span className="text-destructive">*</span></Label>
          <div className="relative"><Input type="email" value={p.email} onChange={(e) => set("email", e.target.value, MAX_CHARS.email)} placeholder="" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.email.length}/{MAX_CHARS.email}</span></div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label>Phone number <span className="text-destructive">*</span></Label>
          <div className="relative"><Input type="tel" value={p.phone} onChange={(e) => set("phone", e.target.value, MAX_CHARS.phone)} placeholder="" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.phone.length}/{MAX_CHARS.phone}</span></div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label>Address</Label>
          <div className="relative"><Input value={p.address} onChange={(e) => set("address", e.target.value, MAX_CHARS.address)} placeholder="" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.address.length}/{MAX_CHARS.address}</span></div>
        </div>

        {/* Zip + City */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Zip code</Label>
            <div className="relative"><Input value={p.zip_code} onChange={(e) => set("zip_code", e.target.value, MAX_CHARS.zip_code)} placeholder="" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.zip_code.length}/{MAX_CHARS.zip_code}</span></div>
          </div>
          <div className="space-y-1.5">
            <Label>City/Town</Label>
            <div className="relative"><Input value={p.city} onChange={(e) => set("city", e.target.value, MAX_CHARS.city)} placeholder="e.g. San Francisco" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.city.length}/{MAX_CHARS.city}</span></div>
          </div>
        </div>

        {/* Additional Information Toggle */}
        <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          Additional information {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showMore && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            {/* DOB */}
            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Input type="date" value={p.dob} onChange={(e) => set("dob", e.target.value)} />
            </div>
            {/* Place of Birth */}
            <div className="space-y-1.5">
              <Label>Place of birth</Label>
              <Input value={p.place_of_birth} onChange={(e) => set("place_of_birth", e.target.value)} />
            </div>
            {/* Driving License */}
            <div className="space-y-1.5">
              <Label>Driving license</Label>
              <Input value={p.driving_license} onChange={(e) => set("driving_license", e.target.value)} placeholder="e.g. A, B" />
            </div>
            {/* Gender */}
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={p.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Nationality */}
            <div className="space-y-1.5">
              <Label>Nationality</Label>
              <Input value={p.nationality} onChange={(e) => set("nationality", e.target.value)} />
            </div>
            {/* Marital Status */}
            <div className="space-y-1.5">
              <Label>Marital status</Label>
              <Select value={p.marital_status} onValueChange={(v) => set("marital_status", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{MARITAL.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* LinkedIn */}
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input value={p.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            {/* Website */}
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={p.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
            </div>
            {/* Additional Info */}
            <div className="space-y-1.5">
              <Label>Additional information</Label>
              <Textarea value={p.additional_info} onChange={(e) => set("additional_info", e.target.value)} rows={3} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => toast.info("Draft saved!")}>Save draft</Button>
          <Button onClick={() => { if (!p.first_name || !p.email || !p.phone) { toast.error("Please fill in required fields"); return; } setStep(2); }}>
            Next step <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="hidden lg:block lg:col-span-2">
        <Card className="sticky top-24"><CardContent className="p-4 text-center text-sm text-muted-foreground space-y-2">
          <p>Your resume will be created based on the information you provide.</p>
          <p className="text-xs">By clicking &quot;Next step&quot;, you will begin creating your resume and you agree to our general terms and privacy policy.</p>
        </CardContent></Card>
      </div>
    </div>
  );
}