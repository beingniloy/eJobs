import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

// Fetch CSRF cookie before making state-changing requests
let csrfFetched = false;
async function ensureCsrfCookie() {
  if (csrfFetched) return;
  try {
    await axios.get("/sanctum/csrf-cookie", {
      withCredentials: true,
    });
    csrfFetched = true;
  } catch {
    // CSRF cookie may not be required for all setups
  }
}

// Read token from Zustand persist store
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

// Clear auth store completely
function clearAuthStore() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("auth-storage");
  } catch {
    // ignore
  }
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Fetch CSRF cookie before state-changing requests
    if (["post", "put", "patch", "delete"].includes(config.method?.toLowerCase() || "")) {
      await ensureCsrfCookie();
      const xsrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
      if (xsrfToken && config.headers) {
        config.headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken.split("=")[1]);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;

    if (typeof window !== "undefined") {
      if (status === 401 || status === 419) {
        clearAuthStore();
        delete api.defaults.headers.common["Authorization"];

        // Don't redirect when the failing request is a background auth-check
        // endpoint (called from public pages). The calling code handles 401
        // gracefully via .catch() or React Query error state.
        const failedUrl = error.config?.url || "";
        const silentEndpoints = ["/user", "/subscriptions/", "/candidate/cv/", "/candidate/saved-jobs", "/candidate/toggle-save/", "/candidate/applied-jobs"];
        const isSilent = silentEndpoints.some((ep) => failedUrl.startsWith(ep));

        if (!isSilent) {
          const currentPath = window.location.pathname;
          const authPaths = ["/login", "/employer/login", "/register", "/employer/register"];
          if (!authPaths.some((p) => currentPath.startsWith(p))) {
            // Defer redirect so React can finish hydration before unmounting
            setTimeout(() => {
              window.location.href = "/login";
            }, 0);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extract a user-friendly error message from an API error response.
 * Usage: import api, { getApiErrorMessage } from "@/lib/api-client";
 *        catch (e) { toast.error(getApiErrorMessage(e, "Something went wrong")); }
 */
export function getApiErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (!error || typeof error !== "object") return fallback;
  const err = error as { response?: { data?: { message?: string; errors?: Record<string, string | string[]> } }; message?: string };
  const data = err.response?.data;
  if (data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey) {
      const val = data.errors[firstKey];
      return Array.isArray(val) ? val[0] : val;
    }
  }
  return data?.message || err.message || fallback;
}

export default api;
