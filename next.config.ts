import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude test files from pdf-parse package
    config.module.rules.push({
      test: /\.pdf$/,
      type: 'ignore',
    });
    
    return config;
  },
};

export default nextConfig;
