"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Database,
  HardDrive,
  Server,
  Globe,
  RefreshCw,
  Clock,
  Shield,
  Mail,
  Users,
  Briefcase,
  Send,
  Wifi,
  Layers,
  Activity,
} from "lucide-react";

interface HealthCheck {
  status: "ok" | "error" | "warning";
  response_ms?: number;
  message?: string;
  driver?: string;
  active_users?: number;
  total_users?: number;
  active_jobs?: number;
  total_applications?: number;
}

interface HealthData {
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  version: string;
  checks: Record<string, HealthCheck>;
}

const SERVICE_META: Record<string, { icon: any; label: string; color: string }> = {
  database: { icon: Database, label: "Database", color: "text-blue-500" },
  cache: { icon: Layers, label: "Cache / Redis", color: "text-purple-500" },
  storage: { icon: HardDrive, label: "File Storage", color: "text-orange-500" },
  queue: { icon: Server, label: "Queue Driver", color: "text-indigo-500" },
  mail: { icon: Mail, label: "Mail Service", color: "text-pink-500" },
  session: { icon: Shield, label: "Session Store", color: "text-cyan-500" },
};

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to connect");
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCheckStatus = (check: HealthCheck) => {
    if (check.status === "ok") return "operational";
    if (check.status === "warning") return "warning";
    return "error";
  };

  const statusStyles = (s: string) => {
    switch (s) {
      case "ok":
      case "healthy":
      case "operational":
        return {
          dot: "bg-emerald-500",
          text: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50",
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: "Operational",
        };
      case "warning":
        return {
          dot: "bg-yellow-500",
          text: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50",
          icon: <AlertTriangle className="w-4 h-4" />,
          label: "Warning",
        };
      default:
        return {
          dot: "bg-red-500",
          text: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50",
          icon: <XCircle className="w-4 h-4" />,
          label: "Error",
        };
    }
  };

  const overallStatus = !data && !error
    ? "loading"
    : error
    ? "offline"
    : data?.status === "healthy"
    ? "operational"
    : "degraded";

  const overall = statusStyles(
    overallStatus === "operational" ? "ok" : overallStatus === "loading" ? "ok" : "error"
  );

  const stats = data?.checks?.stats;

  // Compute service checks (exclude stats)
  const serviceChecks = data?.checks
    ? Object.entries(data.checks).filter(([k]) => k !== "stats")
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                System Status
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Real-time platform health monitoring
              </p>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Overall Status Banner */}
        <div
          className={`rounded-xl border p-6 ${
            overallStatus === "operational"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
              : overallStatus === "loading"
              ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              : overallStatus === "degraded"
              ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {overallStatus === "loading" ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : overallStatus === "operational" ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : overallStatus === "degraded" ? (
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <h2
                className={`text-lg font-bold ${
                  overallStatus === "operational"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : overallStatus === "loading"
                    ? "text-gray-500 dark:text-gray-400"
                    : overallStatus === "degraded"
                    ? "text-yellow-700 dark:text-yellow-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {overallStatus === "operational"
                  ? "All Systems Operational"
                  : overallStatus === "loading"
                  ? "Checking Status..."
                  : overallStatus === "degraded"
                  ? "Partial System Degradation"
                  : "System Offline"}
              </h2>
              {lastChecked && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        {stats && stats.status === "ok" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.total_users?.toLocaleString() ?? "—", icon: Users, color: "text-blue-500" },
              { label: "Active (30d)", value: stats.active_users?.toLocaleString() ?? "—", icon: Activity, color: "text-emerald-500" },
              { label: "Active Jobs", value: stats.active_jobs?.toLocaleString() ?? "—", icon: Briefcase, color: "text-amber-500" },
              { label: "Applications", value: stats.total_applications?.toLocaleString() ?? "—", icon: Send, color: "text-purple-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Services */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Core Services
          </h3>

          {serviceChecks.length === 0 && !error && (
            <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Checking services...</span>
            </div>
          )}

          {serviceChecks.map(([name, check]) => {
            const meta = SERVICE_META[name] || { icon: Globe, label: name, color: "text-gray-500" };
            const st = statusStyles(check.status);
            return (
              <div
                key={name}
                className={`rounded-lg border p-4 flex items-center justify-between ${st.bg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={meta.color}>
                    <meta.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {meta.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {check.message || (check.driver ? `Driver: ${check.driver}` : "")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {check.response_ms !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {check.response_ms}ms
                    </span>
                  )}
                  <span className={`flex items-center gap-1.5 text-sm font-medium ${st.text}`}>
                    {st.icon}
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Error State */}
          {error && (
            <div className="rounded-lg border p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    Connection Error
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-start gap-3">
            <Wifi className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>
                This page auto-refreshes every 30 seconds. Click{" "}
                <strong>Refresh</strong> for an immediate update.
              </p>
              {data?.version && (
                <p>
                  Platform version:{" "}
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    v{data.version}
                  </code>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
