import type { JobApplication } from "@/types";

export type JobGroup = {
  jobId: number;
  title: string;
  isRemote: boolean;
  budget: number | null;
  budgetType: string | null;
  applications: JobApplication[];
};

export async function tryEndpoints(attempts: (() => Promise<any>)[]): Promise<any> {
  let lastErr: any;
  for (const fn of attempts) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (err?.response?.status !== 404) throw err;
    }
  }
  throw lastErr;
}

export const ALL_STATUSES = ["pending", "reviewed", "shortlisted", "rejected", "hired"] as const;

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  shortlisted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  hired: "bg-green-100 text-green-800",
};

export const STATUS_LABELS: Record<string, { en: string; bn: string }> = {
  pending: { en: "Pending", bn: "পেন্ডিং" },
  reviewed: { en: "Reviewed", bn: "রিভিউ" },
  shortlisted: { en: "Shortlist", bn: "শর্টলিস্ট" },
  rejected: { en: "Reject", bn: "প্রত্যাখ্যান" },
  hired: { en: "Hire", bn: "নিয়োগ" },
};

export function getStatusLabel(s: string, isBn: boolean): string {
  const entry = STATUS_LABELS[s];
  return entry ? (isBn ? entry.bn : entry.en) : s;
}

export function getAvailableStatuses(current: string): string[] {
  return ALL_STATUSES.filter((s) => s !== current);
}

export function candidateLabel(app: JobApplication): string {
  return app.user?.name || "Candidate";
}

export function getProfileUrl(app: JobApplication): string | null {
  const username = (app as any).user?.username;
  const userId = (app as any).user?.id;
  if (username) return `/profile/${username}`;
  if (userId) return `/candidate/${userId}`;
  return null;
}

export function groupByJob(apps: JobApplication[]): JobGroup[] {
  const map = new Map<number, JobGroup>();
  for (const app of apps) {
    const jobId = app.job_id;
    if (!map.has(jobId)) {
      map.set(jobId, {
        jobId,
        title: app.job?.title || "Job",
        isRemote: !!(app.job as any)?.is_remote_project,
        budget: (app.job as any)?.budget ?? null,
        budgetType: (app.job as any)?.budget_type ?? null,
        applications: [],
      });
    }
    map.get(jobId)!.applications.push(app);
  }
  return Array.from(map.values()).sort((a, b) => b.applications.length - a.applications.length);
}