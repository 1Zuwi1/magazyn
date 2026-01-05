import { headers } from "next/headers"
import type { NextRequest } from "next/server"

const DEFAULT_PORT = 3001
const PORT = process.env.PORT ?? DEFAULT_PORT

export async function getUrl(data: NextRequest | Headers): Promise<URL> {
  const h: Headers = data instanceof Headers ? data : await headers()
  const baseUrl: string =
    data instanceof Headers ? `http://localhost:${PORT}` : data.url

  const proto = h.get("x-forwarded-proto") ?? "http"
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost"
  const port = h.get("x-forwarded-port") ?? h.get("port") ?? PORT.toString()
  const url = new URL(baseUrl)
  url.protocol = proto
  url.host = host
  url.port = port

  return url
}
