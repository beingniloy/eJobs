"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { useResumeWizard } from "@/hooks/use-resume-wizard";
import { useThemeStore } from "@/store/theme-store";
import { resumeService } from "@/services/resume.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Loader2, FileText, Crown, Check } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { TEMPLATE_GRADIENTS } from "@/constants/cv-builder";
import type { CvTemplate } from "@/types";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = Math.round(A4_WIDTH_PX * 1.414);

export default function TemplateStep({ wizard }: { wizard: ReturnType<typeof useResumeWizard> }) {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const router = useRouter();
  const { data, setSectionData, setStep } = wizard;
  const [templates, setTemplates] = useState<CvTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(data.template_slug);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (!wrapperRef.current) return;
    const w = wrapperRef.current.clientWidth;
    setScale(Math.min(1, w / A4_WIDTH_PX));
  }, []);

  useEffect(() => { updateScale(); const obs = new ResizeObserver(updateScale); if (wrapperRef.current) obs.observe(wrapperRef.current); return () => obs.disconnect(); }, [updateScale, selectedSlug]);

  useEffect(() => {
    resumeService.getTemplates()
      .then((t) => { setTemplates(t); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    setPreviewLoading(true);
    resumeService.getPreviewDemo(selectedSlug)
      .then((html) => { if (html) setPreviewHtml(html); })
      .catch(() => { /* skip */ })
      .finally(() => setPreviewLoading(false));
  }, [selectedSlug]);

  const selectedTemplate = templates.find((t) => t.slug === selectedSlug);

  const handleCreateAndDownload = async () => {
    if (!selectedSlug) { toast.error("Please select a template"); return; }
    setCreating(true);
    try {
      // Save profile
      await resumeService.updateProfile({
        personal_info: {
          full_name: data.personal.first_name + " " + data.personal.last_name,
          title: data.personal.first_name + " " + data.personal.last_name,
          email: data.personal.email,
          phone: data.personal.phone,
          address: data.personal.address,
          city: data.personal.city,
          photo_url: data.personal.photo_url,
          dob: data.personal.dob,
          place_of_birth: data.personal.place_of_birth,
          driving_license: data.personal.driving_license,
          gender: data.personal.gender,
          nationality: data.personal.nationality,
          marital_status: data.personal.marital_status,
          linkedin: data.personal.linkedin,
          website: data.personal.website,
          additional_info: data.personal.additional_info,
          zip_code: data.personal.zip_code,
        },
        summary: data.resume_objective.description,
        experiences: data.work_experience.map((w) => ({
          company: w.employer, position: w.job_title, location: w.city,
          start_date: w.start_date, end_date: w.end_date, description: w.description,
        })),
        education: data.education.map((e) => ({
          institution: e.school, degree: e.degree, location: e.city,
          start_date: e.start_date, end_date: e.end_date, description: e.description,
        })),
        skills: data.skills.map((s) => s.skill + (s.level ? ` (${s.level})` : "")),
        languages: data.languages.map((l) => ({ name: l.language, proficiency: l.level })),
        certifications: data.achievements.map((a) => ({ name: "Achievement", description: a.description })),
        projects: [],
        awards: [],
        hobbies: data.interests.map((i) => i.hobby),
        social_links: { linkedin_url: data.personal.linkedin, portfolio_url: data.personal.website },
      });
      // Create resume
      const resume = await resumeService.createResume({
        title: data.personal.first_name + " " + data.personal.last_name + " CV",
        template_slug: selectedSlug,
      });
      const uuid = (resume as any)?.uuid || (resume as any)?.data?.uuid;
      toast.success("CV created successfully!");
      setSectionData("template_slug", selectedSlug);
      if (uuid) router.push(`/cv/preview/${uuid}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create CV");
    } finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Choose a template</h2>
      <p className="text-sm text-muted-foreground">Select a template to preview and create your resume.</p>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((t, idx) => (
            <button key={t.id} onClick={() => { setSelectedSlug(t.slug); setSectionData("template_slug", t.slug); }}
              className={`text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                selectedSlug === t.slug ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
              }`}>
              <div className={`h-36 bg-gradient-to-br ${TEMPLATE_GRADIENTS[idx % TEMPLATE_GRADIENTS.length]} flex items-center justify-center`}>
                <FileText className="h-10 w-10 text-white/40" />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{t.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                  {t.is_premium ? <Badge className="text-[10px] bg-amber-100 text-amber-700">{formatCurrency(t.price || 0)}</Badge> : <Badge variant="secondary" className="text-[10px]">Free</Badge>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Preview + Actions */}
      {selectedTemplate && (
        <div className="flex flex-col lg:flex-row gap-6 pt-4">
          {/* Preview */}
          <div className="flex-1">
            <Card className="overflow-hidden"><CardContent className="p-4">
              {previewLoading ? (
                <div className="flex items-center justify-center h-[500px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : previewHtml ? (
                <div ref={wrapperRef} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div style={{ height: `${A4_HEIGHT_PX * scale}px`, overflow: "hidden", position: "relative" }}>
                    <iframe srcDoc={previewHtml} title="Preview" sandbox="allow-same-origin"
                      style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, border: "none", transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[500px] text-muted-foreground text-sm">Select a template to preview</div>
              )}
            </CardContent></Card>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-4">
            <Card><CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${TEMPLATE_GRADIENTS[templates.indexOf(selectedTemplate) % TEMPLATE_GRADIENTS.length]} flex items-center justify-center`}>
                  <FileText className="h-6 w-6 text-white/60" />
                </div>
                <div><p className="font-medium text-sm">{selectedTemplate.name}</p><p className="text-xs text-muted-foreground">{selectedTemplate.category}</p></div>
              </div>
              <Button className="w-full" onClick={handleCreateAndDownload} disabled={creating}>
                {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Download className="h-4 w-4 mr-2" />Create & Download CV</>}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Edit Details</Button>
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-2" /> Previous step</Button>
      </div>
    </div>
  );
}