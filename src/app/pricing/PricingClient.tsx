"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { useAuth } from "@/hooks/use-auth";
import { subscriptionService } from "@/services/subscription.service";
import api from "@/lib/api-client";
import PublicLayout from "@/components/layout/PublicLayout";
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
import Link from "next/link";
import {
  Check,
  X,
  Zap,
  Loader2,
  Wallet,
  AlertCircle,
  CheckCircle,
  Info,
  CreditCard,
  Plus,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Plan, Subscription } from "@/types";

interface TaxSetting {
  id: number;
  name: string;
  label?: string;
  rate: number;
  country_code?: string | null;
  is_inclusive?: boolean;
  is_active: boolean;
  is_default?: boolean;
  applies_to?: string;
  [key: string]: any;
}

interface TaxBreakdown {
  rate: number;
  amount: number;
  label: string;
  is_inclusive: boolean;
}

function calculateTax(
  basePrice: number,
  taxSettings: TaxSetting[]
): TaxBreakdown {
  if (!taxSettings.length) {
    return { rate: 0, amount: 0, label: "Tax", is_inclusive: false };
  }

  // Find the best matching tax setting: default first, then any active one that applies to subscriptions
  const applicable = taxSettings.find(
    (t) =>
      t.is_active &&
      t.rate > 0 &&
      (t.applies_to === "all" || t.applies_to === "subscription")
  );

  if (!applicable) {
    return { rate: 0, amount: 0, label: "Tax", is_inclusive: false };
  }

  const rate = Number(applicable.rate);
  const isInclusive = applicable.is_inclusive ?? false;
  const amount = isInclusive
    ? Math.round(basePrice - basePrice / (1 + rate / 100) * 100) / 100
    : Math.round(basePrice * (rate / 100) * 100) / 100;

  return {
    rate,
    amount,
    label: applicable.label || applicable.name || "Tax",
    is_inclusive: isInclusive,
  };
}

// Feature display labels
const FEATURE_LABELS: Record<string, (isBn: boolean) => string> = {
  // Candidate features
  job_applications_limit: (b) => b ? "চাকরি আবেদন" : "Job Applications",
  ai_chat_messages: (b) => b ? "AI চ্যাট" : "AI Chat Messages",
  ai_cover_letters: (b) => b ? "AI কভার লেটার" : "AI Cover Letters",
  ai_resume_score: (b) => b ? "AI সিভি স্কোর" : "AI Resume Score",
  cv_templates: (b) => b ? "সিভি টেমপ্লেট" : "CV Templates",
  job_boost: (b) => b ? "চাকরি বুস্ট" : "Job Boost",
  priority_support: (b) => b ? "অগ্রাধিকার সাপোর্ট" : "Priority Support",
  featured_profile: (b) => b ? "বৈশিষ্ট্যযুক্ত প্রোফাইল" : "Featured Profile",
  unlimited_applications: (b) => b ? "অসীমিত আবেদন" : "Unlimited Applications",

  // Employer features
  job_posts: (b) => b ? "চাকরি পোস্ট" : "Job Posts",
  ai_career_tools: (b) => b ? "এআই ক্যারিয়ার টুলস" : "AI Career Tools",
  candidate_database_access: (b) => b ? "ক্যান্ডিডেট ডাটাবেস" : "Candidate Database",
  job_boosts: (b) => b ? "চাকরি বুস্ট" : "Job Boosts",
  promoted_listings: (b) => b ? "প্রমোটেড লিস্টিং" : "Promoted Listings",
  messages_per_day: (b) => b ? "বার্তা / দিন" : "Messages / Day",
  ai_resume_scoring: (b) => b ? "এআই রিজিউম স্কোরিং" : "AI Resume Scoring",
  ai_job_descriptions: (b) => b ? "এআই চাকরি বর্ণনা" : "AI Job Descriptions",
};

