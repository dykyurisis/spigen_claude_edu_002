import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build for Docker/Cloud Run deployment
  output: "standalone",
};

export default nextConfig;
