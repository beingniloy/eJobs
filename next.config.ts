import type { NextConfig } from "next";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const cleanApiUrl = rawApiUrl.replace(/\/$/, "");
const backendUrl = cleanApiUrl.replace(/\/api\/?$/, "");
const apiUrl = `${backendUrl}/api`;

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["laravel-echo", "pusher-js"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "**.ejobs.bd",
        pathname: "/storage/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.maateen.me; style-src-elem 'self' 'unsafe-inline' https://fonts.maateen.me; font-src 'self' data: https://fonts.maateen.me; img-src 'self' data: http://127.0.0.1:8000 https://*.ejobs.bd; connect-src 'self' http://127.0.0.1:8000 http://localhost:3000 wss: ws:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${backendUrl}/storage/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${backendUrl}/sanctum/:path*`,
      },
      {
        source: "/cv/share/:path*",
        destination: `${backendUrl}/cv/share/:path*`,
      },
    ];
  },
};

export default nextConfig;