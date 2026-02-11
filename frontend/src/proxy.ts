import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import {
  type AppLocale,
  addAppLocaleToPathname,
  getAppLocaleFromPathname,
  stripAppLocaleFromPathname,
} from "@/i18n/locale"
import { routing } from "@/i18n/routing"
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
  {
    sourcePrefix: "/admin/items/id/",
    targetPrefix: "/admin/items/",
    queryParamName: "itemId",
    fallbackPath: "/admin/items",
  },
] as const

const PROTECTED_PATH_PREFIXES = ["/dashboard", "/settings", "/admin"] as const
const intlProxy = createIntlMiddleware(routing)

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

const hasPathPrefix = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

const isProtectedPath = (pathname: string): boolean => {
  for (const prefix of PROTECTED_PATH_PREFIXES) {
    if (hasPathPrefix(pathname, prefix)) {
      return true
    }
  }

  return false
}

const resolveRequestLocale = (pathname: string): AppLocale =>
  getAppLocaleFromPathname(pathname) ?? routing.defaultLocale

const localizePathname = (pathname: string, locale: AppLocale): string => {
  if (locale === routing.defaultLocale) {
    return pathname
  }

  return addAppLocaleToPathname(pathname, locale)
}

export async function proxy(request: NextRequest) {
  const intlResponse = intlProxy(request)
  if (intlResponse.headers.has("location")) {
    return intlResponse
  }

  const locale = resolveRequestLocale(request.nextUrl.pathname)
  const pathname = stripAppLocaleFromPathname(request.nextUrl.pathname)

  if (isProtectedPath(pathname)) {
    const session = await getSession()
    if (!session) {
      return NextResponse.redirect(
        new URL(localizePathname("/login", locale), request.url)
      )
    }
  }

  // Only bother with redirect logic for GET/HEAD
  if (request.method !== "GET" && request.method !== "HEAD") {
    return intlResponse
  }

  const rule = getRedirectRule(pathname)
  if (!rule) {
    return intlResponse
  }

  // After prefix we expect: [id]/[name]/(...optional tail...)
  const rest = pathname.slice(rule.sourcePrefix.length)
  const parts = rest.split("/").filter(Boolean)
  const [id, nameSegment, ...tail] = parts

  if (!(id && nameSegment && ID_REGEX.test(id))) {
    const base = await getUrl(request)
    const fallbackPath = localizePathname(rule.fallbackPath, locale)
    return NextResponse.redirect(new URL(fallbackPath, base))
  }

  // Normalize name safely (avoid double-encoding)
  let decodedName: string
  try {
    decodedName = decodeURIComponent(nameSegment)
  } catch {
    const base = await getUrl(request)
    const fallbackPath = localizePathname(rule.fallbackPath, locale)
    return NextResponse.redirect(new URL(fallbackPath, base))
  }
  const safeName = encodeURIComponent(decodedName)
  const tailPath = tail.length ? `/${tail.join("/")}` : ""

  const targetPath = localizePathname(
    `${rule.targetPrefix}${safeName}${tailPath}`,
    locale
  )

  const base = await getUrl(request)
  const url = new URL(targetPath, base)
  for (const [param, value] of request.nextUrl.searchParams.entries()) {
    url.searchParams.append(param, value)
  }
  url.searchParams.set(rule.queryParamName, id)

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
}
