import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias["@eternalheart/react-file-preview"] = path.resolve(process.cwd(), "node_modules/@eternalheart/react-file-preview/lib/index.mjs");
    return config;
  },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
