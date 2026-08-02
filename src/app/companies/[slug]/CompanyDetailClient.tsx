"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { companiesService } from "@/services/companies.service";
import api from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trackBehavior, useScrollDepthTracking, useClickPatternTracking, useSessionEngagementTracking } from "@/hooks/use-behavior-tracker";
import { Building2, ArrowLeft, Users, Calendar, Briefcase, Star, Eye, MapPin, Link2, AtSign, Hash, Send, Rss, Globe, CheckCircle2 } from "lucide-react";
import type { Company, CompanyReview } from "@/types";
import CompanyHeader from "./CompanyHeader";
import CompanySidebar from "./CompanySidebar";
import CompanyOverviewTab from "./CompanyOverviewTab";
import CompanyReviewsTab from "./CompanyReviewsTab";
import { getStorageUrl } from "@/lib/utils";

function formatJobType(t: string) { return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

interface Brochure { id: number; title: string; file_url: string; }

interface Props { slug: string; }

export default function CompanyDetailClient({ slug }: Props) {
  const { isAuthenticated } = useAuth();
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const [activeTab, setActiveTab] = useState("overview");
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [brochures, setBrochures] = useState<Brochure[]>([]);

  useScrollDepthTracking();
  useClickPatternTracking();
  useSessionEngagementTracking();

  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [reviewMeta, setReviewMeta] = useState({ average_rating: 0, total_reviews: 0 });
  const [ratingBreakdown, setRatingBreakdown] = useState<{ stars: number; count: number; percent: number }[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({ work_culture: 0, salary: 0, management: 0, growth: 0, work_life_balance: 0 });

  const loadReviews = async (companyId: number) => {
    setReviewsLoading(true);
    try {
      const payload = await companiesService.getCompanyReviews(companyId);
      const rv = (payload as any)?.reviews || [];
      setReviews(rv);
      setReviewMeta({
        average_rating: Number((payload as any)?.averages?.overall || (payload as any)?.averages?.average_rating) || 0,
        total_reviews: (payload as any)?.total_reviews || 0,
      });
      if ((payload as any)?.user_has_reviewed) setUserHasReviewed(true);
      const total = rv.length;
      if (total > 0) {
        const counts = [0, 0, 0, 0, 0];
        rv.forEach((r: CompanyReview) => { const star = Math.round(Number(r.overall_rating || r.rating)); if (star >= 1 && star <= 5) counts[star - 1]++; });
        setRatingBreakdown([5, 4, 3, 2, 1].map((stars) => ({ stars, count: counts[stars - 1], percent: Math.round((counts[stars - 1] / total) * 100) })));
      }
    } catch { /* ignore */ } finally { setReviewsLoading(false); }
  };

  useEffect(() => {
    companiesService.getCompanyBySlug(slug)
      .then((res) => {
        const data = res as unknown as Company;
        setCompany(data);
        if (data.followers_count != null) setFollowersCount(data.followers_count);
        trackBehavior("company_visit", { targetId: data.id, metaData: { name: data.name, slug } });
        companiesService.getCompanyBrochures(data.id).then((r) => setBrochures(r.data || [])).catch(() => {});
        loadReviews(data.id);
      })
      .catch(() => toast.error("Failed to load company details"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!company || !isAuthenticated) return;
    api.get(`/candidate/companies/${company.id}/followers/check`)
      .then((res: any) => setFollowing(res.data.following ?? res.data.data?.following ?? false))
      .catch(() => {});
  }, [company, isAuthenticated]);

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error(isBn ? "লগইন করুন" : "Please login first"); return; }
    if (!company) return;
    try {
      await companiesService.toggleFollow(company.id);
      setFollowing(!following);
      setFollowersCount((p) => (following ? Math.max(0, p - 1) : p + 1));
      toast.success(following ? "Unfollowed" : "Following");
    } catch { toast.error("Failed"); }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) { toast.error(isBn ? "লগইন করুন" : "Please login first"); return; }
    if (!company || reviewRating === 0) { toast.error("Please select a rating"); return; }
    if (!reviewComment.trim()) { toast.error("Please write a comment"); return; }
    setReviewSubmitting(true);
    try {
      await companiesService.submitReview(company.id, {
        rating: reviewRating, comment: reviewComment, is_anonymous: reviewAnonymous,
        rating_work_culture: categoryRatings.work_culture || undefined,
        rating_salary: categoryRatings.salary || undefined,
        rating_management: categoryRatings.management || undefined,
        rating_growth: categoryRatings.growth || undefined,
        rating_work_life_balance: categoryRatings.work_life_balance || undefined,
      });
      toast.success("Review submitted");
      setReviewRating(0); setReviewComment(""); setReviewAnonymous(false);
      setUserHasReviewed(true);
      setCategoryRatings({ work_culture: 0, salary: 0, management: 0, growth: 0, work_life_balance: 0 });
      loadReviews(company.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit review";
      toast.error(msg);
      if (err?.response?.data?.message?.includes("already")) setUserHasReviewed(true);
    } finally { setReviewSubmitting(false); }
  };

  const socialLinks = company ? [
    company.facebook && { icon: AtSign, href: company.facebook, label: "Facebook" },
    company.linkedin && { icon: Link2, href: company.linkedin, label: "LinkedIn" },
    company.youtube_channel && { icon: Send, href: company.youtube_channel, label: "YouTube" },
    company.instagram_profile && { icon: Hash, href: company.instagram_profile, label: "Instagram" },
    company.website && { icon: Rss, href: company.website.startsWith("http") ? company.website : `https://${company.website}`, label: "Website" },
  ].filter(Boolean) as { icon: any; href: string; label: string }[] : [];

  if (loading) {
    return (
      <PublicLayout>
        <div className="px-6 sm:px-8 lg:px-12 py-6 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}</div>
            <div className="lg:col-span-9 space-y-6"><Skeleton className="h-64 rounded-lg" /><Skeleton className="h-48 rounded-lg" /></div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!company) {
    return (
      <PublicLayout>
        <div className="px-6 sm:px-8 lg:px-12 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">{isBn ? "কোম্পানি পাওয়া যায়নি" : "Company not found"}</h2>
          <Button asChild><Link href="/companies"><ArrowLeft className="h-4 w-4 mr-2" />{isBn ? "ফিরে যান" : "Back to Companies"}</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const jobs = company.jobs || [];
  const activeJobsCount = String(company.active_jobs_count ?? company.jobs_count ?? jobs.length);
  const avgReview = reviewMeta.total_reviews > 0 ? reviewMeta.average_rating.toFixed(1) : "0.0";
  const totalReviews = String(reviewMeta.total_reviews || 0);
  const whyJoinUs = (() => { const wju = company.why_join_us; if (Array.isArray(wju)) return wju; if (wju && typeof wju === "object" && "benefits" in wju) return (wju as { benefits?: string[] }).benefits || []; return []; })();
  const topSkills = company.top_skills || [];
  const highlights = company.highlights || [];
  const location = [company.location].filter(Boolean).join(", ");

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: company.name, url: company.website, logo: company.logo, description: company.description, address: { "@type": "PostalAddress", addressLocality: company.location }, numberOfEmployees: company.size }) }} />

      <div className="px-6 sm:px-8 lg:px-12 space-y-6">
        <CompanyHeader company={company} following={following} followersCount={followersCount} activeJobsCount={Number(activeJobsCount)} avgReview={avgReview} totalReviews={totalReviews} socialLinks={socialLinks} onFollow={handleFollow} isAuthenticated={isAuthenticated} isBn={isBn} getStorageUrl={getStorageUrl} />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { icon: Calendar, label: "Founded", value: company.founded_year || "N/A" },
            { icon: Users, label: "Employees", value: company.size || "N/A" },
            { icon: Briefcase, label: "Active Jobs", value: activeJobsCount },
            { icon: Eye, label: "Followers", value: String(followersCount) },
            { icon: Star, label: "Avg. Review", value: `${avgReview} (${totalReviews})` },
          ].map((s) => (
            <Card key={s.label} className="text-center p-3">
              <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold mt-0.5">{s.value}</p>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start h-auto flex-wrap bg-muted/50 p-1">
            {["overview", "jobs", "about", "reviews", "benefits", "followers"].map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs capitalize px-3 py-1.5">
                {t === "reviews" ? `Reviews ${totalReviews}` : t === "jobs" ? `Jobs ${activeJobsCount}` : t === "followers" ? `Followers ${followersCount}` : t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <CompanySidebar company={company} whyJoinUs={whyJoinUs} brochures={brochures} topSkills={topSkills} socialLinks={socialLinks} location={location} />

          <div className="lg:col-span-9 space-y-6">
            {activeTab === "overview" && <CompanyOverviewTab company={company} slug={slug} avgReview={avgReview} totalReviews={totalReviews} ratingBreakdown={ratingBreakdown} jobs={jobs} activeJobsCount={activeJobsCount} highlights={highlights} mission={company.mission || ""} vision={company.vision || ""} reviews={reviews} isBn={isBn} />}

            {activeTab === "jobs" && (
              <div>
                <h2 className="text-lg font-bold mb-3">All Jobs ({activeJobsCount})</h2>
                {jobs.length > 0 ? (
                  <div className="space-y-2">
                    {jobs.map((job: any) => (
                      <Card key={job.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/jobs/${job.id}`} className="font-semibold text-sm hover:text-primary transition-colors">{job.title}</Link>
                                <Badge variant="outline" className="text-[10px]">{formatJobType(job.job_type || "full_time")}</Badge>
                              </div>
                              {job.location && <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</div>}
                            </div>
                            <Button asChild size="sm" variant="outline"><Link href={`/jobs/${job.id}`}>View</Link></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : <p className="text-center py-8 text-muted-foreground">No active jobs posted yet</p>}
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold mb-2">About {company.name}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{company.description || "No description available."}</p>
                </div>
                {(company.mission || company.vision) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.mission && <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800"><CardContent className="p-5"><h4 className="font-bold text-sm mb-2">Our Mission</h4><p className="text-sm text-muted-foreground">{company.mission}</p></CardContent></Card>}
                    {company.vision && <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800"><CardContent className="p-5"><h4 className="font-bold text-sm mb-2">Our Vision</h4><p className="text-sm text-muted-foreground">{company.vision}</p></CardContent></Card>}
                  </div>
                )}
                {company.services_products && <div><h3 className="font-bold text-sm mb-2">Services & Products</h3><p className="text-sm text-muted-foreground leading-relaxed">{company.services_products}</p></div>}
                {company.working_culture && <div><h3 className="font-bold text-sm mb-2">Working Culture</h3><p className="text-sm text-muted-foreground leading-relaxed">{company.working_culture}</p></div>}
                {company.values && <div><h3 className="font-bold text-sm mb-2">Core Values</h3><p className="text-sm text-muted-foreground leading-relaxed">{company.values}</p></div>}
              </div>
            )}

            {activeTab === "reviews" && (
              <CompanyReviewsTab avgReview={avgReview} totalReviews={totalReviews} ratingBreakdown={ratingBreakdown} reviews={reviews} reviewsLoading={reviewsLoading} isAuthenticated={isAuthenticated} userHasReviewed={userHasReviewed} reviewRating={reviewRating} reviewHoverRating={reviewHoverRating} reviewComment={reviewComment} reviewAnonymous={reviewAnonymous} reviewSubmitting={reviewSubmitting} categoryRatings={categoryRatings} onRate={setReviewRating} onHoverRate={setReviewHoverRating} onCategoryRate={(key, val) => setCategoryRatings((p) => ({ ...p, [key]: val }))} onCommentChange={setReviewComment} onAnonymousChange={setReviewAnonymous} onSubmit={handleSubmitReview} isBn={isBn} />
            )}

            {activeTab === "benefits" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Benefits & Perks</h2>
                {whyJoinUs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {whyJoinUs.map((item) => (
                      <Card key={item}><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /><span className="text-sm font-medium">{item}</span></CardContent></Card>
                    ))}
                  </div>
                ) : <p className="text-center py-8 text-muted-foreground">No benefits listed</p>}
              </div>
            )}

            {activeTab === "followers" && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold mb-2">Followers ({followersCount})</h2>
                  <p className="text-sm text-muted-foreground">{followersCount > 0 ? `${followersCount} people follow this company` : "No followers yet"}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}