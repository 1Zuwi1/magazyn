import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getUrl } from "@/lib/get-url"
import { getSession } from "./lib/session"

const ID_REGEX = /^(?=.*[a-zA-Z0-9])[a-zA-Z0-9-]+$/

// Only the base "id" prefixes. Extras come AFTER [name].
const REDIRECT_PREFIXES = ["/dashboard/warehouse/id/"] as const

function normalizePrefix(p: string) {
  return p.endsWith("/") ? p : `${p}/`
}

function getRedirectPrefix(pathname: string) {
  for (const raw of REDIRECT_PREFIXES) {
    const prefix = normalizePrefix(raw)
    if (pathname.startsWith(prefix)) {
      return prefix
    }
  }
  return null
}

const ENTITY_REGEX = /^\/dashboard\/([^/]+)\/id\/$/
function getEntityFromPrefix(prefix: string) {
  // prefix: /dashboard/<entity>/id/
  const m = prefix.match(ENTITY_REGEX)
  return m?.[1] ?? null
}

export async function proxy(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Only bother with redirect logic for GET/HEAD
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname
  const prefix = getRedirectPrefix(pathname)

  if (!prefix) {
    return NextResponse.next()
  }

  const entity = getEntityFromPrefix(prefix)
  if (!entity) {
    return NextResponse.redirect(new URL("/dashboard/", request.url))
  }

  // After prefix we expect: [id]/[name]/(...optional tail...)
  const rest = pathname.slice(prefix.length)
  const parts = rest.split("/").filter(Boolean)

  const [id, nameSegment, ...tail] = parts

  if (!(id && nameSegment && ID_REGEX.test(id))) {
    const base = await getUrl(request)
    return NextResponse.redirect(new URL("/dashboard/", base))
  }

  // Normalize name safely (avoid double-encoding)
  let decodedName: string
  try {
    decodedName = decodeURIComponent(nameSegment)
  } catch {
    const base = await getUrl(request)
    return NextResponse.redirect(new URL("/dashboard/", base))
  }
  const safeName = encodeURIComponent(decodedName)

  const tailPath = tail.length ? `/${tail.join("/")}` : ""

  // Redirect target: /dashboard/<entity>/<name>/<tail...>
  const targetPath = `/dashboard/${entity}/${safeName}${tailPath}`

  const base = await getUrl(request)
  const url = new URL(targetPath, base)
  const paramName = `${entity}Id`
  url.searchParams.set(paramName, id)
  const res = NextResponse.redirect(url)

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings"],
}
