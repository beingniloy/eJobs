"use client";

import React, { useState, useRef, useEffect } from "react";
import type { useResumeWizard } from "@/hooks/use-resume-wizard";
import { useThemeStore } from "@/store/theme-store";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronDown, ChevronUp, User, Loader2 } from "lucide-react";
import { compressToWebp } from "@/components/cv/sections/utils";
import { getStorageUrl } from "@/lib/utils";

const MAX_CHARS = { full_name: 80, email: 80, phone: 30, address: 100, zip_code: 20, city: 50 };
const GENDERS = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];

export default function PersonalStep({ wizard, onNext }: { wizard: ReturnType<typeof useResumeWizard>; onNext: () => void }) {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const { user } = useAuth();
  const { data, updatePersonal } = wizard;
  const p = data.personal;
  const [showMore, setShowMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importedRef = useRef(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Auto-import from logged-in profile on mount
  useEffect(() => {
    if (!user || importedRef.current) return;
    importedRef.current = true;

    const p = wizard.data.personal;
    if (p.first_name && p.email) return;

    const updates: Record<string, string> = {};
    if (user.name) {
      const parts = user.name.split(" ");
      updates.first_name = parts[0] || "";
      updates.last_name = parts.slice(1).join(" ") || "";
      updates.full_name = user.name;
    }
    if (user.email) updates.email = user.email;

    api.get("/candidate/dashboard").then((res) => {
      const prof = res.data?.user?.profile || {};
      if (prof.phone) updates.phone = prof.phone;
      if (prof.city) updates.city = prof.city;
      if (prof.current_position) updates.additional_info = prof.current_position;
      if (prof.date_of_birth) updates.dob = prof.date_of_birth;
      if (prof.gender) updates.gender = prof.gender;
      if (prof.nationality) updates.nationality = prof.nationality;
      if (prof.linkedin_url) updates.linkedin = prof.linkedin_url;
      if (prof.github_url) updates.website = prof.github_url;
      if (prof.avatar) updates.photo_url = getStorageUrl(prof.avatar) || "";
      if (prof.present_address || prof.address) updates.address = prof.present_address || prof.address;
      if (prof.marital_status) updates.marital_status = prof.marital_status;
      updatePersonal(updates);
    }).catch(() => {
      if (Object.keys(updates).length > 0) updatePersonal(updates);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: string, val: string, max?: number) => {
    if (max && val.length > max) return;
    updatePersonal({ [key]: val });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error(isBn ? "শুধুমাত্র ছবি" : "Only images"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error(isBn ? "২MB এর কম" : "Max 2MB"); return; }
    setUploadingPhoto(true);
    try {
      const compressed = await compressToWebp(file);
      const formData = new FormData();
      formData.append("photo", compressed);
      const res = await api.post("/candidate/cv/profile/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const photoUrl = res.data?.data?.photo_url || res.data?.photo_url;
      if (photoUrl) {
        updatePersonal({ photo_url: photoUrl });
        toast.success(isBn ? "ছবি আপলোড হয়েছে" : "Photo uploaded");
      } else {
        toast.error(isBn ? "ছবি আপলোড ব্যর্থ" : "Upload failed");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isBn ? "ছবি আপলোড ব্যর্থ" : "Upload failed");
      toast.error(msg);
    } finally {
      setUploadingPhoto(false);
    }
    e.target.value = "";
  };

  const photoDisplay = p.photo_url
    ? (p.photo_url.startsWith("http") || p.photo_url.startsWith("blob:")) ? p.photo_url : getStorageUrl(p.photo_url)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <h2 className="text-xl font-bold">Personal details</h2>
        <p className="text-sm text-muted-foreground">Resume language: English</p>

        <div className="flex items-center gap-4">
          <button type="button" onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer shrink-0">
            {uploadingPhoto ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : photoDisplay ? (
              <img src={photoDisplay} alt="Photo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground/40" />
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
          <div className="text-sm">
            <p className="font-medium">Add photo (optional)</p>
            <p className="text-muted-foreground text-xs">JPEG/PNG/WebP — max 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First name <span className="text-destructive">*</span></Label>
            <div className="relative"><Input value={p.first_name} onChange={(e) => { set("first_name", e.target.value, MAX_CHARS.full_name); set("full_name", (e.target.value + " " + p.last_name).trim()); }} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.first_name.length}/{MAX_CHARS.full_name}</span></div>
          </div>
          <div className="space-y-1.5">
            <Label>Last name <span className="text-destructive">*</span></Label>
            <div className="relative"><Input value={p.last_name} onChange={(e) => { set("last_name", e.target.value, MAX_CHARS.full_name); set("full_name", (p.first_name + " " + e.target.value).trim()); }} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.last_name.length}/{MAX_CHARS.full_name}</span></div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Email address <span className="text-destructive">*</span></Label>
          <div className="relative"><Input type="email" value={p.email} onChange={(e) => set("email", e.target.value, MAX_CHARS.email)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.email.length}/{MAX_CHARS.email}</span></div>
        </div>

        <div className="space-y-1.5">
          <Label>Phone number <span className="text-destructive">*</span></Label>
          <div className="relative"><Input type="tel" value={p.phone} onChange={(e) => set("phone", e.target.value, MAX_CHARS.phone)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.phone.length}/{MAX_CHARS.phone}</span></div>
        </div>

        <div className="space-y-1.5">
          <Label>Address</Label>
          <div className="relative"><Input value={p.address} onChange={(e) => set("address", e.target.value, MAX_CHARS.address)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.address.length}/{MAX_CHARS.address}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Zip code</Label>
            <div className="relative"><Input value={p.zip_code} onChange={(e) => set("zip_code", e.target.value, MAX_CHARS.zip_code)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.zip_code.length}/{MAX_CHARS.zip_code}</span></div>
          </div>
          <div className="space-y-1.5">
            <Label>City/Town</Label>
            <div className="relative"><Input value={p.city} onChange={(e) => set("city", e.target.value, MAX_CHARS.city)} placeholder="e.g. San Francisco" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{p.city.length}/{MAX_CHARS.city}</span></div>
          </div>
        </div>

        <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          Additional information {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showMore && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1.5"><Label>Date of birth</Label><Input type="date" value={p.dob} onChange={(e) => set("dob", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Place of birth</Label><Input value={p.place_of_birth} onChange={(e) => set("place_of_birth", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Driving license</Label><Input value={p.driving_license} onChange={(e) => set("driving_license", e.target.value)} placeholder="e.g. A, B" /></div>
            <div className="space-y-1.5"><Label>Gender</Label><Select value={p.gender} onValueChange={(v) => set("gender", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Nationality</Label><Input value={p.nationality} onChange={(e) => set("nationality", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Marital status</Label><Select value={p.marital_status} onValueChange={(v) => set("marital_status", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{MARITAL.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={p.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
            <div className="space-y-1.5"><Label>Website</Label><Input value={p.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." /></div>
            <div className="space-y-1.5"><Label>Additional information</Label><Textarea value={p.additional_info} onChange={(e) => set("additional_info", e.target.value)} rows={3} /></div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => toast.info("Draft saved!")}>Save draft</Button>
          <Button onClick={() => { if (!p.first_name || !p.email || !p.phone) { toast.error("Please fill in required fields"); return; } onNext(); }}>
            Next step <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-2">
        <Card className="sticky top-24"><CardContent className="p-4 text-center text-sm text-muted-foreground space-y-2">
          <p>Your resume will be created based on the information you provide.</p>
          <p className="text-xs">By clicking &quot;Next step&quot;, you will begin creating your resume and you agree to our general terms and privacy policy.</p>
        </CardContent></Card>
      </div>
    </div>
  );
}