import { headers } from "next/headers"
import type { NextRequest } from "next/server"

const DEFAULT_PORT = "3001"

function parsePort(port: string | undefined): string {
  const parsed = Number.parseInt(port ?? "", 10)
  // Port 0 is rejected to avoid using a random port
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65_535) {
    return DEFAULT_PORT
  }
  return parsed.toString()
}

function parseHost(host: string | null): string {
  if (!host) {
    return "localhost"
  }
  return host.includes(":") ? host.split(":")[0] : host
}

const PORT = parsePort(process.env.PORT)

export async function getUrl(data: NextRequest | Headers): Promise<URL> {
  const h: Headers = data instanceof Headers ? data : await headers()

  // x-forwarded headers are set by proxy (nginx)
  const proto = h.get("x-forwarded-proto") || "http"
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost"
  const port = h.get("x-forwarded-port") || PORT

  try {
    const url = new URL(
      data instanceof Headers ? `http://localhost:${PORT}` : data.url
    )
    url.protocol = proto
    url.host = parseHost(host)
    url.port = parsePort(port)
    return url
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid URL construction: ${message}`)
  }
}
