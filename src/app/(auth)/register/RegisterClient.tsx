"use client";

import React, { Suspense, lazy } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/store/theme-store";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const SocialLoginButtons = lazy(() => import("@/components/auth/social-login-buttons"));

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, { message: "Passwords do not match", path: ["password_confirmation"] });
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterClient() {
  const { language, settings } = useThemeStore();
  const isBn = language === "bn";
  const { register: registerUser } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[70vh] py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isBn ? "নিবন্ধন করুন" : "Create Account"}</CardTitle>
            <CardDescription>{isBn ? "আপনার কর্মজীবনের যাত্রা শুরু করুন" : "Start your career journey today"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => registerUser.mutate({ ...data, role: "candidate" }))} className="space-y-4">
              <div className="space-y-2">
                <Label>{isBn ? "পুরো নাম" : "Full Name"}</Label>
                <Input placeholder="John Doe" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{isBn ? "ইমেইল" : "Email"}</Label>
                <Input type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{isBn ? "ফোন নম্বর" : "Phone Number"}</Label>
                <Input type="tel" placeholder="01XXXXXXXXX" {...register("phone")} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isBn ? "পাসওয়ার্ড" : "Password"}</Label>
                  <Input type="password" placeholder="••••••••" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{isBn ? "নিশ্চিত করুন" : "Confirm"}</Label>
                  <Input type="password" placeholder="••••••••" {...register("password_confirmation")} />
                  {errors.password_confirmation && <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={registerUser.isPending}>{registerUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isBn ? "নিবন্ধন করুন" : "Create Account"}</Button>
            </form>
            <div className="mt-6"><Suspense fallback={<div className="h-16 bg-muted rounded animate-pulse" />}><SocialLoginButtons role="candidate" /></Suspense></div>
            <div className="mt-4 text-center text-sm space-y-2">
              <p>{isBn ? "ইতিমধ্যে অ্যাকাউন্ট আছে?" : "Already have an account?"}{" "}<Link href="/login" className="text-primary hover:underline font-medium">{isBn ? "লগইন" : "Sign In"}</Link></p>
              <p>{isBn ? "নিয়োগকর্তা হতে চান?" : "Want to hire?"}{" "}<Link href="/employer/register" className="text-primary hover:underline font-medium">{isBn ? "নিয়োগকর্তা রেজিস্ট্রেশন" : "Employer Registration"}</Link></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}