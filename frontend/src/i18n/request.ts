import { cookies, headers } from "next/headers"
import type { Formats } from "next-intl"
import { getRequestConfig, type RequestConfig } from "next-intl/server"
import { defaultLocale, type Locale, locales } from "./routing"

export const formats = {
  dateTime: {
    short: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: "long",
      type: "conjunction",
    },
  },
} satisfies Formats

const LOCALE_COOKIE_NAME = "NEXT_LOCALE"

const resolveLocale = (candidate: string | undefined | null): Locale | null => {
  if (!candidate) {
    return null
  }
  return locales.includes(candidate as Locale) ? (candidate as Locale) : null
}

const getLocaleFromHeader = async (): Promise<Locale | null> => {
  const requestHeaders = await headers()
  const acceptLanguage = requestHeaders.get("accept-language")
  if (!acceptLanguage) {
    return null
  }

  const parsed = acceptLanguage
    .split(",")
    .map((part: string) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean)

  for (const locale of parsed) {
    if (!locale) {
      continue
    }
    const direct = resolveLocale(locale)
    if (direct) {
      return direct
    }
    const base = locale.split("-")[0]
    const fallback = resolveLocale(base)
    if (fallback) {
      return fallback
    }
  }

  return null
}

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = resolveLocale(store.get(LOCALE_COOKIE_NAME)?.value)
  const headerLocale = await getLocaleFromHeader()
  const locale = cookieLocale ?? headerLocale ?? defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // ...
  } satisfies RequestConfig
})
