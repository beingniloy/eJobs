"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import { useTheme } from "next-themes";
import api from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Globe, User, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TwoFactorSettings } from "@/components/dashboard/two-factor-settings";

function SectionRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 sm:ml-auto">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const { language, setLanguage } = useThemeStore();
  const { theme, setTheme } = useTheme();
  const isBn = language === "bn";
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("phone", phone);
      const res = await api.post("/candidate/profile-update", fd);
      if (res.data?.user) setUser(res.data.user);
      toast.success(isBn ? "সংরক্ষিত হয়েছে!" : "Saved successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isBn ? "সংরক্ষণ ব্যর্থ" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{isBn ? "সেটিংস" : "Settings"}</h1>

      {/* ── Account Information Card ── */}
      <Card>
        <CardContent className="divide-y px-4 sm:px-6">
          {/* Name */}
          <div className="py-3 space-y-2">
            <Label className="text-sm font-medium">{isBn ? "নাম" : "Name"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isBn ? "আপনার নাম" : "Your name"}
            />
          </div>

          {/* Email (read-only) */}
          <div className="py-3 space-y-2">
            <Label className="text-sm font-medium">{isBn ? "ইমেইল" : "Email"}</Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
          </div>

          {/* Phone with +880 prefix */}
          <div className="py-3 space-y-2">
            <Label className="text-sm font-medium">{isBn ? "ফোন নম্বর" : "Phone Number"}</Label>
            <div className="flex">
              <div className="flex items-center gap-1.5 px-3 border border-r-0 border-input rounded-l-md bg-muted text-sm text-muted-foreground shrink-0">
                <span className="text-xs font-medium">🇧🇩</span>
                <span>+880</span>
              </div>
              <Input
                value={phone.replace(/^\+?880/, "")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 11);
                  setPhone(raw ? `+880${raw}` : "");
                }}
                placeholder="1XXXXXXXXX"
                className="rounded-l-none"
                type="tel"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isBn ? "উদাহরণ: +880 1XXXXXXXXX" : "Example: +880 1XXXXXXXXX"}
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-3 flex justify-end">
            <Button onClick={handleSaveAccount} disabled={saving} size="sm">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving
                ? isBn ? "সংরক্ষণ হচ্ছে..." : "Saving..."
                : isBn ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance Card ── */}
      <Card>
        <CardContent className="px-4 sm:px-6">
          <SectionRow
            icon={mounted ? (theme === "dark" ? Moon : Sun) : Sun}
            label={isBn ? "থিম" : "Appearance"}
            description={isBn ? "ইন্টারফেসের চেহারা পরিবর্তন করুন" : "Change how the interface looks"}
          >
            <div className="flex gap-1.5">
              {([
                { key: "light" as const, icon: Sun, label: "Light" },
                { key: "dark" as const, icon: Moon, label: "Dark" },
                { key: "system" as const, icon: null, label: "System" },
              ]).map(({ key, icon: BtnIcon, label }) => (
                <Button
                  key={key}
                  variant={mounted && theme === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(key)}
                  className="h-8 px-3 text-xs"
                >
                  {BtnIcon && <BtnIcon className="h-3.5 w-3.5 sm:mr-1" />}
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
          </SectionRow>
        </CardContent>
      </Card>

      {/* ── Language Card ── */}
      <Card>
        <CardContent className="px-4 sm:px-6">
          <SectionRow
            icon={Globe}
            label={isBn ? "ভাষা" : "Language"}
            description={isBn ? "ইন্টারফেস ভাষা নির্বাচন করুন" : "Select interface language"}
          >
            <div className="flex gap-1.5">
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                className="h-8 px-3 text-xs"
              >
                English
              </Button>
              <Button
                variant={language === "bn" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("bn")}
                className="h-8 px-3 text-xs"
              >
                বাংলা
              </Button>
            </div>
          </SectionRow>
        </CardContent>
      </Card>

      {/* ── 2FA Card ── */}
      <TwoFactorSettings />

      {/* ── Logout Card ── */}
      <Card>
        <CardContent className="px-4 sm:px-6 pt-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isBn ? "লগ আউট" : "Logout"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}