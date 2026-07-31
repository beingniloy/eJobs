"use client";

import React from "react";
import { FileText, Eye, TrendingUp, Shield, Users } from "lucide-react";

interface Props {
  applicationsCount: number;
  profileViewsCount: number;
  searchAppearances: number;
  strengthPercent: number;
  isBn: boolean;
}

export default function ProfileStatsBar({ applicationsCount, profileViewsCount, searchAppearances, strengthPercent, isBn }: Props) {
  const items = [
    { label: isBn ? "আবেদন" : "Applications", value: applicationsCount, icon: FileText },
    { label: isBn ? "ভিউ" : "Profile Views", value: profileViewsCount, icon: Eye },
    { label: isBn ? "সার্চ উপস্থিতি" : "Search Appearances", value: searchAppearances, icon: TrendingUp },
    { label: isBn ? "প্রোফাইল শক্তি" : "Profile Strength", value: `${strengthPercent}%`, icon: Shield },
    { label: isBn ? "ফলোয়ার" : "Followers", value: 0, icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((s) => (
        <div key={s.label} className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/50">
          <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}