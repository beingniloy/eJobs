import type { Metadata } from "next";
import ResumeWizardClient from "./ResumeWizardClient";

export const metadata: Metadata = {
  title: "CV Builder",
  description: "Create a professional resume with our AI-powered CV builder. Choose templates and customize your resume.",
};

export default function ResumeBuilderPage() {
  return <ResumeWizardClient />;
}