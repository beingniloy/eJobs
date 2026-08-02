"use client";

import { FileText, Crown, Check, Shield, PenTool, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_GRADIENTS } from "@/constants/cv-builder";
import { formatCurrency, getStorageUrl } from "@/lib/utils";
import type { CvTemplate } from "@/types";

export default function TemplateCard({ template, index, isBn, isPurchased, creating, onUse, onStartEdit }: {
  template: CvTemplate;
  index: number;
  isBn: boolean;
  isPurchased: boolean;
  creating: boolean;
  onUse: (t: CvTemplate) => void;
  onStartEdit: (t: CvTemplate) => void;
}) {
  const previewSrc = getStorageUrl(template.preview_image_path);

  return (
    <div className="group relative bg-background border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className={`relative h-48 bg-gradient-to-br ${TEMPLATE_GRADIENTS[index % TEMPLATE_GRADIENTS.length]} flex items-center justify-center overflow-hidden`}>
        {previewSrc ? (
          <img src={previewSrc} alt={template.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <FileText className="h-16 w-16 text-white/30" />
        )}
        {template.is_premium && !isPurchased && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg">
            <Crown className="h-3 w-3 mr-1" />Premium
          </Badge>
        )}
        {isPurchased && (
          <Badge className="absolute top-3 right-3 bg-green-500 text-white border-0 shadow-lg">
            <Check className="h-3 w-3 mr-1" />{isBn ? "কিনেছেন" : "Owned"}
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold">{template.name}</h3>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{template.category} {isBn ? "টেমপ্লেট" : "Template"}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(template.is_ats_friendly || template.ats_compatible) && <Badge variant="secondary" className="text-[10px]"><Shield className="h-2.5 w-2.5 mr-0.5" />ATS</Badge>}
          </div>
          {template.is_premium && template.price ? <span className="text-sm font-bold text-primary">{formatCurrency(template.price)}</span> : <Badge variant="outline" className="text-xs text-green-600">{isBn ? "বিনামূল্যে" : "Free"}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" size="sm" onClick={() => onStartEdit(template)} disabled={creating}>
            <PenTool className="h-3.5 w-3.5 mr-1.5" />{isBn ? "এডিট করুন" : "Edit"}
          </Button>
          <Button size="sm" variant={template.is_premium && !isPurchased ? "outline" : "secondary"} onClick={() => onUse(template)} disabled={creating}>
            {template.is_premium && !isPurchased ? <CreditCard className="h-3.5 w-3.5 sm:mr-1.5" /> : <ArrowRight className="h-3.5 w-3.5 sm:mr-1.5" />}
            <span className="sm:inline">{template.is_premium && !isPurchased ? (isBn ? "কিনুন" : "Buy") : (isBn ? "যান" : "Go")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}