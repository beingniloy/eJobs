"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { MapPin, Globe, Shield, Zap, ExternalLink, Edit3, CheckCircle } from "lucide-react";

interface Props {
  profile: any;
  user: any;
  isPublic: boolean;
  activeBadges: any[];
  isBn: boolean;
}

export default function ProfileHeader({ profile, user, isPublic, activeBadges, isBn }: Props) {
  const fullName = profile.full_name_en || profile.full_name || user.name || "";
  const position = profile.current_position || profile.current_position || "";
  const city = profile.city || profile.district || "";
  const avatar = profile.avatar || user?.avatar || "";
  const hasPremium = activeBadges.some((b: any) => b.badge_key === "premium");

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      {/* Cover */}
      <div className="relative h-[200px] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
        {profile.cover_photo && (
          <img
            src={profile.cover_photo.startsWith("http") ? profile.cover_photo : `/storage/${profile.cover_photo}`}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 right-4">
          <Badge variant={isPublic ? "default" : "secondary"} className="gap-1.5 text-xs">
            {isPublic ? <Globe className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
            {isPublic ? (isBn ? "পাবলিক" : "Public") : (isBn ? "প্রাইভেট" : "Private")}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-[60px]">
          <div className="relative">
            <DefaultAvatar
              src={avatar}
              name={fullName || user.name}
              className="h-[120px] w-[120px] border-4 border-background shadow-lg"
            />
            {hasPremium && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <Zap className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 sm:pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{fullName || user.name}</h1>
              {profile.is_verified && (
                <Badge variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> {isBn ? "যাচাইকৃত" : "Verified"}
                </Badge>
              )}
            </div>
            {position && <p className="text-muted-foreground text-sm">{position}</p>}
            {city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{city}{!isBn ? ", Bangladesh" : ", বাংলাদেশ"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/profile/${user.username}`} target="_blank">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />{isBn ? "প্রিভিউ" : "Preview"}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/profile">
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />{isBn ? "এডিট" : "Edit"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}