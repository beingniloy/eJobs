"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import { useTheme } from "@/hooks/use-theme";
import { useTheme as useNextTheme } from "next-themes";
import { useNotificationStore } from "@/store/notification-store";
import { subscriptionService } from "@/services/subscription.service";
import { notificationsService } from "@/services/notifications.service";
import PremiumBadge from "@/components/badges/PremiumBadge";
import CurrencySwitcher from "@/components/currency-switcher";
import VerificationWarningBanner from "@/components/verification-warning-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu, Sun, Moon, Bell, LogOut, User, Settings, LayoutDashboard,
  ChevronDown, Sparkles, Briefcase, Globe, Building2, Users,
  FileText, CreditCard, Home, Trophy, GraduationCap, BookOpen,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Subscription } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, role, logout } = useAuth();
  const { language, toggleLanguage, settings } = useThemeStore();
  useTheme();
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const activeTheme = resolvedTheme || theme;
  const { notifications, unreadCount, setNotifications } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isAuthenticated) {
      subscriptionService.getMySubscription()
        .then((sub) => setSubscription(sub))
        .catch(() => { /* handled */ });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = async () => {
      try {
        const data = await notificationsService.getNotifications(1);
        if (data?.data) setNotifications(data.data);
        if (typeof data?.unread_count === "number") {
          useNotificationStore.getState().setUnreadCount(data.unread_count);
        }
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setNotifications]);

  const isEmployer = role === "employer";
  const isAdmin = role === "admin";
  const isCandidate = role === "candidate";
  const isBn = language === "bn";

  // Desktop nav links (including Leaderboard)
  const navLinks = [
    { href: "/jobs", label: isBn ? "চাকরি" : "Jobs", icon: Briefcase },
    { href: "/jobs/remote", label: isBn ? "রিমোট চাকরি" : "Remote Jobs", icon: Globe },
    { href: "/companies", label: isBn ? "কোম্পানি" : "Companies", icon: Building2 },
    { href: "/skills", label: isBn ? "দক্ষতা কেন্দ্র" : "Skill Center", icon: GraduationCap },
    ...(!isCandidate ? [{ href: "/candidates", label: isBn ? "প্রার্থী" : "Candidates", icon: Users }] : []),
    ...(!isEmployer ? [{ href: "/resume-builder", label: isBn ? "সিভি বিল্ডার" : "CV Builder", icon: FileText }] : []),
    { href: "/leaderboard", label: isBn ? "লিডারবোর্ড" : "Leaderboard", icon: Trophy },
    { href: "/pricing", label: isBn ? "মূল্য" : "Pricing", icon: CreditCard },
  ];

  // Mobile-only extra links (merged into main nav on mobile)
  const mobileExtraLinks = [
    { href: "/", label: isBn ? "হোম" : "Home", icon: Home },
    { href: "/ai-assistant", label: isBn ? "AI সহকারী" : "AI Assistant", icon: Sparkles, highlight: true },
    { href: "/ai-career", label: isBn ? "AI ক্যারিয়ার" : "AI Career", icon: Sparkles },
    { href: "/ai-mock-interview", label: isBn ? "AI মক ইন্টারভিউ" : "AI Mock Interview", icon: Sparkles },
    { href: "/resume-score", label: isBn ? "রিজিউম স্কোর" : "Resume Score", icon: FileText },
    { href: "/certificates", label: isBn ? "সার্টিফিকেট" : "Certificates", icon: Trophy },
    { href: "/assessments", label: isBn ? "মূল্যায়ন" : "Assessments", icon: BookOpen },
  ];

  // All mobile nav links (navLinks + extras, no duplicates)
  const allMobileLinks = [
    ...navLinks,
    ...mobileExtraLinks.filter((e) => !navLinks.some((n) => n.href === e.href)),
  ] as { href: string; label: string; icon: any; highlight?: boolean }[];

  const dashboardPath = isAdmin ? "/admin/dashboard" : isEmployer ? "/employer/dashboard" : "/dashboard";
  const profilePath = isAdmin ? "/admin" : isEmployer ? "/employer/profile" : "/dashboard/profile";
  const notificationsPath = isAdmin ? "/admin/notifications" : isEmployer ? "/employer/notifications" : "/dashboard/notifications";
  const settingsPath = isAdmin ? "/admin/settings" : isEmployer ? "/employer/settings" : "/dashboard/settings";

  const isDark = mounted && activeTheme === "dark";

  return (
    <>
    <VerificationWarningBanner mode="global" />
    <header
      className="sticky top-0 z-50 w-full navbar-surface"
      style={{
        backgroundColor: isDark
          ? (settings.nav_bg_dark ? `${settings.nav_bg_dark}f2` : undefined)
          : (settings.nav_bg ? `${settings.nav_bg}f2` : undefined),
      }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 min-w-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0 whitespace-nowrap overflow-hidden">
          {settings.site_logo ? (
            <Image
              src={settings.site_logo.startsWith("http") ? settings.site_logo : `/storage/${settings.site_logo}`}
              alt={settings.site_name || "eJobs"}
              width={32} height={32}
              className="h-6 w-auto object-contain shrink-0" unoptimized
            />
          ) : (
            <span style={{ color: settings.nav_text_color || undefined }} className="font-bold">{settings.site_name || "eJobs"}</span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5 whitespace-nowrap">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="text-sm font-bold transition-colors whitespace-nowrap"
              style={{
                color: pathname === link.href
                  ? (settings.nav_text_hover || undefined)
                  : (settings.nav_text_color || undefined),
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = settings.nav_text_hover || ''; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = pathname === link.href ? (settings.nav_text_hover || '') : (settings.nav_text_color || ''); }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-1.5">
          <Button variant="ghost" size="icon" asChild className="hover:bg-black/5 dark:hover:bg-white/10" style={{ color: settings.nav_text_color || undefined }}>
            <Link href="/ai-assistant" title={isBn ? "AI সহকারী" : "AI Assistant"}>
              <Sparkles className="h-4 w-4 animate-pulse" />
            </Link>
          </Button>
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-black/5 dark:hover:bg-white/10" style={{ color: settings.nav_text_color || undefined }}>
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="px-3 py-2.5 border-b flex items-center justify-between">
                    <p className="text-sm font-semibold">{isBn ? "নোটিফিকেশন" : "Notifications"}</p>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{unreadCount} {isBn ? "নতুন" : "new"}</Badge>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        {isBn ? "কোনো নোটিফিকেশন নেই" : "No notifications yet"}
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className={`px-3 py-2.5 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.read_at ? "bg-primary/5" : ""}`}>
                          <div className="flex items-start gap-2">
                            {!n.read_at && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{n.title || n.data?.title || (isBn ? "নোটিফিকেশন" : "Notification")}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message || n.data?.message || ""}</p>
                              {n.created_at && (
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                  {new Date(n.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-3 py-2 border-t">
                    <button
                      onClick={() => router.push(notificationsPath)}
                      className="w-full text-center text-xs font-medium text-primary hover:underline py-1"
                    >
                      {isBn ? "সব দেখুন" : "See all notifications"}
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-black/5 dark:hover:bg-white/10" style={{ color: settings.nav_text_color || undefined }}>
                    <DefaultAvatar src={user?.avatar} name={user?.name} className="h-7 w-7" fallback={<span className="text-xs">{getInitials(user?.name || "U")}</span>} />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    {subscription?.status === "active" && subscription.plan_name && (
                      <PremiumBadge plan={subscription.plan_name} />
                    )}
                  </div>
                  <div className="px-3 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <CurrencySwitcher />
                      <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10">
                        {isBn ? "EN" : "বাং"}
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}>
                        {mounted ? (activeTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => router.push(dashboardPath)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(profilePath)}>
                    <User className="mr-2 h-4 w-4" />
                    {isBn ? "প্রোফাইল" : "Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`${settingsPath}`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    {isBn ? "সেটিংস" : "Settings"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {isBn ? "লগআউট" : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="hover:bg-black/5 dark:hover:bg-white/10" style={{ color: settings.nav_text_color || undefined }}>{isBn ? "লগইন" : "Login"}</Button>
              <Button size="sm" onClick={() => router.push("/register")} style={{ color: settings.nav_text_color || undefined, backgroundColor: `${settings.nav_text_color || '#076938'}22` }}>{isBn ? "নিবন্ধন" : "Register"}</Button>
            </div>
          )}
        </div>

        {/* Mobile: Login/Register + Hamburger */}
        {!isAuthenticated && (
          <div className="flex items-center gap-1.5 md:hidden">
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="text-sm hover:bg-black/5 dark:hover:bg-white/10" style={{ color: settings.nav_text_color || undefined }}>{isBn ? "লগইন" : "Login"}</Button>
            <Button size="sm" onClick={() => router.push("/register")} className="text-sm" style={{ color: settings.nav_text_color || undefined, backgroundColor: `${settings.nav_text_color || '#076938'}22` }}>{isBn ? "নিবন্ধন" : "Register"}</Button>
          </div>
        )}

        {/* Mobile Hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-black/5 dark:hover:bg-white/10" style={{ color: settings.nav_text_color || undefined }}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                {settings.site_logo ? (
                  <Image src={settings.site_logo.startsWith("http") ? settings.site_logo : `/storage/${settings.site_logo}`}
                    alt={settings.site_name || "eJobs"} width={24} height={24}
                    className="h-6 w-auto object-contain" unoptimized />
                ) : (
                  <span className="text-primary">{settings.site_name || "eJobs"}</span>
                )}
              </SheetTitle>
            </div>

            <div className="flex flex-col h-full">
              {/* User Info — clickable to profile */}
              {isAuthenticated && (
                <div className="p-4 border-b bg-muted/30">
                  <Link href={profilePath} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                    <DefaultAvatar src={user?.avatar} name={user?.name} className="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{user?.name}</p>
                      {subscription?.status === "active" && subscription.plan_name && (
                        <PremiumBadge plan={subscription.plan_name} />
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                  </Link>
                  <div className="flex items-center gap-2 mt-3">
                    <CurrencySwitcher />
                    <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex-1 gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      {isBn ? "English" : "বাংলা"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")} className="flex-1 gap-1.5">
                      {mounted ? (activeTheme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />) : <Moon className="h-3.5 w-3.5" />}
                      {mounted ? (activeTheme === "dark" ? "Light" : "Dark") : "Theme"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Links — ALL pages */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {allMobileLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : link.highlight
                            ? "text-[#7C3AED] bg-[#7C3AED]/5 hover:bg-[#7C3AED]/10 dark:bg-[#7C3AED]/10 dark:hover:bg-[#7C3AED]/20"
                            : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${link.highlight ? "animate-pulse" : ""}`} />
                      {link.label}
                    </Link>
                  );
                })}

                {/* Dashboard & Account (if authenticated) */}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-border my-3" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                      {isBn ? "অ্যাকাউন্ট" : "Account"}
                    </p>
                    <Link href={dashboardPath} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted">
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
                    </Link>
                    <Link href={`${notificationsPath}`} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted">
                      <Bell className="h-4 w-4 shrink-0" />
                      {isBn ? "নোটিফিকেশন" : "Notifications"}
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto h-5 min-w-5 text-[10px]">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                    <Link href={`${settingsPath}`} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted">
                      <Settings className="h-4 w-4 shrink-0" />
                      {isBn ? "সেটিংস" : "Settings"}
                    </Link>
                    <button onClick={() => { setMobileOpen(false); logout(); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 text-left">
                      <LogOut className="h-4 w-4 shrink-0" />
                      {isBn ? "লগআউট" : "Logout"}
                    </button>
                  </>
                )}
              </nav>

              {/* Bottom Actions */}
              <div className="p-4 border-t space-y-2">
                {isAuthenticated ? (
                  <Button variant="outline"
                    className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => { setMobileOpen(false); logout(); }}>
                    <LogOut className="h-4 w-4" />
                    {isBn ? "লগআউট" : "Logout"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setMobileOpen(false); router.push("/login"); }}>
                      {isBn ? "লগইন" : "Login"}
                    </Button>
                    <Button className="flex-1" onClick={() => { setMobileOpen(false); router.push("/register"); }}>
                      {isBn ? "নিবন্ধন" : "Register"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
    </>
  );
}
