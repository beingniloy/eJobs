"use client";

import { useThemeStore } from "@/store/theme-store";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  const clean = path.replace(/^\/?storage\//, "");
  return `${API_BASE}/storage/${clean}`;
}

interface DefaultAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallback?: React.ReactNode;
}

export function DefaultAvatar({ src, name, className, fallback }: DefaultAvatarProps) {
  const { settings } = useThemeStore();
  const roundLogo = getImageUrl(settings.round_logo || settings.site_logo);
  const imageSrc = getImageUrl(src) || roundLogo || undefined;

  return (
    <Avatar className={className}>
      <AvatarImage src={imageSrc} alt={name || "Avatar"} />
      <AvatarFallback>
        {fallback || getInitials(name || "?")}
      </AvatarFallback>
    </Avatar>
  );
}

interface CompanyLogoProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  children?: React.ReactNode;
}

export function CompanyLogo({ src, name, className, children }: CompanyLogoProps) {
  const { settings } = useThemeStore();
  const roundLogo = getImageUrl(settings.round_logo || settings.site_logo);

  if (src) {
    const resolved = src.startsWith("http") ? src : `${API_BASE}/storage/${src.replace(/^\/?storage\//, "")}`;
    return (
      <img
        src={resolved}
        alt={name || "Company"}
        className={cn("w-full h-full object-cover", className)}
      />
    );
  }

  if (roundLogo) {
    return (
      <img
        src={roundLogo}
        alt={name || "Company"}
        className={cn("w-full h-full object-cover", className)}
      />
    );
  }

  return <>{children}</>;
}
