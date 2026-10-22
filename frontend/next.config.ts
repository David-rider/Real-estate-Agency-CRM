import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from common real estate image sources
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.example.com" },
      { protocol: "https", hostname: "*.cloudflare.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },

  // Security & PWA headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",            value: "DENY" },
          { key: "X-XSS-Protection",           value: "1; mode=block" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Strict-Transport-Security",  value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type",  value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },

  // No root redirect — / now serves the public marketing landing page

  // Enable React strict mode for better dev warnings
  reactStrictMode: true,
};

export default nextConfig;
