"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { companiesService } from "@/services/companies.service";
import api from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { trackBehavior, useScrollDepthTracking, useClickPatternTracking, useSessionEngagementTracking } from "@/hooks/use-behavior-tracker";
import {
  Building2, MapPin, Globe, Mail, ExternalLink, Star, Users, Briefcase,
  Eye, ThumbsUp, Calendar, ArrowRight, ArrowLeft, CheckCircle2,
  Heart, Share2, Camera, Newspaper, Award, Download, Loader2,
  Link2, AtSign, Hash, Send, Rss, MessageSquare,
} from "lucide-react";
import type { Company, CompanyReview } from "@/types";
import { CompanyLogo } from "@/components/ui/default-avatar";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${API_BASE}/storage/${path.replace(/^\/?storage\//, "")}`;
}

/* ─── Format job type: "full_time" → "Full Time" ─── */
function formatJobType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Empty state helper ─── */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Building2 className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

interface Brochure {
  id: number;
  title: string;
  file_url: string;
}

interface ReviewResponse {
  reviews?: CompanyReview[];
  averages?: { overall?: number; average_rating?: number };
  total_reviews?: number;
}

interface Props {
  slug: string;
}

export default function CompanyDetailClient({ slug }: Props) {
  const { isAuthenticated } = useAuth();
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const [activeTab, setActiveTab] = useState("overview");
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useScrollDepthTracking();
  useClickPatternTracking();
  useSessionEngagementTracking();

  // Reviews
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [reviewMeta, setReviewMeta] = useState({ average_rating: 0, total_reviews: 0 });
  const [ratingBreakdown, setRatingBreakdown] = useState<{ stars: number; count: number; percent: number }[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [categoryRatings, setCategoryRatings] = useState({
    work_culture: 0, salary: 0, management: 0, growth: 0, work_life_balance: 0,
  });

  // Brochures
  const [brochures, setBrochures] = useState<Brochure[]>([]);

  useEffect(() => {
    companiesService
      .getCompanyBySlug(slug)
      .then((res) => {
        const data = res as unknown as Company;
        setCompany(data);
        if (data.followers_count != null) setFollowersCount(data.followers_count);
        trackBehavior("company_visit", { targetId: data.id, metaData: { name: data.name, slug } });
        companiesService.getCompanyBrochures(data.id).then((r) => setBrochures(r.data || [])).catch(() => { /* brochures - non-critical */ });
      })
      .catch(() => { toast.error("Failed to load company details"); })
      .finally(() => setLoading(false));
  }, [slug]);

  // Check follow status
  useEffect(() => {
    if (!company || !isAuthenticated) return;
    api.get(`/candidate/companies/${company.id}/followers/check`)
      .then((res: any) => { setFollowing(res.data.following ?? res.data.data?.following ?? false); })
      .catch(() => { /* follow status check - non-critical */ });
  }, [company, isAuthenticated]);

  // Load reviews
  const loadReviews = async () => {
    if (!company) return;
    setReviewsLoading(true);
    try {
      const res = await companiesService.getCompanyReviews(company.id);
      const d = (res as ReviewResponse) || {};
      const rv = d?.reviews || [];
      setReviews(rv);
      setReviewMeta({
        average_rating: Number(d?.averages?.overall || d?.averages?.average_rating) || 0,
        total_reviews: d?.total_reviews || 0,
      });
      const total = rv.length;
      if (total > 0) {
        const counts = [0, 0, 0, 0, 0];
        rv.forEach((r: CompanyReview) => {
          const star = Math.round(Number(r.overall_rating || r.rating));
          if (star >= 1 && star <= 5) counts[star - 1]++;
        });
        setRatingBreakdown(
          [5, 4, 3, 2, 1].map((stars) => ({
            stars, count: counts[stars - 1],
            percent: Math.round((counts[stars - 1] / total) * 100),
          }))
        );
      }
    } catch {} finally { setReviewsLoading(false); }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error(isBn ? "লগইন করুন" : "Please login first"); return; }
    if (!company) return;
    try {
      await companiesService.toggleFollow(company.id);
      setFollowing(!following);
      setFollowersCount((prev) => (following ? Math.max(0, prev - 1) : prev + 1));
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
      setCategoryRatings({ work_culture: 0, salary: 0, management: 0, growth: 0, work_life_balance: 0 });
      loadReviews();
    } catch { toast.error("Failed to submit review"); }
    finally { setReviewSubmitting(false); }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="px-6 sm:px-8 lg:px-12 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
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
  const activeJobsCount = company.active_jobs_count ?? company.jobs_count ?? jobs.length;
  const avgReview = reviewMeta.total_reviews > 0 ? reviewMeta.average_rating.toFixed(1) : "0.0";
  const totalReviews = String(reviewMeta.total_reviews || 0);
  const logo = company.logo;
  const coverRaw = company.cover_image || company.cover_photo;
  const cover = getStorageUrl(coverRaw);

  // Social links
  const socialLinks = [
    company.facebook && { icon: AtSign, href: company.facebook, label: "Facebook" },
    company.linkedin && { icon: Link2, href: company.linkedin, label: "LinkedIn" },
    company.youtube_channel && { icon: Send, href: company.youtube_channel, label: "YouTube" },
    company.instagram_profile && { icon: Hash, href: company.instagram_profile, label: "Instagram" },
    company.website && { icon: Rss, href: company.website.startsWith("http") ? company.website : `https://${company.website}`, label: "Website" },
  ].filter(Boolean) as { icon: any; href: string; label: string }[];

  const whyJoinUs = (() => {
    const wju = company.why_join_us;
    if (Array.isArray(wju)) return wju;
    if (wju && typeof wju === "object" && "benefits" in wju) return wju.benefits || [];
    return [];
  })();

  const topSkills = company.top_skills || [];
  const highlights = company.highlights || [];
  const mission = company.mission || "";
  const vision = company.vision || "";
  const values = company.values || "";
  const servicesProducts = company.services_products || "";
  const workingCulture = company.working_culture || "";
  const headOfficeAddress = company.head_office_address || "";
  const postalCode = company.address_postal_code || "";
  const location = [company.location].filter(Boolean).join(", ");

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "Organization",
          name: company.name, url: company.website, logo: logo,
          description: company.description, address: { "@type": "PostalAddress", addressLocality: company.location },
          numberOfEmployees: company.size,
        })}}
      />

      <div className="px-6 sm:px-8 lg:px-12 space-y-6">
        {/* ── Company Header Banner ── */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[url('/images/company-bg.jpg')] bg-cover bg-center opacity-30" />
          {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold border border-white/20 overflow-hidden">
                <CompanyLogo src={logo} name={company.name}>
                  {company.name.substring(0, 2).toUpperCase()}
                </CompanyLogo>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  {company.is_verified && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-400 fill-green-400/20" />
                      <span className="text-xs text-green-400 font-medium">Verified</span>
                    </>
                  )}
                  {company.is_featured && <Badge className="text-xs bg-yellow-500 text-white">Featured</Badge>}
                </div>
                {company.description && <p className="text-white/70 mt-1 line-clamp-1">{company.description}</p>}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/60">
                  {location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>}
                  {company.industry && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{company.industry}</span>}
                  {company.size && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{company.size}</span>}
                  {reviewMeta.total_reviews > 0 && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{avgReview}</span>}
                </div>
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {socialLinks.map((sl, i) => (
                      <a key={i} href={sl.href} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <sl.icon className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" title="Share Profile" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}>
                  <Share2 className="h-4 w-4" />
                </Button>
                {isAuthenticated && company.user_id && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" title="Message" asChild>
                    <Link href={`/dashboard/messages?to=${company.user_id}`}><MessageSquare className="h-4 w-4" /></Link>
                  </Button>
                )}
                {company.website && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" title="Website" asChild>
                    <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /></a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="border-white/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" onClick={handleFollow}>
                  <Heart className="h-4 w-4 mr-1" />{following ? "Following" : "Follow"} {followersCount > 0 && `(${followersCount})`}
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  View Jobs ({activeJobsCount})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { icon: Calendar, label: "Founded", value: company.founded_year || "N/A" },
            { icon: Users, label: "Employees", value: company.size || "N/A" },
            { icon: Briefcase, label: "Active Jobs", value: String(activeJobsCount) },
            { icon: ThumbsUp, label: "Followers", value: String(followersCount) },
            { icon: Star, label: "Avg. Review", value: `${avgReview} (${totalReviews})` },
          ].map((s) => (
            <Card key={s.label} className="text-center p-3">
              <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold mt-0.5">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "reviews") loadReviews(); }}>
          <TabsList className="w-full justify-start h-auto flex-wrap bg-muted/50 p-1">
            {["overview", "jobs", "about", "reviews", "benefits", "followers"].map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs capitalize px-3 py-1.5">
                {t === "reviews" ? `Reviews ${totalReviews}` : t === "jobs" ? `Jobs ${activeJobsCount}` : t === "followers" ? `Followers ${followersCount}` : t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Company Snapshot */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Company Snapshot</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {company.founded_year && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Founded</p><p className="font-medium">{company.founded_year}</p></div></div>}
                {company.size && <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Company Size</p><p className="font-medium">{company.size}</p></div></div>}
                {company.industry && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Industry</p><p className="font-medium">{company.industry}</p></div></div>}
                {location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{location}</p></div></div>}
                {company.website && (
                  <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Website</p><a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">{company.website}<ExternalLink className="h-3 w-3" /></a></div></div>
                )}
                {socialLinks.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {socialLinks.map((sl, i) => (
                      <a key={i} href={sl.href} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary">
                        <sl.icon className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Why Join Us */}
            {whyJoinUs.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Why Join Us?</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {whyJoinUs.map((item: string) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Company Brochure */}
            {brochures.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Company Brochure</CardTitle></CardHeader>
                <CardContent>
                  {brochures.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 mb-2">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{b.title}</p>
                        <p className="text-[10px] text-muted-foreground">PDF</p>
                      </div>
                      <a href={b.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top Skills */}
            {topSkills.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Top Skills</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {topSkills.map((skill: string) => <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
              <>
                {/* About + Rating */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h2 className="text-lg font-bold mb-2">About {company.name}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{company.description || "No description available."}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2">Company Rating</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold">{avgReview}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(avgReview)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">({totalReviews} reviews)</span>
                    </div>
                    {ratingBreakdown.length > 0 && (
                      <div className="space-y-1.5">
                        {ratingBreakdown.map((r) => (
                          <div key={r.stars} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-right">{r.stars}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.percent}%` }} /></div>
                            <span className="w-8 text-right text-muted-foreground">{r.percent}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mission & Vision */}
                {(mission || vision) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mission && (
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center"><Eye className="h-4 w-4 text-blue-600" /></div><h4 className="font-bold text-sm">Our Mission</h4></div>
                          <p className="text-sm text-muted-foreground">{mission}</p>
                        </CardContent>
                      </Card>
                    )}
                    {vision && (
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center"><Globe className="h-4 w-4 text-purple-600" /></div><h4 className="font-bold text-sm">Our Vision</h4></div>
                          <p className="text-sm text-muted-foreground">{vision}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Open Jobs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Open Jobs ({activeJobsCount})</h2>
                    <Button variant="link" size="sm" className="text-xs" asChild><Link href={`/jobs?company=${slug}`}>View All Jobs <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                  </div>
                  {jobs.length > 0 ? (
                    <div className="space-y-2">
                      {jobs.slice(0, 6).map((job: any) => (
                        <Card key={job.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link href={`/jobs/${job.id}`} className="font-semibold text-sm hover:text-primary transition-colors">{job.title}</Link>
                                  <Badge variant="outline" className="text-[10px]">{formatJobType(job.job_type || "full_time")}</Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                                </div>
                              </div>
                              <Button asChild size="sm" variant="outline"><Link href={`/jobs/${job.id}`}>View</Link></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : <EmptyState text="No active jobs posted yet" />}
                </div>

                {/* Highlights */}
                {highlights.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Company Highlights</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {highlights.map((h: string) => (
                          <div key={h} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /><span>{h}</span></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Testimonials */}
                <div>
                  <h3 className="font-bold text-sm mb-3">What Our Employees Say</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {reviews.length > 0 ? reviews.slice(0, 3).map((t) => (
                      <Card key={t.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{(t.user?.name || "A")[0]}</div>
                            <div>
                              <p className="text-sm font-medium">{t.user?.name || "Anonymous"}</p>
                              <p className="text-[10px] text-muted-foreground">{t.is_current_employee ? "Current Employee" : "Former Employee"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= Math.floor(Number(t.overall_rating || t.rating)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                            ))}
                            <span className="text-xs font-medium ml-1">{Number(t.overall_rating || t.rating).toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.pros || t.cons || t.comment || "No comment"}</p>
                        </CardContent>
                      </Card>
                    )) : <p className="text-sm text-muted-foreground col-span-full text-center py-8">No reviews yet</p>}
                  </div>
                </div>

                {/* CTA */}
                <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold">Looking for a career at {company.name}?</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Explore current openings and become a part of our exciting team.</p>
                    </div>
                    <Button className="shrink-0" asChild><Link href={`/jobs?company=${slug}`}>View All Jobs ({activeJobsCount})</Link></Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── Jobs Tab ── */}
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
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                              </div>
                            </div>
                            <Button asChild size="sm" variant="outline"><Link href={`/jobs/${job.id}`}>View</Link></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : <EmptyState text="No active jobs posted yet" />}
              </div>
            )}

            {/* ── About Tab ── */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold mb-2">About {company.name}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{company.description || "No description available."}</p>
                </div>
                {(mission || vision) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mission && (
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center"><Eye className="h-4 w-4 text-blue-600" /></div><h4 className="font-bold text-sm">Our Mission</h4></div>
                          <p className="text-sm text-muted-foreground">{mission}</p>
                        </CardContent>
                      </Card>
                    )}
                    {vision && (
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center"><Globe className="h-4 w-4 text-purple-600" /></div><h4 className="font-bold text-sm">Our Vision</h4></div>
                          <p className="text-sm text-muted-foreground">{vision}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                {servicesProducts && <div><h3 className="font-bold text-sm mb-2">Services & Products</h3><p className="text-sm text-muted-foreground leading-relaxed">{servicesProducts}</p></div>}
                {workingCulture && <div><h3 className="font-bold text-sm mb-2">Working Culture</h3><p className="text-sm text-muted-foreground leading-relaxed">{workingCulture}</p></div>}
                {values && <div><h3 className="font-bold text-sm mb-2">Core Values</h3><p className="text-sm text-muted-foreground leading-relaxed">{values}</p></div>}
              </div>
            )}

            {/* ── Reviews Tab ── */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold">Company Reviews</h2>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold">{avgReview}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-5 w-5 ${s <= Math.round(Number(avgReview)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">({totalReviews} reviews)</span>
                </div>
                {ratingBreakdown.length > 0 && (
                  <div className="space-y-2 max-w-md">
                    {ratingBreakdown.map((r) => (
                      <div key={r.stars} className="flex items-center gap-2 text-sm">
                        <span className="w-3 text-right">{r.stars}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.percent}%` }} /></div>
                        <span className="w-10 text-right text-muted-foreground">{r.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Review Form */}
                {isAuthenticated && (
                  <Card className="mt-6">
                    <CardHeader><CardTitle className="text-base">Write a Review</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating *</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} type="button" onMouseEnter={() => setReviewHoverRating(s)} onMouseLeave={() => setReviewHoverRating(0)} onClick={() => setReviewRating(s)} className="p-0.5">
                              <Star className={`h-7 w-7 transition-colors ${s <= (reviewHoverRating || reviewRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                          {reviewRating > 0 && <span className="text-sm text-muted-foreground ml-2">{reviewRating}/5</span>}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Category Ratings (Optional)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { key: "work_culture", label: "Work Culture" }, { key: "salary", label: "Salary" },
                            { key: "management", label: "Management" }, { key: "growth", label: "Growth" },
                            { key: "work_life_balance", label: "Work-Life Balance" },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button key={s} type="button" onClick={() => setCategoryRatings((prev) => ({ ...prev, [key]: prev[key as keyof typeof prev] === s ? 0 : s }))} className="p-0">
                                    <Star className={`h-4 w-4 transition-colors ${s <= categoryRatings[key as keyof typeof categoryRatings] ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Comment *</label>
                        <Textarea placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={reviewAnonymous} onCheckedChange={setReviewAnonymous} />
                        <label className="text-sm text-muted-foreground">Submit anonymously</label>
                      </div>
                      <Button onClick={handleSubmitReview} disabled={reviewSubmitting || reviewRating === 0}>
                        {reviewSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit Review
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {reviewsLoading ? (
                  <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
                ) : reviews.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    {reviews.slice(0, 9).map((t) => (
                      <Card key={t.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{(t.user?.name || "A")[0]}</div>
                            <div>
                              <p className="text-sm font-medium">{t.user?.name || "Anonymous"}</p>
                              <p className="text-[10px] text-muted-foreground">{t.is_current_employee ? "Current Employee" : "Former Employee"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= Math.floor(Number(t.overall_rating || t.rating)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                            ))}
                            <span className="text-xs font-medium ml-1">{Number(t.overall_rating || t.rating).toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.pros || t.cons || t.comment || "No comment"}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No reviews yet</p>}
              </div>
            )}

            {/* ── Benefits Tab ── */}
            {activeTab === "benefits" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Benefits & Perks</h2>
                {whyJoinUs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {whyJoinUs.map((item: string) => (
                      <Card key={item}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span className="text-sm font-medium">{item}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : <EmptyState text="No benefits listed" />}
              </div>
            )}

            {/* ── Followers Tab ── */}
            {activeTab === "followers" && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Followers ({followersCount})</CardTitle></CardHeader>
                <CardContent>
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
