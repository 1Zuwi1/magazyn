import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [new URL("https://placehold.co/**")],
    dangerouslyAllowSVG: true,
  },
}

const withNextIntl = createNextIntlPlugin({
  experimental: {
    // Provide the path to the messages that you're using in `AppConfig`
    createMessagesDeclaration: "./messages/pl.json",
  },
})
export default withNextIntl(nextConfig)
