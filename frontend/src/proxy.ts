import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getUrl } from "@/lib/get-url"
import { getSession } from "./lib/session"

const COOKIE_MAX_AGE = 60 * 60 // 1 hour
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

// If you want to normalize known typos or aliases in the tail, do it here.
const TAIL_SEGMENT_REWRITES: Record<string, string> = {
  "3d-visualizaiton": "3d-visualization", // typo -> canonical
}

function rewriteTailSegments(segments: string[]) {
  return segments.map((s) => TAIL_SEGMENT_REWRITES[s] ?? s)
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

  const normalizedTail = rewriteTailSegments(tail)
  const tailPath = normalizedTail.length ? `/${normalizedTail.join("/")}` : ""

  // Redirect target: /dashboard/<entity>/<name>/<tail...>
  const targetPath = `/dashboard/${entity}/${safeName}${tailPath}`

  const base = await getUrl(request)
  const res = NextResponse.redirect(new URL(targetPath, base))

  const cookieName = `${entity}Id`
  res.cookies.set({
    name: cookieName,
    value: id,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Scope cookie to the resolved page (now includes tail, which is what you're redirecting to)
    path: targetPath,
    maxAge: COOKIE_MAX_AGE,
  })

  return res
}

export const config = {
  matcher: "/dashboard/:path*",
}
