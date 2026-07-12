"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api-client";

interface EmployerCompanyData {
  id: number;
  name: string;
  name_bn: string;
  slug: string;
  tagline: string;
  logo: string | null;
  cover_photo: string | null;
  website: string;
  email: string;
  phone: string;
  industry: string;
  company_type: string;
  company_size: string;
  size: string;
  employee_count: string;
  founded_year: string;
  description: string;
  mission: string;
  vision: string;
  values: string;
  city: string;
  country: string;
  district: string;
  division: string;
  location: string;
  head_office_address: string;
  address_postal_code: string;
  contact_person_name: string;
  contact_person_designation: string;
  contact_phone: string;
  contact_alt_phone: string;
  contact_email: string;
  business_registration_number: string;
  trade_license_number: string;
  hr_manager_name: string;
  hr_contact_number: string;
  hr_email: string;
  recruitment_policy: string;
  hiring_process: string;
  services_products: string;
  working_culture: string;
  google_map_embed: string;
  tin_number: string;
  verification_status: string;
  company_video_url: string;
  youtube_channel: string;
  instagram_profile: string;
  facebook: string;
  linkedin: string;
  highlights: string[];
  active_jobs_count: number;
  jobs_count: number;
  response_rate: number;
  allow_job_posting: boolean;
  featured_job_allowed: boolean;
  auto_approval: boolean;
  job_expiry_days: number;
  job_posting_limit_monthly: string;
  hr_team: any[];
  updated_at: string;
  [key: string]: any;
}

interface EmployerCompanyStats {
  total_jobs: number;
  active_jobs: number;
  expired_jobs: number;
  total_applications: number;
  shortlisted: number;
  pending_applications: number;
  total_views: number;
  response_rate: number;
}

interface CompanyBrochure {
  id: number;
  title: string;
  file_path: string;
  file_url: string;
  download_count: number;
}

interface CompanyAward {
  id: number;
  title: string;
  issuer: string;
  year: number;
  description: string | null;
  is_verified: boolean;
}

interface CompanyCulturePhoto {
  id: number;
  file_path: string;
  file_url: string;
  caption: string | null;
}

interface CompanyUpdate {
  id: number;
  title: string;
  time: string;
}

interface ActiveJob {
  id: number;
  title: string;
  type: string;
  mode: string;
  department: string;
  location: string;
  experience: string;
  salary: string;
  posted: string;
}

interface SimilarCompany {
  name: string;
  type: string;
  rating: string;
  slug: string;
}

interface UseEmployerCompanyReturn {
  company: EmployerCompanyData | null;
  stats: EmployerCompanyStats | null;
  brochures: CompanyBrochure[];
  awards: CompanyAward[];
  culturePhotos: CompanyCulturePhoto[];
  recentUpdates: CompanyUpdate[];
  activeJobs: ActiveJob[];
  profileViews: number;
  followersCount: number;
  reviewsCount: number;
  avgRating: number;
  similarCompanies: SimilarCompany[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSyncedAt: Date | null;
  refetch: () => Promise<void>;
  updateCompany: (data: FormData) => Promise<boolean>;
  getDisplayField: (dbField: string, fallback?: string) => string;
}

export function useEmployerCompany(): UseEmployerCompanyReturn {
  const [company, setCompany] = useState<EmployerCompanyData | null>(null);
  const [stats, setStats] = useState<EmployerCompanyStats | null>(null);
  const [brochures, setBrochures] = useState<CompanyBrochure[]>([]);
  const [awards, setAwards] = useState<CompanyAward[]>([]);
  const [culturePhotos, setCulturePhotos] = useState<CompanyCulturePhoto[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<CompanyUpdate[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [profileViews, setProfileViews] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [similarCompanies, setSimilarCompanies] = useState<SimilarCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const fetchCompany = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/employer/profile");
      const d = res.data?.data;
      if (d?.company) {
        setCompany(d.company);
        setStats(d.stats || null);
        setBrochures(d.brochures || []);
        setAwards(d.awards || []);
        setCulturePhotos(d.culture_photos || []);
        setRecentUpdates(d.recent_updates || []);
        setActiveJobs(d.active_jobs || []);
        setProfileViews(d.profile_views || 0);
        setFollowersCount(d.followers_count || 0);
        setReviewsCount(d.reviews_count || 0);
        setAvgRating(d.avg_rating || 0);
        setSimilarCompanies(d.similar_companies || []);
        setLastSyncedAt(new Date());
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load company data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const updateCompany = useCallback(async (formData: FormData): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);
      const res = await api.post("/employer/profile-update", formData);

      if (res.data?.status && res.data?.data?.company) {
        setCompany((prev) => ({ ...prev, ...res.data.data.company }));
        if (res.data.data.stats) setStats(res.data.data.stats);
        setLastSyncedAt(new Date());
        return true;
      }
      // Debug: log the unexpected response shape
      console.error("[useEmployerCompany] Unexpected response:", JSON.stringify(res.data));
      return false;
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.message || err.message || "Failed to save profile";
      console.error("[useEmployerCompany] API error:", err.response?.status, data);
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const getDisplayField = useCallback(
    (dbField: string, fallback = ""): string => {
      if (!company) return fallback;
      const val = company[dbField];
      return val != null && val !== "" ? String(val) : fallback;
    },
    [company]
  );

  return {
    company,
    stats,
    brochures,
    awards,
    culturePhotos,
    recentUpdates,
    activeJobs,
    profileViews,
    followersCount,
    reviewsCount,
    avgRating,
    similarCompanies,
    loading,
    saving,
    error,
    lastSyncedAt,
    refetch: fetchCompany,
    updateCompany,
    getDisplayField,
  };
}
