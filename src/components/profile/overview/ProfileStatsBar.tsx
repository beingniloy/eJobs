"use client";

import React from "react";
import { FileText, Eye, TrendingUp, Shield } from "lucide-react";

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
  ];

  return (
    <div className="flex items-center gap-4 px-2">
      {items.map((s) => (
        <div key={s.label} className="flex items-center gap-2 text-sm">
          <s.icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{s.value}</span>
          <span className="text-muted-foreground hidden sm:inline">{s.label}</span>
        </div>
      ))}
    </div>
  );
}