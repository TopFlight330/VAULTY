import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify handles image optimization
  images: {
    unoptimized: true,
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
