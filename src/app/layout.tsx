import type { Metadata, Viewport } from "next";
import ClientProviders from "@/components/client-providers";
import "./globals.css";

export const dynamic = "force-dynamic";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

const DEFAULTS = {
  siteName: process.env.NEXT_PUBLIC_APP_NAME || "eJobs",
  title: `${process.env.NEXT_PUBLIC_APP_NAME || "eJobs"} - Find Your Dream Job`,
  description:
    "Find your dream job or hire the best talent. AI-powered job matching, resume builder, and more.",
  keywords: [
    "jobs",
    "career",
    "employment",
    "hiring",
    "job portal",
    "job board",
    "resume builder",
    "AI job matching",
  ],
};

async function fetchSeoSettings(): Promise<{
  meta_description?: string;
  seo_keywords?: string[];
  og_image?: string;
  twitter_image?: string;
  site_name?: string;
  site_favicon?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/api/settings/theme`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data || {};
  } catch {
    return {};
  }
}

function buildOgImageUrl(ogImage?: string): string | undefined {
  if (!ogImage) return undefined;
  if (ogImage.startsWith("http")) return ogImage;
  return `${API_URL}/storage/${ogImage}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchSeoSettings();

  const siteName = seo.site_name || DEFAULTS.siteName;
  const title = seo.site_name
    ? `${seo.site_name} - Find Your Dream Job`
    : DEFAULTS.title;
  const description =
    typeof seo.meta_description === "string" && seo.meta_description
      ? seo.meta_description
      : DEFAULTS.description;
  const keywords =
    Array.isArray(seo.seo_keywords) && seo.seo_keywords.length > 0
      ? seo.seo_keywords
      : DEFAULTS.keywords;
  const ogImage = buildOgImageUrl(seo.og_image);
  const twitterImage = buildOgImageUrl(seo.twitter_image);
  const favicon = buildOgImageUrl(seo.site_favicon);

  return {
    title: {
      default: title,
      template: `%s - ${siteName}`,
    },
    description,
    keywords,
    authors: [{ name: siteName }],
    ...(favicon ? { icons: { icon: favicon } } : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName,
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1729" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
