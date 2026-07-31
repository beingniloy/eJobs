"use client";

import { useParams } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import PublicLayout from "@/components/layout/PublicLayout";
import ResumeEditLoading from "./loading";
import ResumeEditNotFound from "./not-found";
import InlineEditor from "@/components/cv/InlineEditor";
import { useResumeEditor } from "@/hooks/use-resume-editor";

/**
 * Sanitize editorData before sending to backend Blade templates.
 * Blade's {{ }} calls htmlspecialchars() which fails on arrays.
 * This ensures all values passed to templates are strings or string arrays.
 */
function sanitizeForBlade(data: Record<string, any>): Record<string, any> {
  const safe = (v: any): any => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (Array.isArray(v)) return v.map(safe);
    if (typeof v === 'object') {
      const out: Record<string, any> = {};
      for (const [k, val] of Object.entries(v)) {
        out[k] = safe(val);
      }
      return out;
    }
    return String(v);
  };

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    result[key] = safe(val);
  }
  return result;
}

export default function ResumeBuilderEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useThemeStore();
  const isBn = language === "bn";

  const {
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
  } = useResumeEditor({ slug });

  if (loading) return <PublicLayout><ResumeEditLoading /></PublicLayout>;
  if (!template) return <PublicLayout><ResumeEditNotFound /></PublicLayout>;

  const sanitizedData = sanitizeForBlade(editorData);

  return (
    <InlineEditor
      template={template}
      data={sanitizedData}
      onChange={handleDataChange}
      previewHtml={previewHtml}
      previewLoading={previewLoading}
      onRefreshPreview={refreshPreview}
      onBack={() => window.history.back()}
      onSaveAndCreate={saveAndCreate}
      savingCreating={saving}
      isBn={isBn}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    />
  );
}