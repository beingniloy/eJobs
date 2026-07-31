"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resumeService } from "@/services/resume.service";
import { useThemeStore } from "@/store/theme-store";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Share2, LinkIcon, Loader2,
  Lock, Globe,
} from "lucide-react";

export default function CvPreviewClient() {
  const params = useParams();
  const uuid = params?.uuid as string;
  const router = useRouter();
  const { language } = useThemeStore();
  const isBn = language === "bn";

  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    setError(null);

    // Get auth token
    let authToken: string | null = null;
    try {
      const raw = localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        authToken = parsed?.state?.token || null;
      }
    } catch { /* ignore */ }

    const headers: Record<string, string> = { Accept: "text/html" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    fetch(`/api/cv/preview/${uuid}`, { headers })
      .then(async (res) => {
        const text = await res.text();
        const contentType = res.headers.get("content-type") || "";

        // Check if response is JSON error
        if (contentType.includes("application/json")) {
          try {
            const json = JSON.parse(text);
            throw new Error(json.message || `Preview failed (${res.status})`);
          } catch (e) {
            if (e instanceof Error) throw e;
            throw new Error(`Preview failed (${res.status})`);
          }
        }

        if (!res.ok) throw new Error(`Preview failed (${res.status})`);
        if (!text || text.length < 100) throw new Error("Empty preview response");
        return text;
      })
      .then((data) => {
        setHtml(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load preview");
        setLoading(false);
      });

    // Load resume metadata
    resumeService.getResume(uuid).then((r: any) => {
      if (r) {
        setIsPublic(!!r.is_public);
        setShareToken(r.share_token || null);
      }
    }).catch(() => {});
  }, [uuid]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = isPublic
        ? await resumeService.downloadPdf(uuid)
        : await resumeService.downloadResume(uuid);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(isBn ? "PDF ডাউনলোড শুরু হয়েছে" : "PDF download started");
    } catch {
      toast.error(isBn ? "ডাউনলোড ব্যর্থ" : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareToggle = async () => {
    try {
      const result = await resumeService.shareResume(uuid, { is_public: !isPublic });
      setIsPublic(!isPublic);
      if (result.share_token) setShareToken(result.share_token);
      toast.success(
        !isPublic
          ? isBn ? "পাবলিক লিঙ্ক তৈরি হয়েছে" : "Share link created"
          : isBn ? "পাবলিক লিঙ্ক বন্ধ করা হয়েছে" : "Share link disabled"
      );
    } catch {
      toast.error(isBn ? "ব্যর্থ" : "Failed");
    }
  };

  const handleCopyLink = async () => {
    const token = shareToken || uuid;
    const shareUrl = `${window.location.origin}/cv/share/${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(isBn ? "লিঙ্ক কপি হয়েছে" : "Link copied!");
    } catch {
      toast.error(isBn ? "কপি ব্যর্থ" : "Copy failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">Preview Unavailable</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            {isBn
              ? "ব্যাকএন্ডে cv/share রুট যোগ করা হয়নি। সাপোর্টে জানান।"
              : "The CV share endpoint is not configured. Please contact support."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={() => router.push("/resume-builder")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isBn ? "ফিরে যান" : "Go Back"}
            </Button>
            <Button size="sm" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading
                ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                : <Download className="h-4 w-4 mr-1" />}
              {isBn ? "PDF ডাউনলোড" : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/resume-builder")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isBn ? "ফিরে যান" : "Back"}
            </Button>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
              isPublic
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              {isPublic
                ? <Globe className="h-3 w-3" />
                : <Lock className="h-3 w-3" />}
              {isPublic
                ? isBn ? "পাবলিক" : "Public"
                : isBn ? "এই সিভি প্রাইভেট" : "This resume is private"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading
                ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                : <Download className="h-4 w-4 mr-1" />}
              {isBn ? "PDF ডাউনলোড" : "Download PDF"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareToggle}>
              <Share2 className="h-4 w-4 mr-1" />
              {isPublic
                ? isBn ? "আনপাবলিশ" : "Unpublish"
                : isBn ? "শেয়ার করুন" : "Share"}
            </Button>
            {isPublic && (
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <LinkIcon className="h-4 w-4 mr-1" />
                {isBn ? "লিঙ্ক কপি" : "Copy Link"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-lg min-h-screen md:my-4 md:rounded-lg overflow-hidden">
        <iframe
          srcDoc={html}
          title="CV Preview"
          className="w-full border-0"
          style={{ minHeight: "100dvh", height: "auto" }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}