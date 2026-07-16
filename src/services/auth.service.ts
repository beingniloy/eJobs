import api from "@/lib/api-client";
import type { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: "candidate" | "employer";
  phone?: string;
}

export interface AuthResponse {
  status: boolean;
  message?: string;
  token?: string;
  user?: User;
  role?: string;
  requires_2fa?: boolean;
  temp_token?: string;
}

export const authService = {
  login: async (data: LoginPayload) => {
    const res = await api.post<AuthResponse>("/login", data);
    return res.data;
  },

  verify2fa: async (data: { temp_token: string; code: string }) => {
    const res = await api.post<AuthResponse>("/two-factor/verify-login", data);
    return res.data;
  },

  register: async (data: RegisterPayload) => {
    const res = await api.post<AuthResponse>("/register", data);
    return res.data;
  },

  logout: async () => {
    await api.post("/logout");
  },

  getUser: async () => {
    const res = await api.get("/user");
    return res.data.data ?? res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post("/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    const res = await api.post("/reset-password", data);
    return res.data;
  },

  verifyEmail: async (id: number, hash: string) => {
    const res = await api.get(`/email/verify/${id}/${hash}`);
    return res.data;
  },

  checkUsername: async (username: string) => {
    const res = await api.get("/check-username", { params: { username } });
    return res.data;
  },
};
