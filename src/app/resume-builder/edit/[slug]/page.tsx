"use client";

import { useParams } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import PublicLayout from "@/components/layout/PublicLayout";
import ResumeEditLoading from "./loading";
import ResumeEditNotFound from "./not-found";
import InlineEditor from "@/components/cv/InlineEditor";
import { useResumeEditor } from "@/hooks/use-resume-editor";

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

  return (
    <InlineEditor
      template={template}
      data={editorData}
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