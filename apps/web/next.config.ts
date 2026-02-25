import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://kitaphane-2e37c.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
