"use client";

import { useState } from "react";
import { X, Plus, User, Globe, Link2, Code, Twitter, Facebook } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api-client";
import { toast } from "sonner";

const MAX_PHOTO_BYTES = 1.8 * 1024 * 1024;

/** Recursively ensure all values are strings/arrays — prevents Blade htmlspecialchars errors */
function toSafeStrings(v: any): any {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return v.map(toSafeStrings);
  if (typeof v === 'object') {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) { out[k] = toSafeStrings(val); }
    return out;
  }
  return String(v);
}

export default function SectionForm({ section, data, onChange, isBn }: { section: string; data: any; onChange: (d: any) => void; isBn: boolean }) {
  switch (section) {
    case "personal":     return <PersonalSectionForm data={data || {}} onChange={onChange} isBn={isBn} />;
    case "experience":   return <ExperienceSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "education":    return <EducationSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "skills":       return <SkillsSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "certifications": return <CertificationsSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "languages":    return <LanguagesSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "projects":     return <ProjectsSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "awards":       return <AwardsSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "hobbies":      return <HobbiesSectionForm data={data || []} onChange={onChange} isBn={isBn} />;
    case "social_links": return <SocialSectionForm data={data || {}} onChange={onChange} isBn={isBn} />;
    default: return <p className="text-sm text-muted-foreground">{isBn ? "এই সেকশনটি শীঘ্রই আসছে..." : "Coming soon..."}</p>;
  }
}

/* ─── Image compressor ─── */
async function compressToWebp(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const attempts = [
      { maxDim: 500, quality: 0.55 },
      { maxDim: 400, quality: 0.50 },
      { maxDim: 350, quality: 0.45 },
      { maxDim: 300, quality: 0.40 },
      { maxDim: 250, quality: 0.35 },
    ];
    for (const { maxDim, quality } of attempts) {
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/webp", quality);
      const base64 = dataUrl.split(",")[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "image/webp" });
      if (blob.size <= MAX_PHOTO_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, 200, 200);
    const dataUrl = canvas.toDataURL("image/webp", 0.35);
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/webp" });
    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
  } catch { return file; }
  finally { URL.revokeObjectURL(url); }
}

/* ═══════════════════════════════════════════════════
   Personal Details
   ═══════════════════════════════════════════════════ */

