"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Globe, ArrowRight, MapPin, CheckCircle2 } from "lucide-react";
import type { Company, CompanyReview } from "@/types";

function formatJobType(t: string) { return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

interface Props {
  company: Company;
  slug: string;
  avgReview: string;
  totalReviews: string;
  ratingBreakdown: { stars: number; count: number; percent: number }[];
  jobs: any[];
  activeJobsCount: string;
  highlights: string[];
  mission: string;
  vision: string;
  reviews: CompanyReview[];
  isBn: boolean;
}

export default function CompanyOverviewTab({ company, slug, avgReview, totalReviews, ratingBreakdown, jobs, activeJobsCount, highlights, mission, vision, reviews, isBn }: Props) {
  return (
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
                <span key={s} className={`h-4 w-4 ${s <= Math.round(Number(avgReview)) ? "text-yellow-400" : "text-yellow-400/30"}`}>&#9733;</span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({totalReviews} reviews)</span>
          </div>
          {ratingBreakdown.length > 0 && (
            <div className="space-y-1.5">
              {ratingBreakdown.map((r) => (
                <div key={r.stars} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-right">{r.stars}</span>
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
        ) : (
          <div className="text-center py-8 text-muted-foreground"><p className="text-sm">No active jobs posted yet</p></div>
        )}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-3">Company Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {highlights.map((h) => (
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
                    <span key={s} className={`h-3 w-3 ${s <= Math.floor(Number(t.overall_rating || t.rating)) ? "text-yellow-400" : "text-yellow-400/30"}`}>&#9733;</span>
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
  );
}