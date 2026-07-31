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

/* ─── localStorage helpers (per-template drafts) ─── */

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
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(data));
  } catch { /* quota or private browsing */ }
}

function clearDraft(slug: string) {
  try {
    localStorage.removeItem(storageKey(slug));
  } catch { /* ignore */ }
}

/* ─── Default empty project so the user sees one entry right away ─── */
const EMPTY_PROJECT = { name: "", description: "", url: "" };

/* ─── Hook ─── */

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
  const previewInitRef = useRef(false);

  /* ── 1. Load template, then editorData (localStorage → API fallback) ── */
  useEffect(() => {
    if (!slug) return;

    (async () => {
      setLoading(true);

      try {
        /* a) fetch template */
        const templates = await resumeService.getTemplates().catch(() => [] as CvTemplate[]);
        const tmpl = templates.find((t) => t.slug === slug);
        if (!tmpl) {
          onNotFound?.() ?? router.push("/resume-builder");
          return;
        }
        setTemplate(tmpl);

        /* b) try localStorage first */
        const stored = loadDraft(slug);
        if (stored) {
          setEditorData(stored);
        } else {
          /* c) no draft → load profile from API */
          const profile = await resumeService.getProfile().catch(() => null as CvProfile | null);
          if (profile) {
            const data = profileDataToEditorData(profile);
            /* ensure at least one project entry so the section isn't empty */
            if (!data.projects || (Array.isArray(data.projects) && data.projects.length === 0)) {
              data.projects = [{ ...EMPTY_PROJECT }];
            }
            setEditorData(data);
          }
        }
      } catch {
        onNotFound?.() ?? router.push("/resume-builder");
      } finally {
        setLoading(false);
        dataReadyRef.current = true;
      }
    })();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 2. Load initial preview HTML ── */
  useEffect(() => {
    if (!template) return;
    setPreviewLoading(true);
    (async () => {
      try {
        const html = await resumeService.getLivePreview(template.slug);
        if (html && html.length > 50) { setPreviewHtml(html); return; }
      } catch { /* fallback */ }
      try {
        const html = await resumeService.getPreviewDemo(template.slug);
        setPreviewHtml(html || "");
      } catch { setPreviewHtml(""); }
      finally { setPreviewLoading(false); }
    })();
  }, [template]);

  /* ── 3. Persist every editorData change to localStorage ── */
  useEffect(() => {
    if (!slug || !dataReadyRef.current || Object.keys(editorData).length === 0) return;
    saveDraft(slug, editorData);
  }, [editorData, slug]);

  /* ── 4. Debounced live preview on data change ── */
  useEffect(() => {
    if (!template || Object.keys(editorData).length === 0) return;
    /* skip the very first render to avoid an extra API call on mount */
    if (!previewInitRef.current) { previewInitRef.current = true; return; }

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
      } finally { setPreviewLoading(false); }
    }, 600);

    return () => { if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current); };
  }, [editorData, template]);

  /* ── Actions ── */

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
      clearDraft(slug); // wipe saved draft after successful creation
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