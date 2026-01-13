import { NextResponse } from "next/server"
import { defaultLocale, type Locale, locales } from "@/i18n/routing"

const LOCALE_COOKIE_NAME = "NEXT_LOCALE"
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

const resolveLocale = (candidate: unknown): Locale =>
  locales.includes(candidate as Locale) ? (candidate as Locale) : defaultLocale

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}))
  const locale = resolveLocale(payload?.locale)

  const response = NextResponse.json({ locale })
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  })

  return response
}
