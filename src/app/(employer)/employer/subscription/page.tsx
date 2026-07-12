"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { subscriptionService } from "@/services/subscription.service";
import type { QuotaInfo } from "@/services/subscription.service";
import api from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Check,
  X,
  CreditCard,
  Zap,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Users,
  Sparkles,
  BarChart3,
  Shield,
  TrendingUp,
  Crown,
  Wallet,
  Loader2,
  CheckCircle,
  Plus,
  PartyPopper,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Plan, Subscription } from "@/types";

/* ─── Quota display config ─── */
const quotaDisplayConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; labelEn: string; labelBn: string }
> = {
  job_posts: {
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "Job Posts",
    labelBn: "চাকরি পোস্ট",
  },
  ai_career_tools: {
    icon: Sparkles,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "AI Career Tools",
    labelBn: "এআই ক্যারিয়ার টুলস",
  },
  candidate_database_access: {
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "Candidate Database",
    labelBn: "ক্যান্ডিডেট ডাটাবেস",
  },
  job_boosts: {
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "Job Boosts",
    labelBn: "চাকরি বুস্ট",
  },
  promoted_listings: {
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "Promoted Listings",
    labelBn: "প্রমোটেড লিস্টিং",
  },
  messages_per_day: {
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "Messages / Day",
    labelBn: "বার্তা / দিন",
  },
  ai_cover_letters: {
    icon: Sparkles,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "AI Cover Letters",
    labelBn: "এআই কভার লেটার",
  },
  ai_resume_scoring: {
    icon: Sparkles,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "AI Resume Scoring",
    labelBn: "এআই রিজিউম স্কোরিং",
  },
  ai_job_descriptions: {
    icon: Sparkles,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    labelEn: "AI Job Descriptions",
    labelBn: "এআই চাকরি বর্ণনা",
  },
};

