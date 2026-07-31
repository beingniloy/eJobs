"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, CheckCircle } from "lucide-react";
import type { CompanyReview } from "@/types";

interface Props {
  avgReview: string;
  totalReviews: string;
  ratingBreakdown: { stars: number; count: number; percent: number }[];
  reviews: CompanyReview[];
  reviewsLoading: boolean;
  isAuthenticated: boolean;
  userHasReviewed: boolean;
  reviewRating: number;
  reviewHoverRating: number;
  reviewComment: string;
  reviewAnonymous: boolean;
  reviewSubmitting: boolean;
  categoryRatings: Record<string, number>;
  onRate: (r: number) => void;
  onHoverRate: (r: number) => void;
  onCategoryRate: (key: string, val: number) => void;
  onCommentChange: (v: string) => void;
  onAnonymousChange: (v: boolean) => void;
  onSubmit: () => void;
  isBn: boolean;
}

export default function CompanyReviewsTab({ avgReview, totalReviews, ratingBreakdown, reviews, reviewsLoading, isAuthenticated, userHasReviewed, reviewRating, reviewHoverRating, reviewComment, reviewAnonymous, reviewSubmitting, categoryRatings, onRate, onHoverRate, onCategoryRate, onCommentChange, onAnonymousChange, onSubmit, isBn }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Company Reviews</h2>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-bold">{avgReview}</span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`h-5 w-5 ${s <= Math.round(Number(avgReview)) ? "text-yellow-400" : "text-yellow-400/30"}`}>&#9733;</span>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">({totalReviews} reviews)</span>
      </div>
      {ratingBreakdown.length > 0 && (
        <div className="space-y-2 max-w-md">
          {ratingBreakdown.map((r) => (
            <div key={r.stars} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-right">{r.stars}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.percent}%` }} /></div>
              <span className="w-10 text-right text-muted-foreground">{r.percent}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Review Form */}
      {isAuthenticated && !userHasReviewed && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Write a Review</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating *</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onMouseEnter={() => onHoverRate(s)} onMouseLeave={() => onHoverRate(0)} onClick={() => onRate(s)} className="p-0.5">
                    <span className={`h-7 w-7 ${s <= (reviewHoverRating || reviewRating) ? "text-yellow-400" : "text-gray-300"}`}>&#9733;</span>
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
                        <button key={s} type="button" onClick={() => onCategoryRate(key, s)} className="p-0">
                          <span className={`h-4 w-4 ${s <= (categoryRatings[key] || 0) ? "text-yellow-400" : "text-gray-300"}`}>&#9733;</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comment *</label>
              <Textarea placeholder="Share your experience..." value={reviewComment} onChange={(e) => onCommentChange(e.target.value)} rows={4} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={reviewAnonymous} onCheckedChange={onAnonymousChange} />
              <label className="text-sm text-muted-foreground">Submit anonymously</label>
            </div>
            <Button onClick={onSubmit} disabled={reviewSubmitting || reviewRating === 0}>
              {reviewSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && userHasReviewed && (
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium">{isBn ? "আপনি ইতিমধ্যে রিভিউ দিয়েছেন" : "You have already reviewed this company"}</p>
        </div>
      )}

      {reviewsLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 w-full bg-muted rounded animate-pulse" />)}</div>
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
                    <span key={s} className={`h-3 w-3 ${s <= Math.floor(Number(t.overall_rating || t.rating)) ? "text-yellow-400" : "text-yellow-400/30"}`}>&#9733;</span>
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
  );
}