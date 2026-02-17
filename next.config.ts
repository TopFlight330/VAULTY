import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify handles image optimization
  images: {
    unoptimized: true,
  },
  // Allow large file uploads (post media up to 50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/@:username",
        destination: "/creator-page/:username",
      },
    ];
  },
};

export default nextConfig;
