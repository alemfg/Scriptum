import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  serverExternalPackages: [
    "mammoth",
    "pdf-parse",
    "epub-gen-memory",
    "puppeteer",
    "@prisma/client",
    "prisma",
    "@modelcontextprotocol/sdk",
    "openai",
    "@anthropic-ai/sdk",
    "docx",
  ],
  turbopack: {},
};

export default nextConfig;
