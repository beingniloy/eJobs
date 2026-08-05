"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/ui/default-avatar";
import { MapPin, Globe, Briefcase, Users, Star, MessageSquare, Heart, Share2, CheckCircle2, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getStorageUrl } from "@/lib/utils";

interface SocialLink {
  icon: any;
  href: string;
  label: string;
}

interface Props {
  company: any;
  mode: "owner" | "public";
  following?: boolean;
  followersCount?: number;
  activeJobsCount?: number;
  avgReview?: string;
  totalReviews?: string;
  socialLinks?: SocialLink[];
  onFollow?: () => void;
  isAuthenticated?: boolean;
  isBn?: boolean;
}

export default function CompanyProfileHeader({
  company,
  mode,
  following = false,
  followersCount = 0,
  activeJobsCount = 0,
  avgReview = "0",
  totalReviews = "0",
  socialLinks = [],
  onFollow,
  isAuthenticated = false,
  isBn = false,
}: Props) {
  const logo = company.logo;
  const coverRaw = company.cover_image || company.cover_photo;
  const cover = getStorageUrl(coverRaw);
  const location = [company.location || company.city].filter(Boolean).join(", ");

  return (
    <div className="rounded-xl overflow-hidden bg-background border">
      {/* ── Cover Image (Facebook-style: fixed height at top) ── */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[url('/images/company-bg.jpg')] bg-cover bg-center opacity-30" />
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      {/* ── Profile Info (overlaps cover bottom) ── */}
      <div className="relative px-6 md:px-8 pb-6 -mt-10 z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          {/* Logo — overlaps cover */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-4 border-background shadow-xl overflow-hidden bg-background shrink-0">
            <CompanyLogo src={logo} name={company.name}>
              {company.name?.substring(0, 2).toUpperCase()}
            </CompanyLogo>
          </div>

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold">{company.name}</h1>
              {company.is_verified && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-500/20" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {isBn ? "যাচাইকৃত" : "Verified"}
                  </span>
                </>
              )}
              {company.is_featured && (
                <Badge className="text-xs bg-yellow-500 text-white">{isBn ? "বৈশিষ্ট্যযুক্ত" : "Featured"}</Badge>
              )}
            </div>

            {company.tagline && (
              <p className="text-muted-foreground mt-1 text-sm">{company.tagline}</p>
            )}
            {company.description && (
              <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{company.description}</p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              {location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>
              )}
              {company.industry && (
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{company.industry}</span>
              )}
              {company.size && (
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{company.size}</span>
              )}
              {Number(totalReviews) > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{avgReview}
                </span>
              )}
            </div>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {socialLinks.map((sl, i) => (
                  <a
                    key={i}
                    href={sl.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary"
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
            {mode === "owner" ? (
              <>
                <Link href={`/companies/${company.slug || ""}`} target="_blank">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ExternalLink className="h-4 w-4 mr-1" />{isBn ? "পাবলিক প্রোফাইল" : "Public Profile"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Link href="/employer/profile">
                  <Button size="sm" variant="outline">
                    <Pencil className="h-4 w-4 mr-1" />{isBn ? "সম্পাদনা" : "Edit Profile"}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {isAuthenticated && company.user_id && (
                  <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                    <Link href={`/employer/messages?to=${company.user_id}`}><MessageSquare className="h-4 w-4" /></Link>
                  </Button>
                )}
                {company.website && (
                  <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {onFollow && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={following ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}
                    onClick={onFollow}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${following ? "fill-current" : ""}`} />
                    {following ? (isBn ? "ফলো করছেন" : "Following") : (isBn ? "ফলো" : "Follow")}
                    {followersCount > 0 && ` (${followersCount})`}
                  </Button>
                )}
                <Button size="sm">
                  {isBn ? `চাকরি দেখুন (${activeJobsCount})` : `View Jobs (${activeJobsCount})`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
