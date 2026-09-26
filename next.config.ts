import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure server external packages includes prisma if needed
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
