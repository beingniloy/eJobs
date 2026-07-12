"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import { useTheme } from "next-themes";
import api from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Globe, LogOut, User, Building2, Shield, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmployerSettingsPage() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useThemeStore();
  const { theme, setTheme } = useTheme();
  const isBn = language === "bn";
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    company_description: "",
    website: "",
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        company_name: user.company?.name || "",
        company_description: user.company?.description || "",
        website: user.company?.website || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/employer/profile", form);
      toast.success(isBn ? "সংরক্ষিত হয়েছে!" : "Settings saved!");
    } catch {
      toast.error(isBn ? "সংরক্ষণ করতে ব্যর্থ" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{isBn ? "সেটিংস" : "Settings"}</h1>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isBn ? "অ্যাকাউন্ট তথ্য" : "Account Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isBn ? "নাম" : "Name"}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isBn ? "ইমেইল" : "Email"}</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>{isBn ? "ফোন" : "Phone"}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isBn ? "কোম্পানি তথ্য" : "Company Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isBn ? "কোম্পানির নাম" : "Company Name"}</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{isBn ? "কোম্পানি বিবরণ" : "Company Description"}</Label>
            <Textarea rows={3} value={form.company_description} onChange={(e) => setForm({ ...form, company_description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{isBn ? "ওয়েবসাইট" : "Website"}</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isBn ? "সংরক্ষণ করুন" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mounted ? (theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />) : <Sun className="h-5 w-5" />}
            {isBn ? "থিম" : "Appearance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">{isBn ? "ডার্ক মোড" : "Dark Mode"}</span>
            <div className="flex gap-2">
              <Button variant={mounted && theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
                <Sun className="h-4 w-4 mr-1" /> Light
              </Button>
              <Button variant={mounted && theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
                <Moon className="h-4 w-4 mr-1" /> Dark
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm">{isBn ? "ভাষা" : "Language"}</span>
            <div className="flex gap-2">
              <Button variant={language === "en" ? "default" : "outline"} size="sm" onClick={() => setLanguage("en")}>
                <Globe className="h-4 w-4 mr-1" /> English
              </Button>
              <Button variant={language === "bn" ? "default" : "outline"} size="sm" onClick={() => setLanguage("bn")}>
                <Globe className="h-4 w-4 mr-1" /> বাংলা
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isBn ? "অ্যাকাউন্ট" : "Account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/employer/profile"><User className="h-4 w-4 mr-2" />{isBn ? "প্রোফাইল" : "Profile"}</Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/employer/verify"><Shield className="h-4 w-4 mr-2" />{isBn ? "যাচাইকরণ" : "Verification"}</Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/employer/subscription"><Bell className="h-4 w-4 mr-2" />{isBn ? "সাবস্ক্রিপশন" : "Subscription"}</Link>
          </Button>
          <Separator />
          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />{isBn ? "লগআউট" : "Logout"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
