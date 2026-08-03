"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyLogo } from "@/components/ui/default-avatar";
import { companiesService } from "@/services/companies.service";
import { useEmployerCompany } from "@/hooks/use-employer-company";
import type { CompanyReview } from "@/types";
import {
  Building2, MapPin, Globe, Mail, ExternalLink, Star, Users, Briefcase,
  Eye, ThumbsUp, Calendar, ArrowRight, CheckCircle2,
  Heart, Share2, Camera, Newspaper, Award, Download, Link2, AtSign, Hash,
  Send, Rss, FileText, Megaphone, MessageSquare, Target, Flame,
  ShieldCheck, BookOpen,
} from "lucide-react";
import { getStorageUrl } from "@/lib/utils";

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

/* ─── Left sidebar nav items ─── */
const sidebarNavItems = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "about", label: "About Us", icon: Building2 },
  { key: "people", label: "People", icon: Users },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "benefits", label: "Benefits", icon: ShieldCheck },
  { key: "photos", label: "Photos", icon: Camera },
  { key: "videos", label: "Videos", icon: Megaphone },
  { key: "updates", label: "News & Updates", icon: Newspaper },
  { key: "culture", label: "Work Culture", icon: Flame },
  { key: "awards", label: "Awards", icon: Award },
  { key: "contact", label: "Contact Us", icon: MessageSquare },
];

