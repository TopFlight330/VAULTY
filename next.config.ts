import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify handles image optimization
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
