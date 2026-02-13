import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solana wallet adapter needs this
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
