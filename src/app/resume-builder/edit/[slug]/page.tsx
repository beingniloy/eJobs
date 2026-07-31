"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { resumeService } from "@/services/resume.service";
import PublicLayout from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import InlineEditor from "@/components/cv/InlineEditor";
import type { CvTemplate, CvProfile } from "@/types";
import { profileDataToEditorData } from "@/lib/cv-builder-utils";

export default function ResumeBuilderEditPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { language } = useThemeStore();
  const isBn = language === "bn";

  const [template, setTemplate] = useState<CvTemplate | null>(null);
  const [editorData, setEditorData] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState("personal");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingCreating, setSavingCreating] = useState(false);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorInitialized = useRef(false);

  // Load template + profile
  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const [templates, profile] = await Promise.all([
          resumeService.getTemplates().catch(() => [] as CvTemplate[]),
          resumeService.getProfile().catch(() => null as CvProfile | null),
        ]);

        const tmpl = templates.find((t) => t.slug === slug);
        if (!tmpl) {
          router.push("/resume-builder");
          return;
        }
        setTemplate(tmpl);

        // Import profile data into editor
        if (profile) {
          setEditorData(profileDataToEditorData(profile));
        }
      } catch {
        router.push("/resume-builder");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  // Load initial preview
  useEffect(() => {
    if (!template) return;
    setPreviewLoading(true);
    (async () => {
      try {
        const html = await resumeService.getLivePreview(template!.slug);
        if (html && html.length > 50) {
          setPreviewHtml(html);
        } else {
          throw new Error("empty");
        }
      } catch {
        try {
          const html = await resumeService.getPreviewDemo(template!.slug);
          setPreviewHtml(html || "");
        } catch {
          setPreviewHtml("");
        }
      } finally {
        setPreviewLoading(false);
      }
    })();
  }, [template]);

  // Debounced preview refresh on data change
  useEffect(() => {
    if (!template || Object.keys(editorData).length === 0) return;
    if (!editorInitialized.current) { editorInitialized.current = true; return; }
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const html = await resumeService.getLivePreviewWithData(template.slug, editorData);
        setPreviewHtml(html);
      } catch {
        try {
          const html = await resumeService.getPreviewDemo(template.slug);
          setPreviewHtml(html || "");
        } catch {
          setPreviewHtml("");
        }
      } finally {
        setPreviewLoading(false);
      }
    }, 600);
    return () => { if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current); };
  }, [editorData, template]);

  const handleEditorDataChange = useCallback((section: string, data: any) => {
    setEditorData((prev) => ({ ...prev, [section]: data }));
  }, []);

  const handleRefreshPreview = useCallback(async () => {
    if (!template) return;
    setPreviewLoading(true);
    try {
      const html = await resumeService.getLivePreviewWithData(template.slug, editorData);
      setPreviewHtml(html);
    } catch {
      try {
        const html = await resumeService.getPreviewDemo(template.slug);
        setPreviewHtml(html || "");
      } catch {
        setPreviewHtml("");
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [template, editorData]);

  const handleSaveAndCreate = useCallback(async () => {
    if (!template) return;
    setSavingCreating(true);
    try {
      const profileData = {
        personal_info: editorData.personal || {},
        experiences: editorData.experience || [],
        educations: editorData.education || [],
        skills: editorData.skills || [],
        certifications: editorData.certifications || [],
        languages: editorData.languages || [],
        projects: editorData.projects || [],
        awards: editorData.awards || [],
        hobbies: editorData.hobbies || [],
        social_links: editorData.social_links || {},
      };
      await resumeService.updateProfile(profileData);
      const resume = await resumeService.createResume({
        title: template.name + " " + (isBn ? "সিভি" : "CV"),
        template_slug: template.slug,
      });
      toast.success(isBn ? "সিভি তৈরি হয়েছে!" : "Resume created!");
      const uuid = (resume as any)?.uuid || (resume as any)?.data?.uuid;
      if (uuid) router.push(`/cv/preview/${uuid}`);
      else router.push("/resume-builder");
    } catch (e: any) {
      const { toast } = await import("sonner");
      toast.error(e.response?.data?.message || (isBn ? "ব্যর্থ" : "Failed"));
    } finally {
      setSavingCreating(false);
    }
  }, [template, editorData, isBn, router]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">{isBn ? "লোড হচ্ছে..." : "Loading editor..."}</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!template) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-semibold">{isBn ? "টেমপ্লেট পাওয়া যায়নি" : "Template not found"}</p>
            <Button onClick={() => router.push("/resume-builder")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isBn ? "ফিরে যান" : "Go Back"}
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <InlineEditor
      template={template}
      data={editorData}
      onChange={handleEditorDataChange}
      previewHtml={previewHtml}
      previewLoading={previewLoading}
      onRefreshPreview={handleRefreshPreview}
      onBack={() => router.push("/resume-builder")}
      onSaveAndCreate={handleSaveAndCreate}
      savingCreating={savingCreating}
      isBn={isBn}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    />
  );
}

function toast(opts: { success?: string; error?: string }) {
  import("sonner").then((m) => {
    if (opts.success) m.toast.success(opts.success);
    if (opts.error) m.toast.error(opts.error);
  });
}