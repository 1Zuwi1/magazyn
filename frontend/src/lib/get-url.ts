import type { NextRequest } from "next/server"

const first = (v: string | null) => (v ?? "").split(",")[0].trim()

const isStandardPort = (proto: string, port: string) =>
  (proto === "https" && port === "443") || (proto === "http" && port === "80")

export function getUrl(data: NextRequest | Headers): URL {
  const h = data instanceof Headers ? data : data.headers

  const proto = first(h.get("x-forwarded-proto")) || "http"
  const host =
    first(h.get("x-forwarded-host")) || first(h.get("host")) || "localhost"
  const port =
    first(h.get("x-forwarded-port")) || (proto === "https" ? "443" : "80")

  // If host already includes a port, keep it. Otherwise only add non-standard ports.
  const hostHasPort = host.includes(":")
  const origin =
    hostHasPort || isStandardPort(proto, port)
      ? `${proto}://${host}`
      : `${proto}://${host}:${port}`

  return new URL(origin)
}
