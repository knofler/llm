import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
  },
  async rewrites() {
    // Browsers still ask for /favicon.ico; serve the generated icon.
    return [{ source: "/favicon.ico", destination: "/pwa/icon-48.png" }];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
