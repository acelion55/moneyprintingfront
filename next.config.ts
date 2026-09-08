import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: isDev
          ? 'http://localhost:3001/:path*'
          : 'https://moneyprinting.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
