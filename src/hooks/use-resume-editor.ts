"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { resumeService } from "@/services/resume.service";
import { toast } from "sonner";
import type { CvTemplate, CvProfile } from "@/types";
import { profileDataToEditorData } from "@/lib/cv-builder-utils";

interface UseResumeEditorOptions {
  slug: string;
  onNotFound?: () => void;
}

export function useResumeEditor({ slug, onNotFound }: UseResumeEditorOptions) {
  const router = useRouter();
  const { language } = useThemeStore();
  const isBn = language === "bn";

  const [template, setTemplate] = useState<CvTemplate | null>(null);
  const [editorData, setEditorData] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState("personal");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

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
          onNotFound?.() ?? router.push("/resume-builder");
          return;
        }
        setTemplate(tmpl);
        if (profile) setEditorData(profileDataToEditorData(profile));
      } catch {
        onNotFound?.() ?? router.push("/resume-builder");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load initial preview
  useEffect(() => {
    if (!template) return;
    setPreviewLoading(true);
    (async () => {
      try {
        const html = await resumeService.getLivePreview(template.slug);
        if (html && html.length > 50) {
          setPreviewHtml(html);
          return;
        }
      } catch { /* fallback below */ }
      try {
        const html = await resumeService.getPreviewDemo(template.slug);
        setPreviewHtml(html || "");
      } catch {
        setPreviewHtml("");
      } finally {
        setPreviewLoading(false);
      }
    })();
  }, [template]);

  // Debounced preview refresh on data change
  useEffect(() => {
    if (!template || Object.keys(editorData).length === 0) return;
    if (!initializedRef.current) { initializedRef.current = true; return; }

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
        } catch { setPreviewHtml(""); }
      } finally {
        setPreviewLoading(false);
      }
    }, 600);

    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [editorData, template]);

  const handleDataChange = useCallback((section: string, data: any) => {
    setEditorData((prev) => ({ ...prev, [section]: data }));
  }, []);

  const refreshPreview = useCallback(async () => {
    if (!template) return;
    setPreviewLoading(true);
    try {
      const html = await resumeService.getLivePreviewWithData(template.slug, editorData);
      setPreviewHtml(html);
    } catch {
      try {
        const html = await resumeService.getPreviewDemo(template.slug);
        setPreviewHtml(html || "");
      } catch { setPreviewHtml(""); }
    } finally {
      setPreviewLoading(false);
    }
  }, [template, editorData]);

  const saveAndCreate = useCallback(async () => {
    if (!template) return false;
    setSaving(true);
    try {
      await resumeService.updateProfile({
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
      });

      const resume = await resumeService.createResume({
        title: template.name + " " + (isBn ? "সিভি" : "CV"),
        template_slug: template.slug,
      });

      const uuid = (resume as any)?.uuid || (resume as any)?.data?.uuid;
      toast.success(isBn ? "সিভি তৈরি হয়েছে!" : "Resume created!");
      if (uuid) router.push(`/cv/preview/${uuid}`);
      else router.push("/resume-builder");
      return true;
    } catch (e: any) {
      toast.error(e.response?.data?.message || (isBn ? "ব্যর্থ" : "Failed"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [template, editorData, isBn, router]);

  return {
    template,
    editorData,
    activeSection,
    setActiveSection,
    previewHtml,
    previewLoading,
    loading,
    saving,
    handleDataChange,
    refreshPreview,
    saveAndCreate,
  };
}