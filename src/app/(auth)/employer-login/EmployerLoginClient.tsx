"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import api from "@/lib/api-client";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/types";
import SocialLoginButtons from "@/components/auth/social-login-buttons";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

function EmployerSSOHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [ssoProcessing, setSsoProcessing] = useState(false);
  const { language } = useThemeStore();
  const isBn = language === "bn";

  useEffect(() => {
    const ssoToken = searchParams.get("sso_token");
    const role = searchParams.get("role") as UserRole | null;

    if (ssoToken && role) {
      setSsoProcessing(true);
      api
        .get("/user", {
          headers: { Authorization: `Bearer ${ssoToken}` },
        })
        .then((res) => {
          const user = res.data.data || res.data;
          setAuth(user, ssoToken, role);
          toast.success(isBn ? "SSO লগইন সফল!" : "SSO login successful!");
          if (role === "employer") {
            router.push("/employer/dashboard");
          } else if (role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/dashboard");
          }
        })
        .catch(() => {
          toast.error(
            isBn ? "SSO লগইন ব্যর্থ। আবার চেষ্টা করুন।" : "SSO login failed. Please try again."
          );
          setSsoProcessing(false);
          router.replace("/employer/login");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (ssoProcessing) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[70vh] py-12 px-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {isBn ? "SSO লগইন প্রক্রিয়া চলছে..." : "Processing SSO login..."}
              </p>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return null;
}

function EmployerLoginInner() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const ssoToken = searchParams.get("sso_token");
  const ssoRole = searchParams.get("role");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate(data);
  };

  if (ssoToken && ssoRole) {
    return <EmployerSSOHandler />;
  }

  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[70vh] py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                {settings.site_logo ? (
                  <Image src={settings.site_logo.startsWith("http") ? settings.site_logo : `/storage/${settings.site_logo}`} alt={settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs"} width={48} height={48} className="h-12 w-auto object-contain" unoptimized />
                ) : (
                  <p className="text-xl font-bold text-primary">{settings.site_name || process.env.NEXT_PUBLIC_APP_NAME || "eJobs"}</p>
                )}
              </div>
            <CardTitle className="text-2xl">
              {isBn ? "নিয়োগকর্তা লগইন" : "Employer Login"}
            </CardTitle>
            <CardDescription>
              {isBn ? "আপনার নিয়োগকর্তা অ্যাকাউন্টে লগইন করুন" : "Sign in to your employer dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{isBn ? "ইমেইল" : "Email"}</Label>
                <Input id="email" type="email" placeholder="company@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{isBn ? "পাসওয়ার্ড" : "Password"}</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isBn ? "লগইন" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6">
              <SocialLoginButtons role="employer" />
            </div>

            <div className="mt-4 text-center text-sm space-y-2">
              <p>
                {isBn ? "অ্যাকাউন্ট নেই?" : "No account?"}{" "}
                <Link href="/employer/register" className="text-primary hover:underline font-medium">
                  {isBn ? "রেজিস্ট্রেশন" : "Register"}
                </Link>
              </p>
              <p>
                <Link href="/login" className="text-primary hover:underline">
                  {isBn ? "প্রার্থী লগইন" : "Candidate Login"}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

export default function EmployerLoginClient() {
  return (
    <Suspense
      fallback={
        <PublicLayout>
          <div className="flex items-center justify-center min-h-[70vh] py-12 px-4">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          </div>
        </PublicLayout>
      }
    >
      <EmployerLoginInner />
    </Suspense>
  );
}
