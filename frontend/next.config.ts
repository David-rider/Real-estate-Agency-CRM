import type { NextConfig } from "next";

// Static export (no server): the site is plain files served by the host.
// Security headers live in the host config: frontend/vercel.json and frontend/public/_headers (Cloudflare).
const nextConfig: NextConfig = {
  output: "export",
  // Allow images from common real estate image sources
  images: {
    unoptimized: true, // no image optimizer without a server (next/image is not used anyway)
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.example.com" },
      { protocol: "https", hostname: "*.cloudflare.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },

  // No root redirect — / now serves the public marketing landing page

  // Enable React strict mode for better dev warnings
  reactStrictMode: true,
};

export default nextConfig;
