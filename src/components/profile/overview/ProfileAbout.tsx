"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  bio: string;
  isBn: boolean;
}

export default function ProfileAbout({ bio, isBn }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!bio) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{isBn ? "সম্পর্কে" : "About"}</h2>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link href="/dashboard/profile"><Edit3 className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded && bio.length > 300 ? "line-clamp-4" : ""}`}>
          {bio}
        </p>
        {bio.length > 300 && (
          <button onClick={() => setExpanded(!expanded)} className="text-sm font-medium text-primary hover:underline mt-1 flex items-center gap-1">
            {expanded ? (isBn ? "কম দেখুন" : "Show less") : (isBn ? "আরও দেখুন" : "Show more")}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </CardContent>
    </Card>
  );
}