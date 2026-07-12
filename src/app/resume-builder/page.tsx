import type { Metadata } from "next";
import CvBuilderClient from "./CvBuilderClient";

export const metadata: Metadata = {
  title: "CV Builder",
  description: "Create a professional resume with our AI-powered CV builder. Choose templates and customize your resume.",
};

export default function CvBuilderPage() {
  return <CvBuilderClient />;
}
