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
import {
  Check,
  Zap,
  Loader2,
  Wallet,
  AlertCircle,
  CheckCircle,
  Info,
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

    // Check wallet balance against total price (base + tax if applicable)
    const tax = calculateTax(plan.price, taxSettings);
    const totalPrice = tax.is_inclusive ? plan.price : plan.price + tax.amount;

    if (walletBalance !== null && walletBalance < totalPrice) {
      toast.error(
        isBn
          ? `পর্যাপ্ত ব্যালেন্স নেই। আপনার ব্যালেন্স: ${formatCurrency(
              walletBalance
            )}, প্রয়োজন: ${formatCurrency(totalPrice)}`
          : `Insufficient balance. Your balance: ${formatCurrency(
              walletBalance
            )}, required: ${formatCurrency(totalPrice)}`
      );
      return;
    }

    setSubscribing(plan.id);
    try {
      await subscriptionService.subscribe(plan.id);
      toast.success(
        isBn
          ? "সাবস্ক্রিপশন সফল হয়েছে!"
          : "Subscription successful!"
      );
      // Refresh subscription data
      const subData = await subscriptionService.getMySubscription().catch(() => null);
      setCurrentSubscription(subData);
      // Refresh wallet
      try {
        const walletUrl = isEmployer ? "/employer/wallet" : "/candidate/wallet";
        const walletRes = await api.get(walletUrl);
        const b = Number(walletRes.data?.balance ?? walletRes.data?.data?.balance ?? walletRes.data?.wallet?.balance ?? 0);
        setWalletBalance(isNaN(b) ? 0 : b);
      } catch {
        // ignore
      }
      router.push(isEmployer ? "/employer/subscription" : "/dashboard");
    } catch (e: any) {
      toast.error(
        e.response?.data?.message ||
          (isBn ? "সাবস্ক্রিপশন ব্যর্থ হয়েছে" : "Subscription failed")
      );
    } finally {
      setSubscribing(null);
    }
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
                      <ul className="space-y-3 text-sm flex-1">
                        {plan.features?.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary shrink-0" />
                            {feature.name}
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button
                          className="w-full mt-6"
                          variant="outline"
                          size="lg"
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isBn ? "বর্তমান প্ল্যান" : "Current Plan"}
                        </Button>
                      ) : (
                        <Button
                          className="w-full mt-6"
                          variant={plan.is_popular ? "default" : "outline"}
                          size="lg"
                          onClick={() => handleSubscribe(plan)}
                          disabled={isSubscribing}
                        >
                          {isSubscribing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {isBn ? "প্রক্রিয়া হচ্ছে..." : "Processing..."}
                            </>
                          ) : (
                            <>
                              {insufficientBalance && (
                                <AlertCircle className="h-4 w-4 mr-1" />
                              )}
                              {isBn ? "এখনই শুরু করুন" : "Get Started"}
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
