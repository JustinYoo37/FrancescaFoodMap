import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Avoid picking a parent directory when multiple lockfiles exist on the machine. */
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
