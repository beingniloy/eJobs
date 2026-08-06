"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";

async function fetchWithRetry<T>(url: string, retries = 2, delayMs = 1000): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await api.get(url);
      return res.data?.data ?? null;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  return null;
}

function normalizeArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const raw = data?.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export function useHomepageData() {
  const categoriesQuery = useQuery({
    queryKey: ["homepage", "categories"],
    queryFn: () => fetchWithRetry<any[]>("/categories/highlighted"),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const companiesQuery = useQuery({
    queryKey: ["homepage", "companies"],
    queryFn: async () => {
      const data = await fetchWithRetry<any>("/companies?per_page=30");
      return normalizeArray(data).slice(0, 6);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const noticesQuery = useQuery({
    queryKey: ["homepage", "notices"],
    queryFn: async () => {
      const data = await fetchWithRetry<any>("/notices");
      return normalizeArray(data).slice(0, 5);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const jobsQuery = useQuery({
    queryKey: ["homepage", "jobs"],
    queryFn: async () => {
      const data = await fetchWithRetry<any>("/jobs?per_page=6");
      return normalizeArray(data).slice(0, 6);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const homepageQuery = useQuery({
    queryKey: ["homepage", "settings"],
    queryFn: () => fetchWithRetry<Record<string, any>>("/settings/homepage"),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const hotJobsQuery = useQuery({
    queryKey: ["homepage", "hot-jobs"],
    queryFn: async () => {
      const data = await fetchWithRetry<any>("/jobs/hot");
      const hotData = data?.data ?? data ?? {};
      return {
        hot_jobs: Array.isArray(hotData.hot_jobs) ? hotData.hot_jobs : [],
        remote_jobs: Array.isArray(hotData.remote_jobs) ? hotData.remote_jobs : [],
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const loading = categoriesQuery.isLoading || companiesQuery.isLoading || jobsQuery.isLoading;

  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : (categoriesQuery.data as any)?.data ?? [];

  return {
    categories,
    categoriesLoading: categoriesQuery.isLoading,
    categoriesError: categoriesQuery.isError,
    companies: companiesQuery.data ?? [],
    notices: noticesQuery.data ?? [],
    jobs: jobsQuery.data ?? [],
    hpData: homepageQuery.data?.data ?? homepageQuery.data ?? {},
    hotJobs: hotJobsQuery.data?.hot_jobs ?? [],
    remoteJobs: hotJobsQuery.data?.remote_jobs ?? [],
    loading,
  };
}
