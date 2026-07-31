"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/ui/default-avatar";
import { MapPin, Globe, Briefcase, Users, Star, MessageSquare, Heart, Share2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Company } from "@/types";

interface Props {
  company: Company;
  following: boolean;
  followersCount: number;
  activeJobsCount: number;
  avgReview: string;
  totalReviews: string;
  socialLinks: { icon: any; href: string; label: string }[];
  onFollow: () => void;
  isAuthenticated: boolean;
  isBn: boolean;
  getStorageUrl: (p: string | null | undefined) => string | null;
}

export default function CompanyHeader({ company, following, followersCount, activeJobsCount, avgReview, totalReviews, socialLinks, onFollow, isAuthenticated, isBn, getStorageUrl }: Props) {
  const logo = company.logo;
  const coverRaw = company.cover_image || company.cover_photo;
  const cover = getStorageUrl(coverRaw);
  const location = [company.location].filter(Boolean).join(", ");

  return (
    <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute inset-0 bg-[url('/images/company-bg.jpg')] bg-cover bg-center opacity-30" />
      {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold border border-white/20 overflow-hidden">
            <CompanyLogo src={logo} name={company.name}>{company.name.substring(0, 2).toUpperCase()}</CompanyLogo>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{company.name}</h1>
              {company.is_verified && <><CheckCircle2 className="h-5 w-5 text-green-400 fill-green-400/20" /><span className="text-xs text-green-400 font-medium">Verified</span></>}
              {company.is_featured && <Badge className="text-xs bg-yellow-500 text-white">Featured</Badge>}
            </div>
            {company.description && <p className="text-white/70 mt-1 line-clamp-1">{company.description}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/60">
              {location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>}
              {company.industry && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{company.industry}</span>}
              {company.size && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{company.size}</span>}
              {Number(totalReviews) > 0 && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{avgReview}</span>}
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
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isAuthenticated && company.user_id && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" asChild>
                <Link href={`/dashboard/messages?to=${company.user_id}`}><MessageSquare className="h-4 w-4" /></Link>
              </Button>
            )}
            {company.website && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" asChild>
                <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /></a>
              </Button>
            )}
            <Button variant="outline" size="sm" className="border-white/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" onClick={onFollow}>
              <Heart className="h-4 w-4 mr-1" />{following ? "Following" : "Follow"} {followersCount > 0 && `(${followersCount})`}
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              View Jobs ({activeJobsCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}