/* ─── Component ─── */
export default function CompanyOverviewClient() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const [activeTab, setActiveTab] = useState("overview");
  const {
    company: companyData, loading, getDisplayField,
    brochures, awards, culturePhotos, recentUpdates, activeJobs: apiActiveJobs,
    profileViews, followersCount, reviewsCount, avgRating,
    similarCompanies: similarCompaniesData,
  } = useEmployerCompany();
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [reviewMeta, setReviewMeta] = useState({ average_rating: 0, total_reviews: 0 });
  const [ratingBreakdown, setRatingBreakdown] = useState<{ stars: number; count: number; percent: number }[]>([]);

  useEffect(() => {
    if (!companyData?.id) return;
    companiesService.getCompanyReviews(companyData.id).then((res) => {
      const d = res.data;
      setReviews(d?.reviews || []);
      setReviewMeta({
        average_rating: Number(d?.averages?.overall || d?.averages?.average_rating) || 0,
        total_reviews: d?.total_reviews || 0,
      });
      const allReviews = d?.reviews || [];
      const total = allReviews.length;
      if (total > 0) {
        const counts = [0, 0, 0, 0, 0];
        allReviews.forEach((r: CompanyReview) => {
          const star = Math.round(Number(r.overall_rating || r.rating));
          if (star >= 1 && star <= 5) counts[star - 1]++;
        });
        setRatingBreakdown(
          [5, 4, 3, 2, 1].map((stars) => ({
            stars,
            count: counts[stars - 1],
            percent: Math.round((counts[stars - 1] / total) * 100),
          }))
        );
      }
    }).catch(() => {});
  }, [companyData?.id]);

  /* ── Derived data ── */
  const company = companyData
    ? {
        name: getDisplayField("name", "Your Company"),
        tagline: getDisplayField("tagline", ""),
        location: [getDisplayField("city"), getDisplayField("address_country")].filter(Boolean).join(", ") || getDisplayField("location"),
        website: getDisplayField("website"),
        email: getDisplayField("contact_email") || getDisplayField("email"),
        founded: getDisplayField("founded_year"),
        employees: getDisplayField("employee_count") || getDisplayField("size") || getDisplayField("company_size"),
        jobsPosted: String(companyData.jobs_count ?? 0),
        activeJobs: String(companyData.active_jobs_count ?? 0),
        profileViews: String(profileViews),
        responseRate: companyData.response_rate ? `${companyData.response_rate}%` : "0%",
        avgReview: reviewMeta.average_rating > 0 ? reviewMeta.average_rating.toFixed(1) : (avgRating > 0 ? avgRating.toFixed(1) : "0"),
        totalReviews: String(reviewMeta.total_reviews || reviewsCount),
        companySize: getDisplayField("size") || getDisplayField("company_size"),
        industry: getDisplayField("industry"),
        headquarters: [getDisplayField("city"), getDisplayField("address_country")].filter(Boolean).join(", ") || getDisplayField("head_office_address") || getDisplayField("location"),
        logo: companyData.logo,
        coverPhoto: companyData.cover_photo,
        phone: getDisplayField("contact_phone") || getDisplayField("phone"),
        facebook: getDisplayField("facebook"),
        linkedin: getDisplayField("linkedin"),
        youtube: getDisplayField("youtube_channel"),
        instagram: getDisplayField("instagram_profile"),
        description: getDisplayField("description"),
        mission: getDisplayField("mission"),
        vision: getDisplayField("vision"),
        values: getDisplayField("values"),
        servicesProducts: getDisplayField("services_products"),
        workingCulture: getDisplayField("working_culture"),
        headOfficeAddress: getDisplayField("head_office_address"),
        postalCode: getDisplayField("address_postal_code"),
        isVerified: companyData.is_verified,
        highlights: (companyData.highlights as string[]) || [],
        whyJoinUs: (() => {
          const wju = companyData.why_join_us;
          if (Array.isArray(wju)) return wju;
          if (wju && typeof wju === "object" && "benefits" in wju) return (wju as { benefits?: string[] }).benefits || [];
          return [];
        })(),
        topSkills: (companyData.top_skills as string[]) || [],
      }
    : {
        name: "Your Company", tagline: "", location: "", website: "", email: "",
        founded: "", employees: "", jobsPosted: "0", activeJobs: "0", profileViews: "0",
        responseRate: "0%", avgReview: "0", totalReviews: "0", companySize: "",
        industry: "", headquarters: "", logo: null, coverPhoto: null, phone: null,
        facebook: "", linkedin: "", youtube: "", instagram: "",
        description: "", mission: "", vision: "", values: "",
        servicesProducts: "", workingCulture: "", headOfficeAddress: "", postalCode: "",
        isVerified: false, highlights: [], whyJoinUs: [], topSkills: [],
      };

  const socialLinks = [
    company.facebook && { icon: AtSign, href: company.facebook, label: "Facebook" },
    company.linkedin && { icon: Link2, href: company.linkedin, label: "LinkedIn" },
    company.youtube && { icon: Send, href: company.youtube, label: "YouTube" },
    company.instagram && { icon: Hash, href: company.instagram, label: "Instagram" },
    company.website && { icon: Rss, href: `https://${company.website}`, label: "Website" },
  ].filter(Boolean) as { icon: any; href: string; label: string }[];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
          </div>
          <div className="lg:col-span-6 space-y-6">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════════════
          COMPANY HEADER BANNER
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/company-bg.jpg')] bg-cover bg-center opacity-30" />
        {getStorageUrl(company.coverPhoto) && (
          <img src={getStorageUrl(company.coverPhoto)!} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/20 shrink-0">
              <CompanyLogo src={company.logo} name={company.name}>
                {company.name.substring(0, 2).toUpperCase()}
              </CompanyLogo>
            </div>

            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.isVerified && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-400 fill-green-400/20" />
                    <span className="text-xs text-green-400 font-medium">Verified</span>
                  </>
                )}
              </div>
              {company.tagline && <p className="text-white/70 mt-1">{company.tagline}</p>}
              {company.description && (
                <p className="text-white/50 text-sm mt-1 line-clamp-2">{company.description}</p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/60">
                {company.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{company.location}</span>
                )}
                {company.website && (
                  <a href={`https://${company.website}`} className="flex items-center gap-1 hover:text-white transition-colors">
                    <Globe className="h-3.5 w-3.5" />{company.website}
                  </a>
                )}
                {company.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{company.email}</span>
                )}
              </div>

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {socialLinks.map((sl, i) => (
                    <a key={i} href={sl.href} target="_blank" rel="noopener noreferrer"
                      className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title={sl.label}
                    >
                      <sl.icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Link href={`/companies/${companyData?.slug || ""}`} target="_blank">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" title="View Public Profile">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" title="Share Profile"
                onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-white/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                <Heart className="h-4 w-4 mr-1" />Follow {followersCount > 0 && `(${followersCount})`}
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                View Jobs ({company.activeJobs})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS BAR
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { icon: Calendar, label: "Founded", value: company.founded || "N/A" },
          { icon: Users, label: "Employees", value: company.employees || "N/A" },
          { icon: Briefcase, label: "Jobs Posted", value: company.jobsPosted },
          { icon: Briefcase, label: "Active Jobs", value: company.activeJobs },
          { icon: Eye, label: "Profile Views", value: company.profileViews },
          { icon: ThumbsUp, label: "Response Rate", value: company.responseRate },
          { icon: Star, label: "Avg. Review", value: `${company.avgReview} (${company.totalReviews})` },
        ].map((s) => (
          <Card key={s.label} className="text-center p-3 hover:shadow-sm transition-shadow">
            <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-sm font-bold mt-0.5">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3-COLUMN LAYOUT
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ──────────────────────────────────────────────────────────────────
            LEFT SIDEBAR (Navigation + Snapshot + Why Join + Brochure + Skills)
           ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Vertical Navigation */}
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-0.5">
                {sidebarNavItems.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.key === "jobs" && company.activeJobs !== "0" && (
                        <Badge variant={isActive ? "secondary" : "outline"} className="ml-auto text-[10px] h-5">
                          {company.activeJobs}
                        </Badge>
                      )}
                      {item.key === "reviews" && company.totalReviews !== "0" && (
                        <Badge variant={isActive ? "secondary" : "outline"} className="ml-auto text-[10px] h-5">
                          {company.totalReviews}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Company Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Company Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Founded</p>
                  <p className="font-medium">{company.founded || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Company Size</p>
                  <p className="font-medium">{company.companySize || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="font-medium">{company.industry || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Headquarters</p>
                  <p className="font-medium">{company.headquarters || "Not specified"}</p>
                </div>
              </div>
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1">
                      {company.website}<ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              {socialLinks.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {socialLinks.map((sl, i) => (
                    <a key={i} href={sl.href} target="_blank" rel="noopener noreferrer"
                      className="h-7 w-7 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary">
                      <sl.icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Why Join Us */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Why Join Us?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {company.whyJoinUs.length > 0 ? (
                company.whyJoinUs.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <EmptyState text="No benefits added yet" />
              )}
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link href="/employer/profile">Add Benefits</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Company Brochure */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Company Brochure</CardTitle>
            </CardHeader>
            <CardContent>
              {brochures.length > 0 ? (
                brochures.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 mb-2">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">PDF</p>
                    </div>
                    <a href={b.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                    </a>
                  </div>
                ))
              ) : (
                <EmptyState text="No brochure uploaded" />
              )}
            </CardContent>
          </Card>

          {/* Top Skills We Hire */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Top Skills We Hire</CardTitle>
            </CardHeader>
            <CardContent>
              {company.topSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {company.topSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                  ))}
                </div>
              ) : (
                <EmptyState text="No skills added yet" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            MAIN CONTENT (Tabbed)
           ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 space-y-6">

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (
            <>
              {/* About Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">About {company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {company.description ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{company.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed italic">No company description added yet. Edit your profile to add one.</p>
                  )}
                </CardContent>
              </Card>

              {/* Mission / Vision / Values */}
              {(company.mission || company.vision || company.values) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {company.mission && (
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                            <Target className="h-4 w-4 text-blue-600" />
                          </div>
                          <h4 className="font-bold text-sm">Our Mission</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{company.mission}</p>
                      </CardContent>
                    </Card>
                  )}
                  {company.vision && (
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-purple-600" />
                          </div>
                          <h4 className="font-bold text-sm">Our Vision</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{company.vision}</p>
                      </CardContent>
                    </Card>
                  )}
                  {company.values && (
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-emerald-600" />
                          </div>
                          <h4 className="font-bold text-sm">Our Values</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{company.values}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Open Jobs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">Open Jobs ({company.activeJobs})</h2>
                  <Button variant="link" size="sm" className="text-xs" asChild>
                    <Link href="/employer/manage-jobs">View All Jobs <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                </div>
                {apiActiveJobs.length > 0 ? (
                  <div className="space-y-2">
                    {apiActiveJobs.slice(0, 5).map((job, i) => (
                      <Card key={i} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm">{job.title}</h4>
                                <Badge variant="outline" className="text-[10px]">{formatJobType(job.type)}</Badge>
                                <Badge variant="secondary" className="text-[10px]">{job.mode}</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {job.department && <span>{job.department}</span>}
                                {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                                {job.experience && <span>{job.experience}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-green-600">{job.salary}</p>
                              <p className="text-[10px] text-muted-foreground">{job.posted}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No active jobs posted yet" />
                )}
              </div>

              {/* Our Culture */}
              <div>
                <h2 className="text-lg font-bold mb-3">Our Culture</h2>
                {culturePhotos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {culturePhotos.slice(0, 6).map((photo) => (
                        <div key={photo.id} className="aspect-video rounded-lg bg-muted overflow-hidden">
                          <img src={photo.file_url} alt={photo.caption || "Culture photo"} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-xs" onClick={() => setActiveTab("photos")}>
                      View All Photos
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        <Camera className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Updates */}
              <div>
                <h2 className="text-lg font-bold mb-3">Recent Updates</h2>
                {recentUpdates.length > 0 ? (
                  <div className="space-y-3">
                    {recentUpdates.map((u, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Newspaper className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium leading-snug">{u.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{u.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No recent updates" />
                )}
              </div>

              {/* Awards & Recognition */}
              <div>
                <h2 className="text-lg font-bold mb-3">Awards & Recognition</h2>
                {awards.length > 0 ? (
                  <div className="space-y-3">
                    {awards.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Award className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium leading-snug">{a.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{a.issuer} {a.year ? `(${a.year})` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No awards added yet" />
                )}
              </div>

              {/* Employee Reviews / Testimonials */}
              <div>
                <h2 className="text-lg font-bold mb-3">What Our Employees Say</h2>
                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.slice(0, 3).map((t) => (
                      <Card key={t.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {(t.user?.name || "A")[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{t.user?.name || "Anonymous"}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {t.is_current_employee ? "Current Employee" : "Former Employee"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= Math.floor(Number(t.overall_rating || t.rating)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                            ))}
                            <span className="text-xs font-medium ml-1">{Number(t.overall_rating || t.rating).toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t.pros || t.cons || t.comment || "No comment"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No reviews yet" />
                )}
              </div>
            </>
          )}

          {/* ══ JOBS TAB ══ */}
          {activeTab === "jobs" && (
            <div>
              <h2 className="text-lg font-bold mb-3">All Jobs ({company.activeJobs})</h2>
              {apiActiveJobs.length > 0 ? (
                <div className="space-y-2">
                  {apiActiveJobs.map((job, i) => (
                    <Card key={i} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{job.title}</h4>
                              <Badge variant="outline" className="text-[10px]">{formatJobType(job.type)}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{job.mode}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {job.department && <span>{job.department}</span>}
                              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                              {job.experience && <span>{job.experience}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-green-600">{job.salary}</p>
                            <p className="text-[10px] text-muted-foreground">{job.posted}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState text="No active jobs posted yet" />
              )}
            </div>
          )}

          {/* ══ ABOUT TAB ══ */}
          {activeTab === "about" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">About {company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {company.description ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{company.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed italic">No company description added yet.</p>
                  )}
                </CardContent>
              </Card>

              {(company.mission || company.vision || company.values) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {company.mission && (
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                            <Target className="h-4 w-4 text-blue-600" />
                          </div>
                          <h4 className="font-bold text-sm">Our Mission</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{company.mission}</p>
                      </CardContent>
                    </Card>
                  )}
                  {company.vision && (
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-purple-600" />
                          </div>
                          <h4 className="font-bold text-sm">Our Vision</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{company.vision}</p>
                      </CardContent>
                    </Card>
                  )}
                  {company.values && (
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-emerald-600" />
                          </div>
                          <h4 className="font-bold text-sm">Our Values</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{company.values}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {company.servicesProducts && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">Services & Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{company.servicesProducts}</p>
                  </CardContent>
                </Card>
              )}

              {company.workingCulture && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">Working Culture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{company.workingCulture}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ══ PEOPLE TAB ══ */}
          {activeTab === "people" && (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold">Our People</h3>
              <p className="text-sm text-muted-foreground mt-1">Meet the talented team behind {company.name}</p>
              <p className="text-xs text-muted-foreground mt-4">HR team info will appear here once configured.</p>
            </div>
          )}

          {/* ══ REVIEWS TAB ══ */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Company Reviews</h2>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold">{company.avgReview}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-5 w-5 ${s <= Math.round(Number(company.avgReview)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({company.totalReviews} reviews)</span>
              </div>
              {ratingBreakdown.length > 0 && (
                <div className="space-y-2 max-w-md">
                  {ratingBreakdown.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-right">{r.stars}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.percent}%` }} />
                      </div>
                      <span className="w-10 text-right text-muted-foreground">{r.percent}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 mt-6">
                {reviews.length > 0 ? reviews.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                          {(t.user?.name || "A")[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.user?.name || "Anonymous"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t.is_current_employee ? "Current Employee" : "Former Employee"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= Math.floor(Number(t.overall_rating || t.rating)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                        ))}
                        <span className="text-xs font-medium ml-1">{Number(t.overall_rating || t.rating).toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t.pros || t.cons || t.comment || "No comment"}
                      </p>
                    </CardContent>
                  </Card>
                )) : (
                  <EmptyState text="No reviews yet" />
                )}
              </div>
            </div>
          )}

          {/* ══ BENEFITS TAB ══ */}
          {activeTab === "benefits" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Benefits & Perks</h2>
              {company.whyJoinUs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.whyJoinUs.map((item) => (
                    <Card key={item}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <span className="text-sm font-medium">{item}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState text="No benefits added yet" />
              )}
            </div>
          )}

          {/* ══ PHOTOS TAB ══ */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Company Photos</h2>
              {culturePhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {culturePhotos.map((photo) => (
                    <div key={photo.id} className="aspect-video rounded-lg bg-muted overflow-hidden">
                      <img src={photo.file_url} alt={photo.caption || "Culture photo"} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                      <Camera className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ VIDEOS TAB ══ */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              {companyData?.company_video_url ? (
                <>
                  <h2 className="text-lg font-bold">Company Videos</h2>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe src={companyData.company_video_url} className="w-full h-full" allowFullScreen />
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-bold">Company Videos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No video added yet. Add a YouTube URL in your profile settings.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══ UPDATES TAB ══ */}
          {activeTab === "updates" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">News & Updates</h2>
              {recentUpdates.length > 0 ? (
                <div className="space-y-3">
                  {recentUpdates.map((u, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <Newspaper className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium leading-snug">{u.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{u.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState text="No recent updates" />
              )}
            </div>
          )}

          {/* ══ CULTURE TAB ══ */}
          {activeTab === "culture" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Work Culture</h2>
              {company.workingCulture ? (
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{company.workingCulture}</p>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState text="No work culture description added yet" />
              )}
              {culturePhotos.length > 0 && (
                <>
                  <h3 className="font-bold text-sm">Culture Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {culturePhotos.map((photo) => (
                      <div key={photo.id} className="aspect-video rounded-lg bg-muted overflow-hidden">
                        <img src={photo.file_url} alt={photo.caption || "Culture photo"} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ AWARDS TAB ══ */}
          {activeTab === "awards" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Awards & Recognition</h2>
              {awards.length > 0 ? (
                <div className="space-y-3">
                  {awards.map((a, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <Award className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.issuer} {a.year ? `(${a.year})` : ""}</p>
                          {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState text="No awards added yet" />
              )}
            </div>
          )}

          {/* ══ CONTACT TAB ══ */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Contact Us</h2>
              <Card>
                <CardContent className="p-5 space-y-4">
                  {company.name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{company.name}</span>
                    </div>
                  )}
                  {company.headOfficeAddress && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{company.headOfficeAddress}{company.postalCode ? `, ${company.postalCode}` : ""}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${company.email}`} className="text-sm text-primary hover:underline">{company.email}</a>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${company.phone}`} className="text-sm text-primary hover:underline">{company.phone}</a>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {company.website}
                      </a>
                    </div>
                  )}
                  {socialLinks.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      {socialLinks.map((sl, i) => (
                        <a key={i} href={sl.href} target="_blank" rel="noopener noreferrer"
                          className="h-8 w-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary">
                          <sl.icon className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            RIGHT SIDEBAR (Rating + Highlights + Location + Similar + CTA)
           ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Company Rating */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Company Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold">{company.avgReview}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(company.avgReview)) ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/30 text-yellow-400/30"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">({company.totalReviews} reviews)</p>
              {ratingBreakdown.length > 0 && (
                <div className="space-y-1.5">
                  {ratingBreakdown.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-right">{r.stars}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.percent}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{r.percent}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Highlights */}
          {company.highlights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Company Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location */}
          {(company.headOfficeAddress || company.headquarters) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Location</CardTitle>
              </CardHeader>
              <CardContent>
                {companyData?.google_map_embed ? (
                  <div className="rounded-lg overflow-hidden mb-3">
                    <iframe
                      src={companyData.google_map_embed}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="aspect-[21/9] rounded-lg bg-muted flex items-center justify-center mb-3 overflow-hidden">
                    <MapPin className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <p className="text-sm font-medium">{company.name}</p>
                {company.headOfficeAddress && (
                  <p className="text-xs text-muted-foreground">{company.headOfficeAddress}</p>
                )}
                {company.postalCode && (
                  <p className="text-xs text-muted-foreground">{company.postalCode}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Similar Companies */}
          {similarCompaniesData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Similar Companies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {similarCompaniesData.map((c, i) => (
                  <Link key={i} href={`/companies/${c.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.type}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold">{c.rating}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Career CTA Banner */}
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-5 text-center space-y-3">
              <h3 className="font-bold text-sm">{isBn ? "নতুন চাকরি পোস্ট করুন" : "Ready to hire?"}</h3>
              <p className="text-xs text-muted-foreground">
                {isBn ? "আপনার পরবর্তী প্রতিভা খুঁজে নিন।" : "Post a new job and find your next great hire."}
              </p>
              <Button size="sm" className="w-full" asChild>
                <Link href="/employer/post-job">{isBn ? "চাকরি পোস্ট করুন" : "Post a Job"}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
