import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // API-only app: no rendered pages, so no image optimization needed.
  images: { unoptimized: true },
};

export default nextConfig;
