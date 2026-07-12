"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { useAuth } from "@/hooks/use-auth";
import { subscriptionService, type QuotaInfo } from "@/services/subscription.service";
import api from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check, X, Zap, Crown, CreditCard, Clock, Calendar, Shield,
  ArrowUpRight, CheckCircle2, AlertCircle, Package, Star, Loader2,
  Wallet, AlertTriangle, Plus, PartyPopper, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Plan, Subscription } from "@/types";

// Feature display labels
const FEATURE_LABELS: Record<string, (isBn: boolean) => string> = {
  job_applications_limit: (b) => b ? "চাকরি আবেদন" : "Job Applications",
  ai_chat_messages: (b) => b ? "AI চ্যাট" : "AI Chat Messages",
  ai_cover_letters: (b) => b ? "AI কভার লেটার" : "AI Cover Letters",
  ai_resume_score: (b) => b ? "AI সিভি স্কোর" : "AI Resume Score",
  cv_templates: (b) => b ? "সিভি টেমপ্লেট" : "CV Templates",
  job_boost: (b) => b ? "চাকরি বুস্ট" : "Job Boost",
  priority_support: (b) => b ? "অগ্রাধিকার সাপোর্ট" : "Priority Support",
  featured_profile: (b) => b ? "বৈশিষ্ট্যযুক্ত প্রোফাইল" : "Featured Profile",
  unlimited_applications: (b) => b ? "অসীমিত আবেদন" : "Unlimited Applications",
};

