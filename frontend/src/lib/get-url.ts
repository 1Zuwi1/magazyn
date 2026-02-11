import { headers } from "next/headers"
import type { NextRequest } from "next/server"

function isStandardPort(proto: string, port: string) {
  return (
    (proto === "https" && port === "443") || (proto === "http" && port === "80")
  )
}

export async function getUrl(data: NextRequest | Headers): Promise<URL> {
  const h: Headers = data instanceof Headers ? data : await headers()

  const proto = (h.get("x-forwarded-proto") || "http").split(",")[0].trim()

  // Prefer x-forwarded-host, but keep any port if present
  const forwardedHost = (h.get("x-forwarded-host") || "").split(",")[0].trim()
  const hostHeader = (h.get("host") || "localhost").split(",")[0].trim()
  const host = forwardedHost || hostHeader

  // If x-forwarded-port exists, use it, otherwise derive from proto
  const xfPort = (h.get("x-forwarded-port") || "").split(",")[0].trim()
  const derivedPort = proto === "https" ? "443" : "80"
  const port = xfPort || derivedPort

  const base = new URL(
    data instanceof Headers ? `${proto}://${host}` : data.url
  )

  // If host already includes a port, trust it and do nothing
  if (!(host.includes(":") || isStandardPort(proto, port))) {
    // Only set port when it's non-standard
    base.port = port
  }

  base.protocol = proto
  base.hostname = host.includes(":") ? host.split(":")[0] : host

  return base
}
