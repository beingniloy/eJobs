"use client";

import React, { useEffect, useState } from "react";
import { useThemeStore } from "@/store/theme-store";
import api from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, Percent, Info } from "lucide-react";

interface TaxSetting {
  id: number;
  name: string;
  rate: number;
  type: string;
  applies_to: string;
  is_active: boolean;
}

export default function TaxInfoPage() {
  const { language } = useThemeStore();
  const isBn = language === "bn";
  const [taxes, setTaxes] = useState<TaxSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/settings/financial")
      .then((res) => setTaxes(res.data?.data?.tax_settings || []))
      .catch(() => { /* handled */ })
      .finally(() => setLoading(false));
  }, []);

  const activeTaxes = taxes.filter((t) => t.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isBn ? "ট্যাক্স তথ্য" : "Tax Information"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isBn ? "প্রযোজ্য ট্যাক্স হার দেখুন" : "View applicable tax rates"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : activeTaxes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {isBn ? "কোনো ট্যাক্স প্রযোজ্য নেই" : "No taxes applicable"}
          </p>
          <p className="text-sm mt-1">
            {isBn ? "সিস্টেমে এখনো কোনো ট্যাক্স সেট করা হয়নি" : "No tax rates have been configured yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTaxes.map((tax) => (
            <Card key={tax.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{tax.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isBn ? "প্রযোজ্য:" : "Applies to:"} {tax.applies_to}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      {tax.type === "percentage" ? `${tax.rate}%` : formatCurrency(tax.rate)}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      {tax.type === "percentage"
                        ? isBn ? "শতাংশ" : "Percentage"
                        : isBn ? "নির্ধারিত" : "Fixed"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {isBn
                  ? "ট্যাক্স হার প্রশাসন দ্বারা সেট করা হয় এবং পেমেন্ট প্রসেসিংয়ে প্রয়োগ করা হয়। মূল্য ব্রেকডাউন পেমেন্ট সময়ে দেখানো হবে।"
                  : "Tax rates are set by the administrator and applied during payment processing. Breakdown is shown at checkout."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
