import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "worker-sahaye.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "miniios3.aaademosites.com",
      }
    ],
  },
};

export default nextConfig;
