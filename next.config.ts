import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "digi-api.com" }] },
  turbopack: { root: process.cwd() },
};

export default nextConfig;