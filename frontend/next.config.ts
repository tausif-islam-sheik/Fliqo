import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // API host for uploads/ (backend serves /uploads/*). Add prod host later.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" }
    ]
  }
};

export default nextConfig;
