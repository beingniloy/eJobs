"use client";

import { useState } from "react";
import { ArrowLeft, FileText, RotateCcw, Eye, Loader2, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CV_SECTIONS } from "@/constants/cv-builder";
import SectionForm from "@/components/cv/SectionForm";
import type { CvTemplate } from "@/types";

export default function InlineEditor({ template, data, onChange, previewHtml, previewLoading, onRefreshPreview, onBack, onSaveAndCreate, savingCreating, isBn, activeSection, setActiveSection }: {
  template: CvTemplate;
  data: Record<string, any>;
  onChange: (section: string, data: any) => void;
  previewHtml: string;
  previewLoading: boolean;
  onRefreshPreview: () => void;
  onBack: () => void;
  onSaveAndCreate: () => void;
  savingCreating: boolean;
  isBn: boolean;
  activeSection: string;
  setActiveSection: (s: string) => void;
}) {
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0"><ArrowLeft className="h-4 w-4 mr-1" />{isBn ? "ফিরে যান" : "Back"}</Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="items-center gap-2 hidden sm:flex min-w-0">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-sm truncate">{template.name}</span>
              <Badge variant="outline" className="text-[10px] shrink-0">{isBn ? "ইনলাইন এডিটর" : "Inline Editor"}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onRefreshPreview}><RotateCcw className="h-3.5 w-3.5 sm:mr-1" /><span className="sm:inline">{isBn ? "রিফ্রেশ" : "Refresh"}</span></Button>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowMobilePreview(!showMobilePreview)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={onSaveAndCreate} disabled={savingCreating}>
              {savingCreating ? <Loader2 className="h-4 w-4 animate-spin sm:mr-1.5" /> : <FileText className="h-4 w-4 sm:mr-1.5" />}
              <span className="sm:inline">{isBn ? "সেভ ও সিভি তৈরি" : "Save & Create"}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${showMobilePreview ? 'hidden' : 'w-full'} lg:block lg:w-[45%] border-r overflow-y-auto`}>
          <div className="p-4 space-y-2">
            {CV_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.key;
              return (
                <div key={section.key}>
                  <button
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50"}`}
                    onClick={() => setActiveSection(section.key)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-sm flex-1">{isBn ? section.label_bn : section.label_en}</span>
                    {isActive ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </button>
                  {isActive && (
                    <div className="p-4 border-l-2 border-primary/20 ml-5 mt-1 mb-2">
                      <SectionForm section={section.key} data={data[section.key]} onChange={(d) => onChange(section.key, d)} isBn={isBn} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${showMobilePreview ? 'w-full' : 'hidden'} lg:block lg:w-[55%] bg-muted/30 overflow-y-auto`}>
          <div className="sticky top-0 bg-muted/80 backdrop-blur p-2 flex items-center justify-between lg:hidden border-b">
            <span className="text-xs font-medium">{isBn ? "প্রিভিউ" : "Preview"}</span>
            <Button variant="ghost" size="sm" className="h-7 w-7" onClick={() => setShowMobilePreview(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="p-3 sm:p-6 flex items-start justify-center">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[600px] min-h-[600px] sm:min-h-[800px] overflow-hidden">
              {previewLoading ? (
                <div className="flex items-center justify-center h-[400px] sm:h-[600px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : previewHtml ? (
                <iframe srcDoc={previewHtml} title={isBn ? "CV প্রিভিউ" : "CV Preview"} className="w-full border-0" style={{ minHeight: "600px" }} sandbox="allow-same-origin" />
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] sm:h-[600px] text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4" />
                  <p>{isBn ? "প্রিভিউ লোড হচ্ছে..." : "Loading preview..."}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
