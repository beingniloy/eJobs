"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { authService, type LoginPayload, type RegisterPayload } from "@/services/auth.service";
import type { UserRole } from "@/types";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, role, isAuthenticated, isLoading, setAuth, logout: storeLogout, setLoading } =
    useAuthStore();

  const { data: currentUser } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        return await authService.getUser();
      } catch (e: any) {
        if (e?.response?.status === 401) {
          storeLogout();
          queryClient.clear();
          return null;
        }
        throw e;
      }
    },
    enabled: !!token && !user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ data, expectedRole }: { data: LoginPayload; expectedRole?: UserRole }) =>
      authService.login(data).then((res) => ({ ...res, _expectedRole: expectedRole })),
    onSuccess: (data) => {
      if (data.requires_2fa) {
        return;
      }
      const userRole = (data.role || data.user?.role || "candidate") as UserRole;
      const expectedRole = (data as any)._expectedRole as UserRole | undefined;

      // Role validation: reject if user role doesn't match the login page's expected role
      if (expectedRole && userRole !== expectedRole && userRole !== "admin") {
        setAuth(null, "", null as any);
        queryClient.clear();
        if (userRole === "employer") {
          toast.error("This is an employer account. Please use the employer login page.");
          router.push("/employer/login");
        } else {
          toast.error("This is a candidate account. Please use the candidate login page.");
          router.push("/login");
        }
        return;
      }

      setAuth(data.user ?? null, data.token || "", userRole);
      queryClient.clear();
      toast.success("Login successful!");
      if (userRole === "employer") {
        router.push("/employer/dashboard");
      } else if (userRole === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const verify2faMutation = useMutation({
    mutationFn: ({ data, expectedRole }: { data: { temp_token: string; code: string }; expectedRole?: UserRole }) =>
      authService.verify2fa(data).then((res) => ({ ...res, _expectedRole: expectedRole })),
    onSuccess: (data) => {
      const userRole = (data.role || data.user?.role || "candidate") as UserRole;
      const expectedRole = (data as any)._expectedRole as UserRole | undefined;

      if (expectedRole && userRole !== expectedRole && userRole !== "admin") {
        setAuth(null, "", null as any);
        queryClient.clear();
        if (userRole === "employer") {
          toast.error("This is an employer account. Please use the employer login page.");
          router.push("/employer/login");
        } else {
          toast.error("This is a candidate account. Please use the candidate login page.");
          router.push("/login");
        }
        return;
      }

      setAuth(data.user ?? null, data.token || "", userRole);
      queryClient.clear();
      toast.success("Login successful!");
      if (userRole === "employer") {
        router.push("/employer/dashboard");
      } else if (userRole === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "2FA verification failed");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
    onSuccess: (data) => {
      const userRole = (data.role || data.user?.role || "candidate") as UserRole;
      setAuth(data.user ?? null, data.token || "", userRole);
      queryClient.clear();
      toast.success("Registration successful! Please verify your email.");
      if (userRole === "employer") {
        router.push("/employer/verify?post_registration=true");
      } else {
        router.push("/dashboard/verify?post_registration=true");
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore error on logout
    }
    storeLogout();
    queryClient.clear();
    router.push("/login");
  }, [storeLogout, queryClient, router]);

  return {
    user: currentUser || user,
    token,
    role,
    isAuthenticated,
    isLoading,
    login: loginMutation,
    verify2fa: verify2faMutation,
    register: registerMutation,
    logout,
    setLoading,
  };
}
