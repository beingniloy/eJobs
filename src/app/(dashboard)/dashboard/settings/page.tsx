"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Globe, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useThemeStore();
  const { theme, setTheme } = useTheme();
  const isBn = language === "bn";
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{isBn ? "সেটিংস" : "Settings"}</h1>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mounted ? (
              theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            {isBn ? "থিম" : "Appearance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{isBn ? "ডার্ক মোড" : "Dark Mode"}</span>
            <div className="flex gap-2">
              <Button
                variant={mounted && theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                variant={mounted && theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
              <Button
                variant={mounted && theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {isBn ? "ভাষা" : "Language"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{isBn ? "ইন্টারফেস ভাষা" : "Interface Language"}</span>
            <div className="flex gap-2">
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
              >
                English
              </Button>
              <Button
                variant={language === "bn" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("bn")}
              >
                বাংলা
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>{isBn ? "অ্যাকাউন্ট" : "Account"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="text-muted-foreground">{isBn ? "ইমেইল" : "Email"}</p>
            <p>{user?.email}</p>
          </div>
          <Separator />
          <Button variant="destructive" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            {isBn ? "লগ আউট" : "Logout"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
