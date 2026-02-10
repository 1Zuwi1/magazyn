import { cookies, headers } from "next/headers"
import type { Formats } from "next-intl"
import { getRequestConfig, type RequestConfig } from "next-intl/server"
import {
  APP_LOCALES,
  getAppLocaleFromAcceptLanguageHeader,
  LOCALE_COOKIE_NAME,
  normalizeAppLocale,
  setServerRuntimeLocale,
} from "@/i18n/locale"

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

export const locales = APP_LOCALES

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  const requestHeaders = await headers()
  const localeFromAcceptLanguage = getAppLocaleFromAcceptLanguageHeader(
    requestHeaders.get("accept-language")
  )
  const resolvedLocale = normalizeAppLocale(
    cookieLocale ?? localeFromAcceptLanguage
  )
  setServerRuntimeLocale(resolvedLocale)

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
    // ...
  } satisfies RequestConfig
})
