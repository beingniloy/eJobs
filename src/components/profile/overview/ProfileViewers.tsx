"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface Props {
  views: any[];
  isBn: boolean;
}

export default function ProfileViewers({ views, isBn }: Props) {
  if (!views.length) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          {isBn ? "কে দেখেছে" : "Who Viewed Your Profile"}
        </h3>
        <div className="space-y-2">
          {views.slice(0, 5).map((v: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                {(v.company_name || "A")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-xs">{v.company_name || "Anonymous"}</p>
                <p className="text-[10px] text-muted-foreground">{v.timestamp || ""}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}