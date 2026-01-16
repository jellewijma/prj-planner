import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native Node modules (like better-sqlite3) external.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
