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

function storageKey(slug: string) {
  return `resume_draft_${slug}`;
}

function loadDraft(slug: string): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraft(slug: string, data: Record<string, any>) {
  try { localStorage.setItem(storageKey(slug), JSON.stringify(data)); } catch {}
}

function clearDraft(slug: string) {
  try { localStorage.removeItem(storageKey(slug)); } catch {}
}

const EMPTY_PROJECT = { name: "", description: "", url: "" };

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
  const dataReadyRef = useRef(false);

  /* ── 1. Load template + editorData ── */
  useEffect(() => {
    if (!slug) return;

    (async () => {
      setLoading(true);
      try {
        const templates = await resumeService.getTemplates().catch(() => [] as CvTemplate[]);
        const tmpl = templates.find((t) => t.slug === slug);
        if (!tmpl) { onNotFound?.() ?? router.push("/resume-builder"); return; }
        setTemplate(tmpl);

        /* localStorage → API fallback.
           dataReadyRef MUST be set BEFORE setEditorData so the
           debounced preview effect fires on the first re-render. */
        const stored = loadDraft(slug);
        if (stored) {
          dataReadyRef.current = true;
          setEditorData(stored);
        } else {
          const profile = await resumeService.getProfile().catch(() => null as CvProfile | null);
          if (profile) {
            const data = profileDataToEditorData(profile);
            if (!data.projects || (Array.isArray(data.projects) && data.projects.length === 0)) {
              data.projects = [{ ...EMPTY_PROJECT }];
            }
            dataReadyRef.current = true;
            setEditorData(data);
          }
        }
      } catch {
        onNotFound?.() ?? router.push("/resume-builder");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 2. Load initial preview ── */
  useEffect(() => {
    if (!template) return;
    setPreviewLoading(true);
    (async () => {
      try {
        const html = await resumeService.getLivePreview(template.slug);
        if (html && html.length > 50) { setPreviewHtml(html); }
      } catch {}
      try {
        if (!previewHtml || previewHtml.length < 50) {
          const html = await resumeService.getPreviewDemo(template.slug);
          if (html) setPreviewHtml(html);
        }
      } catch {}
      finally { setPreviewLoading(false); }
    })();
  }, [template]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 3. Persist every change to localStorage ── */
  useEffect(() => {
    if (!slug || !dataReadyRef.current || Object.keys(editorData).length === 0) return;
    saveDraft(slug, editorData);
  }, [editorData, slug]);

  /* ── 4. Debounced live preview on data change ── */
  useEffect(() => {
    if (!template || !dataReadyRef.current) return;

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const html = await resumeService.getLivePreviewWithData(template.slug, editorData);
        if (html && html.length > 50) {
          setPreviewHtml(html);
        } else {
          const demo = await resumeService.getPreviewDemo(template.slug);
          if (demo) setPreviewHtml(demo);
        }
      } catch {
        try {
          const demo = await resumeService.getPreviewDemo(template.slug);
          if (demo) setPreviewHtml(demo);
        } catch {}
      } finally { setPreviewLoading(false); }
    }, 500);

    return () => { if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current); };
  }, [editorData, template]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Actions ── */

  const handleDataChange = useCallback((section: string, sectionData: any) => {
    setEditorData((prev) => ({ ...prev, [section]: sectionData }));
  }, []);

  const refreshPreview = useCallback(async () => {
    if (!template) return;
    setPreviewLoading(true);
    try {
      const html = await resumeService.getLivePreviewWithData(template.slug, editorData);
      if (html && html.length > 50) setPreviewHtml(html);
    } catch {
      try {
        const html = await resumeService.getPreviewDemo(template.slug);
        if (html) setPreviewHtml(html);
      } catch {}
    } finally { setPreviewLoading(false); }
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
      clearDraft(slug);
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
  }, [template, editorData, isBn, router, slug]);

  return {
    template, editorData, activeSection, setActiveSection,
    previewHtml, previewLoading, loading, saving,
    handleDataChange, refreshPreview, saveAndCreate,
  };
}