function getQuotaLabel(key: string, isBn: boolean): string {
  const config = quotaDisplayConfig[key];
  if (config) return isBn ? config.labelBn : config.labelEn;
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function QuotaCard({
  quotaKey,
  quota,
  isBn,
}: {
  quotaKey: string;
  quota: QuotaInfo;
  isBn: boolean;
}) {
  const config = quotaDisplayConfig[quotaKey] || {
    icon: BarChart3,
    color: "text-gray-600",
    bg: "bg-gray-50 dark:bg-gray-950",
  };
  const Icon = config.icon;
  const isUnlimited = quota.max_limit >= 9999;
  const percent = isUnlimited ? 0 : Math.min(100, Math.round((quota.used / Math.max(quota.max_limit, 1)) * 100));
  const isHigh = percent >= 80;
  const isLow = percent >= 50 && percent < 80;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{getQuotaLabel(quotaKey, isBn)}</p>
              <p className="text-xs text-muted-foreground">
                {isUnlimited
                  ? isBn ? "অসীমিত" : "Unlimited"
                  : `${quota.used} / ${quota.max_limit}`}
              </p>
            </div>
            {!isUnlimited && (
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHigh
                      ? "bg-red-500"
                      : isLow
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
            {!isUnlimited && (
              <p className="text-xs text-muted-foreground mt-1">
                {quota.remaining > 0
                  ? isBn
                    ? `${quota.remaining} বাকি`
                    : `${quota.remaining} remaining`
                  : isBn
                  ? "সীমা শেষ"
                  : "Limit reached"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployerSubscriptionPage() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [quotas, setQuotas] = useState<Record<string, QuotaInfo>>({});
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [depositMethods, setDepositMethods] = useState<any[]>([]);

  // Purchase modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<"confirm" | "add-money">("confirm");
  const [purchasing, setPurchasing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Thank you modal state
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, subData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getMySubscriptionWithQuotas(),
      ]);
      setPlans(p ?? []);
      setSubscription(subData.subscription);
      setQuotas(subData.quotas);
    } catch {
      toast.error(isBn ? "সাবস্ক্রিপশন তথ্য লোড করতে ব্যর্থ" : "Failed to load subscription data");
    } finally {
      setLoading(false);
    }

    // Load wallet balance
    setWalletLoading(true);
    try {
      const walletRes = await api.get("/employer/wallet");
      const d = walletRes.data;
      setWalletBalance(Number(d.wallet?.balance || d.balance || 0));
      setDepositMethods(d.deposit_methods || []);
    } catch {
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

  const expiryDate = subscription?.expires_at || subscription?.end_date;
  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const planFeatures = subscription?.plan?.features || [];
  const planFeaturesMapped = subscription?.plan?.features_mapped || {};

  const handlePurchaseClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setPurchaseStep("confirm");
    setSelectedGateway("");
    setDepositAmount("");
    setShowPurchaseModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      await subscriptionService.subscribe(selectedPlan.id);
      setShowPurchaseModal(false);
      setShowThankYou(true);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isBn ? "ক্রয় ব্যর্থ হয়েছে" : "Purchase failed"));
    } finally {
      setPurchasing(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedGateway || !depositAmount) return;
    setDepositLoading(true);
    try {
      const res = await api.post("/employer/deposit", {
        gateway_id: Number(selectedGateway),
        amount: Number(depositAmount),
      });
      if (res.data.redirect_url) {
        window.location.href = res.data.redirect_url;
        return;
      }
      toast.success(isBn ? "ডিপোজিট সফল হয়েছে" : "Deposit submitted successfully");
      setPurchaseStep("confirm");
      try {
        const walletRes = await api.get("/employer/wallet");
        const d = walletRes.data;
        setWalletBalance(Number(d.wallet?.balance || d.balance || 0));
      } catch {
        // ignore
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Deposit failed");
    } finally {
      setDepositLoading(false);
    }
  };

  const hasSufficientBalance = selectedPlan && walletBalance !== null
    ? walletBalance >= selectedPlan.price
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isBn ? "সাবস্ক্রিপশন" : "Subscription"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isBn ? "আপনার প্ল্যান ও ব্যবহার ট্র্যাক করুন" : "Manage your employer plan and track usage"}
          </p>
        </div>
        {/* Wallet Balance Card */}
        <Card className="sm:w-auto w-full">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isBn ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}</p>
                {walletLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-lg font-bold leading-tight">{formatCurrency(walletBalance || 0)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan + Expiry + Quotas */}
      {loading ? (
        <div className="space-y-4">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Current Plan Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">
                      {subscription?.plan?.name || (isBn ? "বিনামূল্যে প্ল্যান" : "Free Plan")}
                    </h3>
                    {subscription && subscription?.plan?.price > 0 && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        {isBn ? "প্রিমিয়াম" : "Premium"}
                      </Badge>
                    )}
                    <Badge variant={subscription ? "success" : "secondary"} className="capitalize">
                      {subscription?.status || "active"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription
                      ? `${isBn ? "বৈধ পর্যন্ত" : "Valid until"} ${expiryDate ? new Date(expiryDate).toLocaleDateString() : "—"}`
                      : (isBn ? "নতুন অ্যাকাউন্টের জন্য ডিফল্ট প্ল্যান" : "Default plan for new accounts")}
                  </p>
                </div>
                {subscription?.plan?.price != null && (
                  <div className="text-right">
                    <span className="text-2xl font-bold">
                      {subscription.plan.currency || "৳"}
                      {subscription.plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{subscription.plan.billing_cycle}
                    </span>
                  </div>
                )}
              </div>

              {/* Expiry & Days Remaining */}
              {expiryDate && daysRemaining !== null && (
                <>
                  <Separator className="my-4" />
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {isBn ? "মেয়াদ শেষ" : "Expires"}:
                      </span>
                      <span className="font-medium">
                        {new Date(expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {isBn ? "বাকি দিন" : "Days remaining"}:
                      </span>
                      <Badge
                        variant={daysRemaining <= 7 ? "destructive" : daysRemaining <= 30 ? "warning" : "success"}
                      >
                        {daysRemaining} {isBn ? "দিন" : "days"}
                      </Badge>
                    </div>
                    {daysRemaining <= 7 && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {isBn ? "শীঘ্রই মেয়াদ শেষ!" : "Expiring soon!"}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Plan Features (from features_mapped) */}
              {planFeatures.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {isBn ? "প্ল্যানের বৈশিষ্ট্য" : "Plan Features"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {planFeatures.map((feature: any, i: number) => {
                        const val = planFeaturesMapped[feature.id as string] ?? feature.value;
                        const isFalse = val === false || val === "false" || val === 0 || val === "0";
                        const isAvailable = !isFalse && val != null;
                        const isUnlimited = Number(val) >= 9999;
                        const isBoolean = val === true || val === "true" || val === "false";
                        
                        return (
                          <div key={i} className={`flex items-center gap-2 text-sm ${isAvailable ? "opacity-100 text-foreground font-medium" : "opacity-50 text-muted-foreground/75"}`}>
                            {isAvailable ? (
                              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                            )}
                            <span>{feature.name}</span>
                            {!isBoolean && isAvailable && (
                              <span className="font-semibold ml-auto text-primary">
                                {isUnlimited
                                  ? isBn ? "অসীমিত" : "Unlimited"
                                  : val}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quota Usage */}
          {Object.keys(quotas).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                {isBn ? "ব্যবহারের হিসাব" : "Usage Quotas"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(quotas).map(([key, quota]) => (
                  <QuotaCard key={key} quotaKey={key} quota={quota} isBn={isBn} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {isBn ? "উপলব্ধ প্ল্যান" : "Available Plans"}
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : !plans.length ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {isBn ? "কোনো প্ল্যান পাওয়া যায়নি" : "No plans available"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 ${
                  plan.is_popular 
                    ? "border-primary shadow-lg ring-2 ring-primary/10 scale-[1.02] md:scale-[1.03] z-10 bg-gradient-to-b from-primary/[0.02] to-transparent" 
                    : "border-border shadow-sm hover:shadow-md"
                }`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-semibold px-3 py-0.5">
                    <Zap className="h-3 w-3 mr-1 fill-current" /> Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-black tracking-tight">
                      {plan.currency || "৳"}{plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">/{plan.billing_cycle}</span>
                  </div>
                  <ul className="space-y-2.5 text-sm py-2">
                    {plan.features?.map((feature, i) => {
                      const val = plan.features_mapped?.[feature.id as string] ?? feature.value;
                      const isFalse = val === false || val === "false" || val === 0 || val === "0";
                      const isAvailable = !isFalse && val != null;
                      const isUnlimited = Number(val) >= 9999;
                      const isBoolean = val === true || val === "true" || val === "false";
                      
                      return (
                        <li key={i} className={`flex items-center gap-2 ${isAvailable ? "opacity-100 text-foreground font-medium" : "opacity-45 text-muted-foreground/70"}`}>
                          {isAvailable ? (
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className="flex-1">{feature.name}</span>
                          {!isBoolean && isAvailable && (
                            <span className="text-primary font-semibold">
                              {isUnlimited ? (isBn ? "অসীমিত" : "Unlimited") : val}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.is_popular ? "default" : "outline"}
                    disabled={subscription?.plan?.id === plan.id}
                    onClick={() => {
                      if (subscription?.plan?.id !== plan.id) {
                        handlePurchaseClick(plan);
                      }
                    }}
                  >
                    {subscription?.plan?.id === plan.id ? (
                      <span>{isBn ? "বর্তমান প্ল্যান" : "Current Plan"}</span>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-1" />
                        {isBn ? "কিনুন" : "Purchase"}
                      </>
                    )}
                  </Button>
                  {subscription?.plan?.id !== plan.id && (
                    <Button
                      variant="link"
                      className="w-full mt-1"
                      asChild
                    >
                      <Link href={`/employer/subscription/details/${plan.id}`}>
                        {isBn ? "বিস্তারিত দেখুন" : "View Details"}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={(v) => !v && setShowPurchaseModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isBn ? "প্ল্যান কিনুন" : "Purchase Plan"}
            </DialogTitle>
            <DialogDescription>
              {isBn
                ? `প্ল্যানটি কিনতে আপনার ওয়ালেট থেকে পেমেন্ট করুন`
                : `Pay from your wallet to purchase the ${selectedPlan?.name} plan`}
            </DialogDescription>
          </DialogHeader>

          {purchaseStep === "confirm" && selectedPlan && (
            <div className="space-y-4">
              {/* Plan Info */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{selectedPlan.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedPlan.billing_cycle}
                  </p>
                </div>
                <p className="text-lg font-bold">{formatCurrency(selectedPlan.price)}</p>
              </div>

              <Separator />

              {/* Wallet Balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {isBn ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}
                  </span>
                </div>
                {walletLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="font-semibold">
                    {formatCurrency(walletBalance || 0)}
                  </span>
                )}
              </div>

              {hasSufficientBalance ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {isBn
                      ? "পর্যাপ্ত ব্যালেন্স আছে"
                      : "Sufficient balance available"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {isBn
                      ? "পর্যাপ্ত ব্যালেন্স নেই। আরো দরকার"
                      : `Insufficient balance. Need ${formatCurrency(selectedPlan.price - (walletBalance || 0))} more`}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </Button>
                {hasSufficientBalance ? (
                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing || walletLoading}
                    className="flex-1"
                  >
                    {purchasing && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {isBn ? "কিনুন" : "Purchase"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setPurchaseStep("add-money")}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isBn ? "অর্থ যোগ করুন" : "Add Money"}
                  </Button>
                )}
              </div>

              {!hasSufficientBalance && (
                <Button variant="link" size="sm" className="w-full mt-1" asChild>
                  <Link href="/employer/wallet">
                    <Wallet className="h-4 w-4 mr-2" />
                    {isBn ? "ওয়ালেট পৃষ্ঠায় যান" : "Go to Wallet Page"}
                  </Link>
                </Button>
              )}
            </div>
          )}

          {purchaseStep === "add-money" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>{isBn ? "অর্থ যোগ করুন" : "Add Money to Wallet"}</span>
              </div>

              {depositMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isBn ? "কোনো পেমেন্ট মেথড পাওয়া যায়নি" : "No payment methods available"}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{isBn ? "পেমেন্ট মেথড" : "Payment Method"}</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      value={selectedGateway}
                      onChange={(e) => setSelectedGateway(e.target.value)}
                    >
                      <option value="">{isBn ? "মেথড নির্বাচন করুন" : "Select method"}</option>
                      {depositMethods.map((g: any) => (
                        <option key={g.id} value={g.id}>
                          {g.display_name || g.name}
                          {Number(g.percent_charge) > 0 ? ` (${g.percent_charge}% fee)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isBn ? "পরিমাণ (BDT)" : "Amount (BDT)"}
                    </label>
                    <input
                      type="number"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder={isBn ? "পরিমাণ লিখুন" : "Enter amount"}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="10"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setPurchaseStep("confirm")}
                      className="flex-1"
                    >
                      {isBn ? "পেছনে" : "Back"}
                    </Button>
                    <Button
                      onClick={handleDeposit}
                      disabled={!selectedGateway || !depositAmount || depositLoading}
                      className="flex-1"
                    >
                      {depositLoading && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {isBn ? "ডিপোজিট করুন" : "Deposit"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Thank You Modal */}
      <Dialog open={showThankYou} onOpenChange={(v) => !v && setShowThankYou(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              {isBn ? "ধন্যবাদ!" : "Thank You!"}
            </DialogTitle>
            <DialogDescription>
              {isBn
                ? "আপনার সাবস্ক্রিপশন সফলভাবে সম্পন্ন হয়েছে"
                : "Your subscription has been successfully completed"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center p-6 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-700 dark:text-green-400">
                  {isBn ? "সাবস্ক্রিপশন সক্রিয়!" : "Subscription Active!"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowThankYou(false)}
                className="flex-1"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </Button>
              <Button
                onClick={() => {
                  setShowThankYou(false);
                  loadData();
                }}
                className="flex-1"
              >
                {isBn ? "রিফ্রেশ করুন" : "Refresh"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
