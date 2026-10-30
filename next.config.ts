import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone for the Docker image, so the runtime image does
  // not need the full node_modules tree.
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
