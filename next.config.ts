import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solana wallet adapter needs this
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  // Disable React DevTools error overlay in development
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
};

export default nextConfig;
