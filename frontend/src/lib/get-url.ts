import { headers } from "next/headers"
import type { NextRequest } from "next/server"

export async function getUrl(data: NextRequest | Headers): Promise<URL> {
  const h: Headers = data instanceof Headers ? data : await headers()
  const baseUrl: string =
    data instanceof Headers ? "https://www.localhost:3000" : data.url

  const proto = h.get("x-forwarded-proto") ?? "http"
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost"
  const port = h.get("x-forwarded-port") ?? h.get("port") ?? "3000"

  const url = new URL(baseUrl)
  url.protocol = proto
  url.host = host
  url.port = port

  return url
}
