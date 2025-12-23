import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
}

export default nextConfig
