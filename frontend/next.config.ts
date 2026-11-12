import path from "node:path";
import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Корень монорепозитория — иначе Next может принять за корень чужой lockfile выше по дереву
  turbopack: { root: path.join(__dirname, "..") },
  // Запросы к /api/* проксируются на backend — CORS не нужен
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
