import type { Resume, CvProfile } from "@/types";
import { RESUME_STORAGE_KEY } from "@/constants/cv-builder";

export function getStoredResumes(): Resume[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RESUME_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function storeResumes(resumes: Resume[]) {
  try { localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(resumes)); } catch {}
}

export function profileDataToEditorData(p: CvProfile): Record<string, any> {
  return {
    personal: p.personal_info || {},
    experience: p.experiences || p.experience || [],
    education: p.educations || p.education || [],
    skills: p.skills || [],
    certifications: p.certifications || [],
    languages: p.languages || [],
    projects: p.projects || [],
    awards: (p as any).awards || [],
    hobbies: (p as any).hobbies || [],
    social_links: p.social_links || {},
  };
}

export function editorDataToProfile(ed: Record<string, any>): CvProfile {
  return {
    personal_info: ed.personal || {},
    experiences: ed.experience || [],
    educations: ed.education || [],
    skills: ed.skills || [],
    certifications: ed.certifications || [],
    languages: ed.languages || [],
    projects: ed.projects || [],
    awards: ed.awards || [],
    hobbies: ed.hobbies || [],
    social_links: ed.social_links || {},
  };
}
