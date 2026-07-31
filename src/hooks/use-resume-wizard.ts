"use client";

import { useState, useEffect, useCallback } from "react";

interface Personal {
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  zip_code: string;
  city: string;
  photo_url: string;
  dob: string;
  place_of_birth: string;
  driving_license: string;
  gender: string;
  nationality: string;
  marital_status: string;
  linkedin: string;
  website: string;
  additional_info: string;
}

interface ResumeObjective {
  description: string;
}

interface Education {
  degree: string;
  city: string;
  school: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Interest {
  hobby: string;
}

interface Skill {
  skill: string;
  level: string;
}

interface WorkExperience {
  job_title: string;
  city: string;
  employer: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Language {
  language: string;
  level: string;
}

interface Achievement {
  description: string;
}

interface CustomSection {
  title: string;
  description: string;
}

export interface ResumeData {
  personal: Personal;
  resume_objective: ResumeObjective;
  education: Education[];
  interests: Interest[];
  skills: Skill[];
  work_experience: WorkExperience[];
  languages: Language[];
  achievements: Achievement[];
  custom_sections: CustomSection[];
  template_slug: string | null;
}

const EMPTY_PERSONAL: Personal = {
  full_name: "", first_name: "", last_name: "", email: "",
  phone: "", address: "", zip_code: "", city: "", photo_url: "",
  dob: "", place_of_birth: "", driving_license: "", gender: "",
  nationality: "", marital_status: "", linkedin: "", website: "", additional_info: "",
};

const STORAGE_KEY = "resume_wizard_data";

function getStoredData(): Partial<ResumeData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeData(data: ResumeData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useResumeWizard() {
  const [data, setData] = useState<ResumeData>({
    personal: { ...EMPTY_PERSONAL },
    resume_objective: { description: "" },
    education: [],
    interests: [],
    skills: [],
    work_experience: [],
    languages: [],
    achievements: [{ description: "" }],
    custom_sections: [],
    template_slug: null,
  });

  const [step, setStep] = useState(1);
  const [activeExpView, setActiveExpView] = useState<"details" | "qualifications">("details");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredData();
    if (stored) {
      setData((prev) => ({
        ...prev,
        ...stored,
        personal: { ...EMPTY_PERSONAL, ...(stored.personal || {}) },
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) storeData(data);
  }, [data, loading]);

  const updatePersonal = useCallback((updates: Partial<Personal>) => {
    setData((prev) => ({ ...prev, personal: { ...prev.personal, ...updates } }));
  }, []);

  const setSectionData = useCallback(<K extends keyof ResumeData>(section: K, value: ResumeData[K]) => {
    setData((prev) => ({ ...prev, [section]: value }));
  }, []);

  const progress = Math.round(((step - 1 + (activeExpView === "qualifications" ? 0.5 : 0)) / 3) * 100);

  return {
    data, step, setStep, activeExpView, setActiveExpView,
    loading, updatePersonal, setSectionData, progress,
  };
}