import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getUrl } from "@/lib/get-url"
import { getSession } from "./lib/session"

const COOKIE_MAX_AGE = 60 * 60 // 1 hour
const ID_REGEX = /^(?=.*[a-zA-Z0-9])[a-zA-Z0-9-]+$/

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

const REGEX_EXP = /^\/dashboard\/([^/]+)\/id\/$/

function getEntityFromPrefix(prefix: string) {
  // prefix is like: /dashboard/<entity>/id/
  const m = prefix.match(REGEX_EXP)
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

  // Not one of our redirect routes -> continue normally
  if (!prefix) {
    return NextResponse.next()
  }

  const entity = getEntityFromPrefix(prefix)
  if (!entity) {
    return NextResponse.redirect(new URL("/dashboard/", request.url))
  }

  // Pull out the two path segments after the prefix: [id]/[name]
  const rest = pathname.slice(prefix.length) // "abc123/some-name" (maybe with trailing slash)
  const parts = rest.split("/").filter(Boolean)
  const [id, nameSegment, ...extra] = parts

  // Must be exactly /<id>/<name> (no extra segments)
  if (!(id && nameSegment) || extra.length > 0 || !ID_REGEX.test(id)) {
    const base = await getUrl(request)
    return NextResponse.redirect(new URL("/dashboard/", base))
  }

  // Normalize name safely (avoid double-encoding)
  let decodedName = nameSegment
  try {
    decodedName = decodeURIComponent(nameSegment)
  } catch {
    // Treat it as invalid
    const base = await getUrl(request)
    return NextResponse.redirect(new URL("/dashboard/", base))
  }
  const safeName = encodeURIComponent(decodedName)

  const base = await getUrl(request)

  // Redirect target: /dashboard/<entity>/<name>
  const targetPath = `/dashboard/${entity}/${safeName}`
  const res = NextResponse.redirect(new URL(targetPath, base))

  // Cookie name: "<entity>Id" (warehouseId, somerouteId, ...)
  // If you want camelCase like someRouteId, use an explicit mapping instead.
  const cookieName = `${entity}Id`

  res.cookies.set({
    name: cookieName,
    value: id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Scope cookie to the resolved page, same as your original behavior
    path: targetPath,
    maxAge: COOKIE_MAX_AGE,
  })

  return res
}

export const config = {
  matcher: "/dashboard/:path*",
}
