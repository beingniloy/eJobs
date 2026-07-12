"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/api-client";

const PUBLIC_ROUTES = [
  "/",
  "/jobs",
  "/companies",
  "/candidates",
  "/leaderboard",
  "/login",
  "/register",
  "/employer/login",
  "/employer/register",
  "/forgot-password",
  "/verify-email",
  "/pricing",
  "/ai-career",
  "/ai-assistant",
  "/resume-builder",
  "/cv-builder",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/help",
  "/notices",
  "/support",
  "/invoices",
  "/auth/callback",
];

const GUEST_ONLY_ROUTES = ["/login", "/register", "/employer/login", "/employer/register"];

const EMPLOYEE_AUTH_ROUTES = ["/employer/login", "/employer/register", "/employer/forgot-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isAuthenticated, setLoading, setAuth, logout } =
    useAuthStore();
  const [rehydrated, setRehydrated] = useState(false);

  // Wait for Zustand persist rehydration before making auth decisions
  useEffect(() => {
    // The persist middleware rehydrates synchronously from localStorage.
    // We check if the store has been rehydrated by looking at the persisted state.
    const unsub = useAuthStore.subscribe(
      (state, prevState) => {
        // Once isLoading transitions from true to false, rehydration is complete
        if (prevState.isLoading && !state.isLoading) {
          setRehydrated(true);
        }
      }
    );

    // If already rehydrated (e.g., fast re-render), set immediately
    if (!useAuthStore.getState().isLoading) {
      setRehydrated(true);
    }

    return unsub;
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const res = await api.get("/user");
          const userData = res.data.data ?? res.data;
          const role =
            userData.role ||
            userData.roles?.[0]?.name ||
            "candidate";
          setAuth(userData, token, role);
        }
      } catch (error: { response?: { status?: number } } | unknown) {
        if ((error as { response?: { status?: number } })?.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token, setAuth, setLoading, logout]);

  // Only run redirect logic after rehydration is complete
  useEffect(() => {
    if (!rehydrated) return;
    if (typeof window === "undefined") return;

    const isPublic = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);
    const isEmployeeAuth = EMPLOYEE_AUTH_ROUTES.includes(pathname);
    const isDashboard = pathname.startsWith("/dashboard") || (pathname.startsWith("/employer") && !isEmployeeAuth) || pathname.startsWith("/admin");

    if (!isAuthenticated && isDashboard) {
      router.push("/login");
    }

    if (isAuthenticated && isGuestOnly) {
      const role = useAuthStore.getState().role;
      if (role === "employer") {
        router.push("/employer/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [rehydrated, isAuthenticated, pathname, router]);

  return <>{children}</>;
}