function PersonalSectionForm({ data, onChange, isBn }: { data: Record<string, any>; onChange: (d: any) => void; isBn: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isBn ? "শুধুমাত্র ছবি অনুমোদিত" : "Only image files are allowed");
      e.target.value = ""; return;
    }
    setUploading(true);
    try {
      const compressed = await compressToWebp(file);
      toast.info(`${isBn ? "সংকুচিত" : "Compressed"}: ${(compressed.size / 1024).toFixed(0)}KB`);
      const formData = new FormData();
      formData.append("photo", compressed);
      const res = await api.post("/candidate/cv/profile/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const photoUrl = res.data?.data?.photo_url || res.data?.photo_url;
      if (photoUrl) onChange(toSafeStrings({ ...data, photo_url: photoUrl }));
      toast.success(isBn ? "ছবি আপলোড হয়েছে!" : "Photo uploaded!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || (isBn ? "আপলোড ব্যর্থ" : "Upload failed"));
    } finally { setUploading(false); }
    e.target.value = "";
  };

  const photoUrl = data.photo_url
    ? (data.photo_url.startsWith("http") ? data.photo_url : `/storage/${data.photo_url}`)
    : null;

  const field = (en: string, bn: string, key: string, type = "text", placeholder?: string, validate?: (v: string) => string | null) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{isBn ? bn : en}</Label>
      <Input type={type} value={data[key] || ""} onChange={(e) => { onChange(toSafeStrings({ ...data, [key]: e.target.value })); if (validate) setFieldErrors((p) => ({ ...p, [key]: validate(e.target.value) || "" })); }} placeholder={placeholder || (isBn ? bn : en)} className="h-9 text-sm" />
      {fieldErrors[key] && <p className="text-xs text-destructive h-4">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30 shrink-0">
          {photoUrl ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground/50" />}
        </div>
        <div className="flex-1 min-w-0">
          <Label className="text-xs font-medium">{isBn ? "প্রোফাইল ছবি" : "Profile Photo"}</Label>
          <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="h-8 text-sm mt-1" />
          {uploading && <p className="text-xs text-muted-foreground mt-1">{isBn ? "আপলোড হচ্ছে..." : "Compressing & uploading..."}</p>}
        </div>
      </div>
      {field("Full Name", "পূর্ণ নাম", "full_name", "text", isBn ? "আপনার পূর্ণ নাম" : "John Doe")}
      {field("Professional Title", "পেশাদার উপাধি", "title", "text", isBn ? "যেমন: সফটওয়্যার ইঞ্জিনিয়ার" : "e.g. Software Engineer")}
      {field("Email", "ইমেইল", "email", "email", isBn ? "আপনা@উদাহরণ.com" : "you@example.com", (v) => v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? (isBn ? "সঠিক ইমেইল দিন" : "Invalid email") : null)}
      {field("Phone", "ফোন", "phone", "tel", isBn ? "০১XXXXXXXXX" : "01XXXXXXXXX", (v) => v.trim() && !/^[+]?[\d\s()-]{7,20}$/.test(v) ? (isBn ? "সঠিক ফোন" : "Invalid phone") : null)}
      {field("Location", "অবস্থান", "location", "text", isBn ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh")}
      {field("Address", "ঠিকানা", "address", "text", isBn ? "পুরো ঠিকানা" : "Full address")}
      {field("Website", "ওয়েবসাইট", "website", "url", "https://...", (v) => v.trim() && !/^https?:\/\//i.test(v) ? (isBn ? "https:// দিয়ে শুরু করুন" : "Must start with http(s)") : null)}
      {field("LinkedIn", "LinkedIn", "linkedin", "url", "https://linkedin.com/in/...", (v) => v.trim() && !/^https?:\/\//i.test(v) ? (isBn ? "https:// দিয়ে শুরু করুন" : "Must start with http(s)") : null)}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{isBn ? "সারসংক্ষেপ" : "Summary"}</Label>
        <Textarea value={data.summary || ""} onChange={(e) => onChange(toSafeStrings({ ...data, summary: e.target.value }))} placeholder={isBn ? "পেশাদার সারসংক্ষেপ..." : "Professional summary..."} className="min-h-[100px] text-sm" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Work Experience
   ═══════════════════════════════════════════════════ */

function ExperienceSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const addEntry = () => onChange(toSafeStrings([...data, { company: "", position: "", location: "", start_date: "", end_date: "", is_current: false, description: "" }]));
  const remove = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));
  const update = (i: number, key: string, val: any) => {
    const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(toSafeStrings(n));
  };

  return (
    <div className="space-y-4">
      {data.map((exp, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2 relative">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(i)}><X className="h-3 w-3" /></Button>
          <Input value={exp.position || exp.job_title || ""} onChange={(e) => update(i, "position", e.target.value)} placeholder={isBn ? "পদবি / শিরোনাম" : "Job Title / Position"} className="h-8 text-sm" />
          <Input value={exp.company || exp.company_name || ""} onChange={(e) => update(i, "company", e.target.value)} placeholder={isBn ? "কোম্পানি / প্রতিষ্ঠান" : "Company / Organization"} className="h-8 text-sm" />
          <Input value={exp.location || ""} onChange={(e) => update(i, "location", e.target.value)} placeholder={isBn ? "স্থান (ঐচ্ছিক)" : "Location (optional)"} className="h-8 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "শুরু" : "Start"}</Label>
              <Input type="date" value={exp.start_date || ""} onChange={(e) => update(i, "start_date", e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "শেষ" : "End"}</Label>
              <Input type="date" value={exp.end_date || ""} onChange={(e) => update(i, "end_date", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <Textarea value={exp.description || ""} onChange={(e) => update(i, "description", e.target.value)} placeholder={isBn ? "দায়িত্ব / অর্জন..." : "Responsibilities / Achievements..."} className="min-h-[60px] text-sm" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />{isBn ? "অভিজ্ঞতা যোগ" : "Add Experience"}</Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Education
   ═══════════════════════════════════════════════════ */

function EducationSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const addEntry = () => onChange(toSafeStrings([...data, {
    degree: "", institution: "", board: "", field: "",
    group_or_subject: "", start_date: "", end_date: "",
    year: "", result: "", gpa_or_cgpa: "", description: "",
  }]));
  const remove = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));
  const update = (i: number, key: string, val: any) => {
    const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(toSafeStrings(n));
  };
  const updateMulti = (i: number, keys: Record<string, any>) => {
    const n = [...data]; n[i] = { ...n[i], ...keys }; onChange(toSafeStrings(n));
  };

  return (
    <div className="space-y-4">
      {data.map((edu, i) => {
        const level = edu.degree || edu.level || "";
        const isHigherEdu = level === "graduation" || level === "post_graduation" || level === "phd";
        const levelLabel = isHigherEdu ? (isBn ? "ডিগ্রি" : "Degree") : (isBn ? "পর্যায়" : "Level");

        return (
          <div key={i} className="p-3 border rounded-lg space-y-3 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(i)}><X className="h-3 w-3" /></Button>

            <div>
              <Label className="text-[10px] text-muted-foreground">{levelLabel} *</Label>
              <Input
                value={edu.degree || ""}
                onChange={(e) => update(i, "degree", e.target.value)}
                placeholder={isBn ? "যেমন: SSC, HSC, B.Sc, M.Sc" : "e.g. SSC, HSC, B.Sc, M.Sc"}
                className="h-8 text-sm"
              />
            </div>

            {!isHigherEdu && (
              <div>
                <Label className="text-[10px] text-muted-foreground">{isBn ? "বোর্ড" : "Board"}</Label>
                <Input
                  value={edu.board || ""}
                  onChange={(e) => update(i, "board", e.target.value)}
                  placeholder={isBn ? "যেমন: ঢাকা শিক্ষা বোর্ড" : "e.g. Dhaka Board"}
                  className="h-8 text-sm"
                />
              </div>
            )}

            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "প্রতিষ্ঠান" : "Institution"} *</Label>
              <Input
                value={edu.institution || edu.school_name || ""}
                onChange={(e) => update(i, "institution", e.target.value)}
                placeholder={isBn ? "প্রতিষ্ঠানের নাম" : "School / College / University name"}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "স্থান" : "Location"}</Label>
              <Input
                value={edu.location || ""}
                onChange={(e) => update(i, "location", e.target.value)}
                placeholder={isBn ? "যেমন: ঢাকা" : "e.g. Dhaka"}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "বিষয় / গ্রুপ" : "Group / Subject / Field"}</Label>
              <Input
                value={edu.field || edu.group_or_subject || ""}
                onChange={(e) => updateMulti(i, { field: e.target.value, group_or_subject: e.target.value })}
                placeholder={isHigherEdu
                  ? (isBn ? "বিষয় (যেমন: CSE)" : "Subject (e.g. CSE)")
                  : (isBn ? "গ্রুপ (যেমন: বিজ্ঞান)" : "Group (e.g. Science)")}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">{isBn ? "পাশের সাল" : "Passing Year"}</Label>
                <Input
                  type="number"
                  value={edu.year || edu.passing_year || ""}
                  onChange={(e) => updateMulti(i, { year: e.target.value, passing_year: e.target.value })}
                  placeholder={isBn ? "২০২২" : "2022"}
                  className="h-8 text-sm"
                  min="1950" max="2099"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isBn ? "বছর" : "Duration (Year)"}</Label>
                <Input
                  value={edu.duration || ""}
                  onChange={(e) => update(i, "duration", e.target.value)}
                  placeholder={isBn ? "যেমন: ২০২০-২০২২" : "e.g. 2020-2022"}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">{isHigherEdu ? "CGPA" : "GPA"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  max="5"
                  value={edu.gpa_or_cgpa || edu.gpa || ""}
                  onChange={(e) => updateMulti(i, { gpa_or_cgpa: e.target.value, gpa: e.target.value, cgpa: e.target.value })}
                  placeholder={isHigherEdu ? "CGPA (e.g. 3.80)" : "GPA (e.g. 5.00)"}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isBn ? "গ্রেড / ফলাফল" : "Grade / Result"}</Label>
                <Input
                  value={edu.grade || edu.result || ""}
                  onChange={(e) => updateMulti(i, { grade: e.target.value, result: e.target.value })}
                  placeholder={isBn ? "যেমন: A+" : "e.g. A+, First Class"}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "অতিরিক্ত তথ্য" : "Additional Info"}</Label>
              <Textarea
                value={edu.description || ""}
                onChange={(e) => update(i, "description", e.target.value)}
                placeholder={isBn ? "অতিরিক্ত তথ্য (ঐচ্ছিক)" : "Any extra info (optional)"}
                className="min-h-[40px] text-sm"
              />
            </div>
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={addEntry} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />{isBn ? "শিক্ষা যোগ" : "Add Education"}</Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Key Skills
   ═══════════════════════════════════════════════════ */

function SkillsSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState("intermediate");
  const addSkill = () => { if (!newSkill.trim()) return; onChange(toSafeStrings([...data, { name: newSkill.trim(), level: newLevel }])); setNewSkill(""); };
  const removeSkill = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 min-h-[40px]">
        {data.map((skill, i) => (
          <Badge key={i} variant="secondary" className="text-xs gap-1">
            {typeof skill === "string" ? skill : skill.name}
            {!false && <button onClick={() => removeSkill(i)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder={isBn ? "দক্ষতা..." : "Skill..."} className="h-8 text-sm flex-1" onKeyDown={(e) => e.key === "Enter" && addSkill()} />
        <Select value={newLevel} onValueChange={setNewLevel}>
          <SelectTrigger className="w-[120px] h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">{isBn ? "শিক্ষানবিস" : "Beginner"}</SelectItem>
            <SelectItem value="intermediate">{isBn ? "মধ্যম" : "Intermediate"}</SelectItem>
            <SelectItem value="advanced">{isBn ? "উন্নত" : "Advanced"}</SelectItem>
            <SelectItem value="expert">{isBn ? "বিশেষজ্ঞ" : "Expert"}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={addSkill}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Certifications
   ═══════════════════════════════════════════════════ */

function CertificationsSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const addEntry = () => onChange(toSafeStrings([...data, { name: "", issuer: "", date: "" }]));
  const update = (i: number, key: string, val: string) => { const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(toSafeStrings(n)); };
  const remove = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));

  return (
    <div className="space-y-3">
      {data.map((cert, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2 relative">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(i)}><X className="h-3 w-3" /></Button>
          <Input value={cert.name || ""} onChange={(e) => update(i, "name", e.target.value)} placeholder={isBn ? "সার্টিফিকেশন" : "Certification"} className="h-8 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={cert.issuer || ""} onChange={(e) => update(i, "issuer", e.target.value)} placeholder={isBn ? "প্রদানকারী" : "Issuer"} className="h-8 text-sm" />
            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "তারিখ" : "Date"}</Label>
              <Input type="date" value={cert.date || ""} onChange={(e) => update(i, "date", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />{isBn ? "সার্টিফিকেশন যোগ" : "Add Certification"}</Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Languages
   ═══════════════════════════════════════════════════ */

function LanguagesSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const addEntry = () => onChange(toSafeStrings([...data, { name: "", proficiency: "intermediate" }]));
  const update = (i: number, key: string, val: string) => { const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(toSafeStrings(n)); };
  const remove = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));
  const proficiencies = [
    { value: "basic", en: "Basic", bn: "মৌলিক" },
    { value: "conversational", en: "Conversational", bn: "কথোপকথন" },
    { value: "professional", en: "Professional", bn: "পেশাদার" },
    { value: "native", en: "Native", bn: "মাতৃভাষী" },
  ];

  return (
    <div className="space-y-3">
      {data.map((lang, i) => (
        <div key={i} className="flex items-center gap-2 p-2 border rounded-lg relative">
          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={() => remove(i)}><X className="h-3 w-3" /></Button>
          <Input value={lang.name || ""} onChange={(e) => update(i, "name", e.target.value)} placeholder={isBn ? "ভাষা" : "Language"} className="h-8 text-sm flex-1" />
          <Select value={lang.proficiency || "intermediate"} onValueChange={(v) => update(i, "proficiency", v)}>
            <SelectTrigger className="w-[110px] h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{proficiencies.map((p) => <SelectItem key={p.value} value={p.value}>{isBn ? p.bn : p.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />{isBn ? "ভাষা যোগ" : "Add Language"}</Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Projects
   ═══════════════════════════════════════════════════ */

function ProjectsSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const addEntry = () => onChange(toSafeStrings([...data, { name: "", description: "", url: "", technologies: "" }]));
  const update = (i: number, key: string, val: string) => { const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(toSafeStrings(n)); };
  const remove = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));

  return (
    <div className="space-y-4">
      {data.map((proj, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2 relative">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(i)}><X className="h-3 w-3" /></Button>
          <Input value={proj.name || proj.project_name || ""} onChange={(e) => update(i, "name", e.target.value)} placeholder={isBn ? "প্রকল্পের নাম" : "Project Name"} className="h-8 text-sm" />
          <Input value={proj.url || ""} onChange={(e) => update(i, "url", e.target.value)} placeholder={isBn ? "লিঙ্ক (ঐচ্ছিক)" : "URL (optional)"} className="h-8 text-sm" />
          <Input value={proj.technologies || ""} onChange={(e) => update(i, "technologies", e.target.value)} placeholder={isBn ? "প্রযুক্তি (কমা দিয়ে)" : "Technologies (comma-separated)"} className="h-8 text-sm" />
          <Textarea value={proj.description || ""} onChange={(e) => update(i, "description", e.target.value)} placeholder={isBn ? "বিবরণ..." : "Description..."} className="min-h-[60px] text-sm" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />{isBn ? "প্রকল্প যোগ" : "Add Project"}</Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Awards & Honors
   ═══════════════════════════════════════════════════ */

function AwardsSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const addEntry = () => onChange(toSafeStrings([...data, { title: "", issuer: "", date: "" }]));
  const update = (i: number, key: string, val: string) => { const n = [...data]; n[i] = { ...n[i], [key]: val }; onChange(toSafeStrings(n)); };
  const remove = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));

  return (
    <div className="space-y-3">
      {data.map((award, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2 relative">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(i)}><X className="h-3 w-3" /></Button>
          <Input value={award.title || ""} onChange={(e) => update(i, "title", e.target.value)} placeholder={isBn ? "পুরস্কার" : "Award"} className="h-8 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={award.issuer || ""} onChange={(e) => update(i, "issuer", e.target.value)} placeholder={isBn ? "প্রদানকারী" : "Issuer"} className="h-8 text-sm" />
            <div>
              <Label className="text-[10px] text-muted-foreground">{isBn ? "তারিখ" : "Date"}</Label>
              <Input type="date" value={award.date || ""} onChange={(e) => update(i, "date", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />{isBn ? "পুরস্কার যোগ" : "Add Award"}</Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Hobbies & Interests
   ═══════════════════════════════════════════════════ */

function HobbiesSectionForm({ data, onChange, isBn }: { data: any[]; onChange: (d: any) => void; isBn: boolean }) {
  const [newHobby, setNewHobby] = useState("");
  const addHobby = () => { if (!newHobby.trim()) return; onChange(toSafeStrings([...data, newHobby.trim()])); setNewHobby(""); };
  const removeHobby = (i: number) => onChange(toSafeStrings(data.filter((_, idx) => idx !== i)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 min-h-[40px]">
        {data.map((hobby, i) => (
          <Badge key={i} variant="secondary" className="text-xs gap-1">
            {typeof hobby === "string" ? hobby : hobby.name || hobby}
            <button onClick={() => removeHobby(i)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newHobby} onChange={(e) => setNewHobby(e.target.value)} placeholder={isBn ? "শখ..." : "Hobby..."} className="h-8 text-sm flex-1" onKeyDown={(e) => e.key === "Enter" && addHobby()} />
        <Button size="sm" onClick={addHobby}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Social Links — with per-platform icons
   ═══════════════════════════════════════════════════ */

const SOCIAL_ICON_MAP: Record<string, typeof Globe> = {
  linkedin: Link2,
  github: Code,
  twitter: Twitter,
  facebook: Facebook,
  portfolio: Globe,
};

function SocialSectionForm({ data, onChange, isBn }: { data: Record<string, any>; onChange: (d: any) => void; isBn: boolean }) {
  const platforms = ["linkedin", "github", "twitter", "facebook", "portfolio"];
  const labels: Record<string, { en: string; bn: string }> = {
    linkedin: { en: "LinkedIn", bn: "LinkedIn" },
    github: { en: "GitHub", bn: "GitHub" },
    twitter: { en: "Twitter / X", bn: "Twitter / X" },
    facebook: { en: "Facebook", bn: "Facebook" },
    portfolio: { en: "Portfolio URL", bn: "পোর্টফোলিও URL" },
  };
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    onChange(toSafeStrings({ ...data, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: value.trim() && !/^https?:\/\//i.test(value) ? (isBn ? "https:// দিয়ে শুরু করুন" : "Must start with http(s)") : "" }));
  };

  return (
    <div className="space-y-2">
      {platforms.map((p) => {
        const Icon = SOCIAL_ICON_MAP[p] || Globe;
        return (
          <div key={p} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input value={data[p] || ""} onChange={(e) => handleChange(p, e.target.value)} placeholder={isBn ? labels[p].bn : labels[p].en} className="h-8 text-sm" />
            </div>
            {errors[p] && <p className="text-xs text-destructive pl-[26px]">{errors[p]}</p>}
          </div>
        );
      })}
    </div>
  );
}