export default function PricingClient() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const isEmployer = role === "employer";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);

  // Purchase modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<"confirm" | "add-money">("confirm");
  const [purchasing, setPurchasing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMethods, setDepositMethods] = useState<any[]>([]);

  // Thank you modal state
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subData] = await Promise.all([
        subscriptionService.getPlans().catch(() => []),
        subscriptionService.getMySubscription().catch(() => null),
      ]);
      setPlans(plansData);
      setCurrentSubscription(subData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // Load wallet balance (role-aware)
    try {
      const walletUrl = isEmployer ? "/employer/wallet" : "/candidate/wallet";
      const walletRes = await api.get(walletUrl);
      const b = Number(walletRes.data?.balance ?? walletRes.data?.data?.balance ?? walletRes.data?.wallet?.balance ?? 0);
      setWalletBalance(isNaN(b) ? 0 : b);
      setDepositMethods(walletRes.data?.deposit_methods || walletRes.data?.data?.deposit_methods || []);
    } catch {
      // ignore
    }

    // Load tax settings
    try {
      const financialRes = await api.get("/settings/financial");
      const settings = financialRes.data?.data || financialRes.data || {};
      if (Array.isArray(settings.tax_settings)) {
        setTaxSettings(settings.tax_settings);
      }
    } catch {
      // ignore - no tax settings available
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!isAuthenticated) {
      toast.info(
        isBn
          ? "সাবস্ক্রিপশনের জন্য লগইন করুন"
          : "Please login to subscribe"
      );
      router.push(isEmployer ? "/employer/login" : "/login");
      return;
    }

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
      // Refresh data
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
      const depositUrl = isEmployer ? "/employer/deposit" : "/candidate/deposit";
      const res = await api.post(depositUrl, {
        gateway_id: Number(selectedGateway),
        amount: Number(depositAmount),
      });
      if (res.data.redirect_url) {
        window.location.href = res.data.redirect_url;
        return;
      }
      toast.success(isBn ? "ডিপোজিট সফল হয়েছে" : "Deposit submitted successfully");
      setPurchaseStep("confirm");
      // Refresh wallet
      try {
        const walletUrl = isEmployer ? "/employer/wallet" : "/candidate/wallet";
        const walletRes = await api.get(walletUrl);
        const b = Number(walletRes.data?.balance ?? walletRes.data?.data?.balance ?? walletRes.data?.wallet?.balance ?? 0);
        setWalletBalance(isNaN(b) ? 0 : b);
      } catch {
        // ignore
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Deposit failed");
    } finally {
      setDepositLoading(false);
    }
  };

  const getUpgradeCredit = (activeSub: any) => {
    if (!activeSub || !activeSub.starts_at || !activeSub.expires_at) return 0;
    const oldPrice = Number(activeSub.plan_details?.price || activeSub.plan?.price || 0);
    if (oldPrice <= 0) return 0;

    const starts = new Date(activeSub.starts_at);
    const expires = new Date(activeSub.expires_at);
    const now = new Date();

    const totalDays = Math.max(1, Math.round((expires.getTime() - starts.getTime()) / (1000 * 60 * 60 * 24)));
    let usedDays = Math.round((now.getTime() - starts.getTime()) / (1000 * 60 * 60 * 24));
    if (usedDays < 0) usedDays = 0;
    if (usedDays > totalDays) usedDays = totalDays;

    const perDay = oldPrice / totalDays;
    const credit = Math.max(0, oldPrice - (usedDays * perDay));
    return Number(credit.toFixed(2));
  };

  const getButtonState = (plan: Plan) => {
    const isCurrentPlan = hasActiveSubscription && currentPlanId === plan.id;
    if (isCurrentPlan) {
      return { label: isBn ? "বর্তমান প্ল্যান" : "Current Plan", disabled: true };
    }

    if (!isAuthenticated) {
      return { label: isBn ? "লগইন করে সাবস্ক্রাইব করুন" : "Login to Subscribe", disabled: false };
    }

    if (hasActiveSubscription && currentSubscription?.plan) {
      const currentPrice = Number(currentSubscription.plan_details?.price || currentSubscription.plan.price || 0);
      if (plan.price < currentPrice) {
        return { label: isBn ? "ডাউনগ্রেড সম্ভব নয়" : "Downgrade Restricted", disabled: true };
      }
      if (plan.price > currentPrice) {
        return { label: isBn ? "আপগ্রেড করুন" : "Upgrade", disabled: false };
      }
      return { label: isBn ? "প্ল্যান পরিবর্তন করুন" : "Change Plan", disabled: false };
    }

    return { label: isBn ? "এখনই শুরু করুন" : "Get Started", disabled: false };
  };

  const currentPlanId = currentSubscription?.plan_id;
  const hasActiveSubscription =
    currentSubscription && currentSubscription.status === "active";

  const hasTax = taxSettings.some(
    (t) =>
      t.is_active &&
      t.rate > 0 &&
      (t.applies_to === "all" || t.applies_to === "subscription")
  );

  return (
    <PublicLayout>
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">
            {isBn ? "মূল্য পরিকল্পনা" : "Pricing Plans"}
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            {isBn
              ? "আপনার জন্য সঠিক প্ল্যান বেছে নিন"
              : "Choose the Right Plan"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-12">
            {isBn
              ? "ব্যক্তিগত এবং কোম্পানি উভয়ের জন্য সাশ্রয়ী মূল্য"
              : "Affordable plans for individuals and companies"}
          </p>

          {/* Wallet Balance */}
          {isAuthenticated && walletBalance !== null && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isBn ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}:
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(walletBalance)}
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-8">
                  <Skeleton className="h-6 w-24 mx-auto mb-4" />
                  <Skeleton className="h-10 w-20 mx-auto mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mx-auto mb-6" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => {
                const isCurrentPlan = hasActiveSubscription && currentPlanId === plan.id;
                const isSubscribing = subscribing === plan.id;
                const tax = calculateTax(plan.price, taxSettings);
                const showTax = tax.rate > 0;
                const totalPrice = tax.is_inclusive
                  ? plan.price
                  : plan.price + tax.amount;
                const insufficientBalance =
                  walletBalance !== null && walletBalance < totalPrice;

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col ${
                      plan.is_popular
                        ? "border-primary shadow-lg scale-[1.02]"
                        : ""
                    }`}
                  >
                    {plan.is_popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Zap className="h-3 w-3 mr-1" /> Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          {formatCurrency(showTax && !tax.is_inclusive ? plan.price : totalPrice)}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.billing_cycle}
                        </span>
                      </div>
                      {/* Tax breakdown */}
                      {showTax && (
                        <div className="mt-3 rounded-lg bg-muted/50 p-3 text-left text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {isBn ? "বেস মূল্য" : "Base Price"}
                            </span>
                            <span>{formatCurrency(plan.price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {tax.label}
                              {" "}
                              {tax.is_inclusive
                                ? `(${isBn ? "অন্তর্ভুক্ত" : "inclusive"})`
                                : `(${tax.rate}%)`}
                            </span>
                            <span>
                              {tax.is_inclusive ? `- ` : `+ `}
                              {formatCurrency(tax.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-1">
                            <span>
                              {isBn ? "মোট" : "Total"}
                              {tax.is_inclusive
                                ? ` (${isBn ? "কর অন্তর্ভুক্ত" : "tax incl."})`
                                : ""}
                            </span>
                            <span>{formatCurrency(totalPrice)}</span>
                          </div>
                        </div>
                      )}
                      {!showTax && hasTax && (
                        <p className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Info className="h-3 w-3" />
                          {isBn
                            ? "চেকআউটে কর হিসাব করা হবে"
                            : "Tax calculated at checkout"}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ul className="space-y-2.5 text-sm flex-1 text-left">
                        {plan.features?.map((feature, i) => {
                          const label = FEATURE_LABELS[feature.id.toString()]?.(isBn) || feature.name;
                          const val = feature.value;
                          const isFalse = val === false || val === "false" || val === 0 || val === "0";
                          const isAvailable = !isFalse && val != null;
                          const isUnlimited = Number(val) >= 9999;
                          const isBoolean = val === true || val === "true" || val === false || val === "false";
                          return (
                            <li key={i} className={`flex items-center gap-2 ${isAvailable ? "opacity-100 text-foreground font-medium" : "opacity-45 text-muted-foreground/70"}`}>
                              {isAvailable ? (
                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                              )}
                              <span className="flex-1">{label}</span>
                              {!isBoolean && isAvailable && (
                                <span className="text-primary font-semibold">
                                  {isUnlimited ? (isBn ? "অসীমিত" : "Unlimited") : val}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {(() => {
                        const btnState = getButtonState(plan);
                        return (
                          <Button
                            className="w-full mt-6"
                            variant={btnState.disabled ? "outline" : (plan.is_popular ? "default" : "outline")}
                            size="lg"
                            onClick={() => handleSubscribe(plan)}
                            disabled={btnState.disabled || subscribing === plan.id}
                          >
                            {subscribing === plan.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isBn ? "প্রক্রিয়া হচ্ছে..." : "Processing..."}
                              </>
                            ) : (
                              <>
                                {btnState.label === "Current Plan" || btnState.label === "বর্তমান প্ল্যান" ? (
                                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                ) : null}
                                {btnState.label}
                              </>
                            )}
                          </Button>
                        );
                      })()}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

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

          {purchaseStep === "confirm" && selectedPlan && (() => {
            const credit = currentSubscription ? getUpgradeCredit(currentSubscription) : 0;
            const planTax = calculateTax(selectedPlan.price, taxSettings);
            const basePrice = selectedPlan.price;
            const taxAmount = planTax.is_inclusive ? 0 : planTax.amount;
            const totalPrice = Math.max(0, basePrice + taxAmount - credit);
            const hasSufficientBalance = walletBalance !== null && walletBalance >= totalPrice;

            return (
              <div className="space-y-4">
                {/* Plan Info */}
                <div className="flex flex-col p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedPlan.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedPlan.billing_cycle}
                      </p>
                    </div>
                    <p className="font-bold">{formatCurrency(selectedPlan.price)}</p>
                  </div>
                  {credit > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                      <span>
                        {isBn ? "পূর্ববর্তী প্ল্যান থেকে ক্রেডিট" : "Credit from previous plan"}
                      </span>
                      <span>-{formatCurrency(credit)}</span>
                    </div>
                  )}
                  {planTax.rate > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {planTax.label} ({planTax.rate}%)
                      </span>
                      <span>{formatCurrency(planTax.amount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t font-bold">
                    <span>{isBn ? "মোট প্রদেয়" : "Net Payable"}</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
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
                  <span className="font-semibold">
                    {formatCurrency(walletBalance || 0)}
                  </span>
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
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {isBn
                        ? "পর্যাপ্ত ব্যালেন্স নেই। আরো দরকার"
                        : `Insufficient balance. Need ${formatCurrency(totalPrice - (walletBalance || 0))} more`}
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
                      disabled={purchasing}
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
                    <Link href={isEmployer ? "/employer/wallet" : "/dashboard/wallet"}>
                      <Wallet className="h-4 w-4 mr-2" />
                      {isBn ? "ওয়ালেট পৃষ্ঠায় যান" : "Go to Wallet Page"}
                    </Link>
                  </Button>
                )}
              </div>
            );
          })()}

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
    </PublicLayout>
  );
}
