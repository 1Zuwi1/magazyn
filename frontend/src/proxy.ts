import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getUrl } from "@/lib/get-url"
import { getSession } from "./lib/session"

const ID_REGEX = /^(?=.*[a-zA-Z0-9])[a-zA-Z0-9-]+$/

interface RedirectRule {
  sourcePrefix: string
  targetPrefix: string
  queryParamName: string
  fallbackPath: string
}

const REDIRECT_RULES: readonly RedirectRule[] = [
  {
    sourcePrefix: "/dashboard/warehouse/id/",
    targetPrefix: "/dashboard/warehouse/",
    queryParamName: "warehouseId",
    fallbackPath: "/dashboard/warehouse",
  },
  {
    sourcePrefix: "/admin/warehouses/id/",
    targetPrefix: "/admin/warehouses/",
    queryParamName: "warehouseId",
    fallbackPath: "/admin/warehouses",
  },
] as const

function normalizePrefix(p: string) {
  return p.endsWith("/") ? p : `${p}/`
}

function getRedirectRule(pathname: string): RedirectRule | null {
  for (const rule of REDIRECT_RULES) {
    const prefix = normalizePrefix(rule.sourcePrefix)
    if (pathname.startsWith(prefix)) {
      return {
        ...rule,
        sourcePrefix: prefix,
        targetPrefix: normalizePrefix(rule.targetPrefix),
      }
    }
  }

  return null
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
  const rule = getRedirectRule(pathname)
  if (!rule) {
    return NextResponse.next()
  }

  // After prefix we expect: [id]/[name]/(...optional tail...)
  const rest = pathname.slice(rule.sourcePrefix.length)
  const parts = rest.split("/").filter(Boolean)
  const [id, nameSegment, ...tail] = parts

  if (!(id && nameSegment && ID_REGEX.test(id))) {
    const base = await getUrl(request)
    return NextResponse.redirect(new URL(rule.fallbackPath, base))
  }

  // Normalize name safely (avoid double-encoding)
  let decodedName: string
  try {
    decodedName = decodeURIComponent(nameSegment)
  } catch {
    const base = await getUrl(request)
    return NextResponse.redirect(new URL(rule.fallbackPath, base))
  }
  const safeName = encodeURIComponent(decodedName)
  const tailPath = tail.length ? `/${tail.join("/")}` : ""

  const targetPath = `${rule.targetPrefix}${safeName}${tailPath}`

  const base = await getUrl(request)
  const url = new URL(targetPath, base)
  for (const [param, value] of request.nextUrl.searchParams.entries()) {
    url.searchParams.append(param, value)
  }
  url.searchParams.set(rule.queryParamName, id)

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/admin/:path*"],
}