export default function SubscriptionPage() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [quotas, setQuotas] = useState<Record<string, QuotaInfo>>({});
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [depositMethods, setDepositMethods] = useState<any[]>([]);

  // Cancel state
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
      const [p, result] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getMySubscriptionWithQuotas(),
      ]);
      setPlans(p ?? []);
      setSubscription(result.subscription ?? null);
      setQuotas(result.quotas ?? {});
    } catch {
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }

    // Load wallet balance
    setWalletLoading(true);
    try {
      const walletRes = await api.get("/candidate/wallet");
      const d = walletRes.data;
      setWalletBalance(Number(d.wallet?.balance || d.balance || 0));
      setDepositMethods(d.deposit_methods || []);
    } catch {
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

  // Get current plan's sort order for upgrade/downgrade logic
  const currentPlanIndex = useMemo(() => {
    if (!subscription?.plan_id) return -1;
    return plans.findIndex((p) => p.id === subscription.plan_id);
  }, [subscription, plans]);

  const getButtonState = (plan: Plan) => {
    const planIndex = plans.findIndex((p) => p.id === plan.id);

    if (subscription?.plan_id === plan.id) {
      return { label: isBn ? "বর্তমান প্ল্যান" : "Current Plan", variant: "outline" as const, disabled: true, icon: CheckCircle2 };
    }

    if (currentPlanIndex >= 0 && planIndex > currentPlanIndex) {
      return { label: isBn ? "আপগ্রেড করুন" : "Upgrade", variant: "default" as const, disabled: false, icon: ArrowUpRight };
    }

    if (currentPlanIndex >= 0 && planIndex < currentPlanIndex) {
      return null;
    }

    return { label: isBn ? "এখনই সাবস্ক্রাইব" : "Subscribe", variant: "outline" as const, disabled: false, icon: CreditCard };
  };

  const handleSubscribe = async (planId: number) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    
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
      const res = await api.post("/candidate/deposit", {
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
        const walletRes = await api.get("/candidate/wallet");
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

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionService.cancel();
      setShowCancelConfirm(false);
      toast.success(isBn ? "সাবস্ক্রিপশন বাতিল করা হয়েছে" : "Subscription cancelled successfully");
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isBn ? "বাতিল করতে ব্যর্থ হয়েছে" : "Failed to cancel subscription"));
    } finally {
      setCancelling(false);
    }
  };

  const hasSufficientBalance = selectedPlan && walletBalance !== null
    ? walletBalance >= selectedPlan.price
    : false;

  const quotaColor = (used: number, max: number) => {
    if (max <= 0) return "text-muted-foreground";
    const pct = (used / max) * 100;
    if (pct >= 95) return "text-red-500";
    if (pct >= 80) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isBn ? "সাবস্ক্রিপশন" : "Subscription"}</h1>
          <p className="text-muted-foreground mt-1">
            {isBn ? "আপনার প্ল্যান এবং সীমাবদ্ধতা পরিচালনা করুন" : "Manage your plan and usage limits"}
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

      {/* Current Plan Header */}
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : subscription ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{subscription.plan_name || subscription.plan?.name || "Free"}</h3>
                    {subscription.plan?.price > 0 && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        {isBn ? "প্রিমিয়াম" : "Premium"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {isBn ? "বৈধ পর্যন্ত" : "Valid until"}{" "}
                    {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : "-"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="capitalize">{subscription.status}</Badge>
                {subscription.plan?.price > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowCancelConfirm(true)}>
                    {isBn ? "বাতিল করুন" : "Cancel"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowPurchaseModal(true)}>
                  {isBn ? "আপগ্রেড" : "Upgrade Plan"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              {isBn ? "আপনার কোনো সক্রিয় সাবস্ক্রিপশন নেই" : "You don't have an active subscription"}
            </p>
            <Button size="sm" onClick={() => setShowPurchaseModal(true)}>
              {isBn ? "প্ল্যান দেখুন" : "View Plans"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Live Usage Limits */}
      {Object.keys(quotas).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {isBn ? "ব্যবহারের সীমাবদ্ধতা" : "Usage Limits"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(quotas).map(([key, quota]) => {
              const label = FEATURE_LABELS[key]?.(isBn) || key.replace(/_/g, " ");
              const pct = quota.max_limit > 0 ? Math.min((quota.used / quota.max_limit) * 100, 100) : 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className={quotaColor(quota.used, quota.max_limit)}>
                      {quota.used} / {quota.max_limit} {isBn ? "ব্যবহৃত" : "used"}
                      {quota.max_limit > 0 && (
                        <span className="text-muted-foreground ml-1">
                          ({isBn ? "বাকি" : "left"}: {quota.remaining})
                        </span>
                      )}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const btnState = getButtonState(plan);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${plan.is_popular ? "border-primary shadow-md" : ""}`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Zap className="h-3 w-3 mr-1" /> Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{plan.name}</span>
                    {subscription?.plan_id === plan.id && (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col flex-1">
                  <div>
                    <span className="text-3xl font-bold">{plan.currency || ""}{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.billing_cycle}</span>
                  </div>

                  <ul className="space-y-2.5 text-sm flex-1">
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

                  {btnState && (() => {
                    const Icon = btnState.icon;
                    return (
                      <Button
                        className="w-full mt-auto"
                        variant={btnState.variant}
                        disabled={btnState.disabled || subscribing === plan.id}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {subscribing === plan.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4 mr-2" />
                        )}
                        {btnState.label}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                  <Link href="/dashboard/wallet">
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
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={(v) => !v && setShowCancelConfirm(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isBn ? "সাবস্ক্রিপশন বাতিল করুন" : "Cancel Subscription"}
            </DialogTitle>
            <DialogDescription>
              {isBn
                ? "আপনার সাবস্ক্রিপশন বাতিল করলে আপনি বর্তমান বিলিং চক্র শেষ না হওয়া পর্যন্ত সুবিধাগুলি ব্যবহার করতে পারবেন। আপনি কি নিশ্চিত?"
                : "If you cancel, you will continue to have access to features until your current billing cycle ends. Are you sure?"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {isBn
                  ? "এই সিদ্ধান্ত পুনরায় পরিবর্তন করা যাবে না। ভবিষ্যতে আবার সাবস্ক্রাইব করতে পারবেন।"
                  : "This action cannot be undone. You can resubscribe anytime in the future."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1"
                disabled={cancelling}
              >
                {isBn ? "না, রাখুন" : "Keep Plan"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1"
              >
                {cancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isBn ? "হ্যাঁ, বাতিল করুন" : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
