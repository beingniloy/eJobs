"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useResumeWizard } from "@/hooks/use-resume-wizard";
import { useThemeStore } from "@/store/theme-store";
import PublicLayout from "@/components/layout/PublicLayout";
import PersonalStep from "./PersonalStep";
import ExperiencesStep from "./ExperiencesStep";
import TemplateStep from "./TemplateStep";
import { User, Briefcase, Palette, Check } from "lucide-react";

const STEPS = [
  { key: 1, label: "Personal Details", icon: User, path: "personal" },
  { key: 2, label: "My Experiences", icon: Briefcase, path: "experiences" },
  { key: 3, label: "Template", icon: Palette, path: "template" },
];

function pathnameToStep(path: string): number {
  if (path.includes("/experiences")) return 2;
  if (path.includes("/template")) return 3;
  return 1;
}

export default function ResumeWizardClient() {
  const wizard = useResumeWizard();
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useThemeStore();
  const isBn = language === "bn";

  const currentStep = pathnameToStep(pathname);

  // Sync wizard step from URL
  if (wizard.step !== currentStep) {
    wizard.setStep(currentStep);
  }

  const goToStep = (n: number) => {
    const path = STEPS.find((s) => s.key === n)?.path || "personal";
    router.push(`/resume-builder/${path}`);
  };

  if (wizard.loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Step Indicator */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-4">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                  <button
                    onClick={() => { if (s.key <= currentStep) goToStep(s.key); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      currentStep === s.key ? "bg-primary text-primary-foreground shadow-sm" : currentStep > s.key ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {currentStep > s.key ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${currentStep > s.key ? "bg-primary" : "bg-muted"}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8">
          {currentStep === 1 && <PersonalStep wizard={wizard} onNext={() => goToStep(2)} />}
          {currentStep === 2 && <ExperiencesStep wizard={wizard} onNext={() => goToStep(3)} onPrev={() => goToStep(1)} />}
          {currentStep === 3 && <TemplateStep wizard={wizard} onPrev={() => goToStep(2)} />}
        </div>
      </div>
    </PublicLayout>
  );
}