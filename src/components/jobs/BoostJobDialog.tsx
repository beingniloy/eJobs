"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { useThemeStore } from "@/store/theme-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Zap, Megaphone, Star, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface BoostJobDialogProps {
  jobId: number;
  jobTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function BoostJobDialog({
  jobId,
  jobTitle,
  open,
  onOpenChange,
  onComplete,
}: BoostJobDialogProps) {
  const { language } = useThemeStore();
  const isBn = language === "bn";

  const [duration, setDuration] = useState("7");
  const [boostType, setBoostType] = useState("sponsored_job");
  const [dailyBudget, setDailyBudget] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const totalBudget = dailyBudget
    ? parseFloat(dailyBudget) * parseInt(duration, 10)
    : 0;

  useEffect(() => {
    if (open) {
      setLoadingWallet(true);
      setDailyBudget("");
      setDuration("7");
      setBoostType("sponsored_job");
      setShowConfirmation(false);
      api
        .get("/employer/wallet")
        .then((res) => {
          const d = res.data;
          const raw = d?.wallet?.balance ?? d?.data?.balance ?? d?.balance ?? 0;
          setWalletBalance(Number(raw) || 0);
        })
        .catch(() => setWalletBalance(0))
        .finally(() => setLoadingWallet(false));
    }
  }, [open]);

  const boostTypes = [
    { value: "sponsored_job", label: isBn ? "স্পনসরড চাকরি" : "Sponsored Job", description: isBn ? "সার্চে শীর্ষে প্রদর্শন" : "Top placement in search results", icon: Star },
    { value: "awareness_ad", label: isBn ? "ব্র্যান্ড অ্যাওয়্যারনেস" : "Brand Awareness", description: isBn ? "বিজ্ঞাপন ব্যানার প্লেসমেন্ট" : "Ad banner across the platform", icon: Megaphone },
  ];

  const getBoostLabel = () => boostTypes.find((bt) => bt.value === boostType)?.label || "Promotion";

  const handleSubmit = async () => {
    if (!dailyBudget || parseFloat(dailyBudget) <= 0) {
      toast.error(isBn ? "দৈনিক বাজেট দিন" : "Please enter a daily budget");
      return;
    }

    if (walletBalance !== null && totalBudget > walletBalance) {
      toast.error(isBn ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient wallet balance");
      return;
    }

    setSubmitting(true);
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + parseInt(duration, 10));
    const title = `${jobTitle} - ${getBoostLabel()}`;

    try {
      await api.post("/employer/promotions", {
        title,
        job_id: jobId,
        type: boostType,
        daily_budget: parseFloat(dailyBudget),
        total_budget: totalBudget,
        start_date: now.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });
      toast.success(isBn ? "চাকরি বুস্ট সফল!" : "Job boosted successfully!");
      setShowConfirmation(false);
      onOpenChange(false);
      onComplete?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isBn ? "বুস্ট করতে ব্যর্থ" : "Failed to boost job");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {isBn ? "চাকরি বুস্ট করুন" : "Boost Job"}
          </DialogTitle>
          <DialogDescription className="line-clamp-1">{jobTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{isBn ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}</span>
          </div>
          <span className="font-semibold">
            {loadingWallet ? <Loader2 className="h-4 w-4 animate-spin" /> : walletBalance !== null ? formatCurrency(walletBalance) : "--"}
          </span>
        </div>

        {!showConfirmation ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isBn ? "সময়কাল" : "Duration"}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{isBn ? "৭ দিন" : "7 Days"}</SelectItem>
                  <SelectItem value="14">{isBn ? "১৪ দিন" : "14 Days"}</SelectItem>
                  <SelectItem value="30">{isBn ? "৩০ দিন" : "30 Days"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isBn ? "প্রচারণার ধরন" : "Promotion Type"}</Label>
              <div className="grid grid-cols-1 gap-2">
                {boostTypes.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setBoostType(bt.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      boostType === bt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <bt.icon className={`h-5 w-5 shrink-0 ${boostType === bt.value ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{bt.label}</p>
                      <p className="text-xs text-muted-foreground">{bt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isBn ? "দৈনিক বাজেট" : "Daily Budget (BDT)"}</Label>
              <Input type="number" min="0" step="10" placeholder="0" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-sm text-muted-foreground">{isBn ? "মোট খরচ" : "Total Cost"}</span>
              <span className="font-semibold text-lg">{formatCurrency(totalBudget)}</span>
            </div>

            {walletBalance !== null && totalBudget > 0 && totalBudget > walletBalance && (
              <p className="text-sm text-destructive">{isBn ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient balance."}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-3 rounded-lg border">
            <h4 className="font-medium text-sm">{isBn ? "নিশ্চিতকরণ" : "Confirm"}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "চাকরি" : "Job"}</span><span className="font-medium truncate max-w-[200px]">{jobTitle}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "ধরন" : "Type"}</span><Badge variant="outline">{getBoostLabel()}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "সময়কাল" : "Duration"}</span><span>{duration} {isBn ? "দিন" : "days"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isBn ? "দৈনিক" : "Daily"}</span><span>{formatCurrency(parseFloat(dailyBudget || "0"))}</span></div>
              <div className="flex justify-between font-semibold border-t pt-2"><span>{isBn ? "মোট" : "Total"}</span><span>{formatCurrency(totalBudget)}</span></div>
            </div>
          </div>
        )}

        <DialogFooter>
          {showConfirmation ? (
            <>
              <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={submitting}>{isBn ? "ফিরুন" : "Back"}</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isBn ? "নিশ্চিত করুন" : "Confirm"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowConfirmation(true)} disabled={!dailyBudget || parseFloat(dailyBudget) <= 0}>{isBn ? "পরবর্তী" : "Next"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}