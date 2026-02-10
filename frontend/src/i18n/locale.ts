export const APP_LOCALES = ["pl", "en"] as const

export type AppLocale = (typeof APP_LOCALES)[number]

declare global {
  var __magazynRuntimeLocale: AppLocale | undefined
}

export const DEFAULT_APP_LOCALE: AppLocale = "pl"

export const LOCALE_COOKIE_NAME = "MAGAZYN_LOCALE"

export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

const matchSupportedAppLocale = (locale?: string | null): AppLocale | null => {
  if (!locale) {
    return null
  }

  const normalizedLocale = locale.trim().toLowerCase()

  if (
    normalizedLocale === "en" ||
    normalizedLocale.startsWith("en-") ||
    normalizedLocale.startsWith("en_")
  ) {
    return "en"
  }

  if (
    normalizedLocale === "pl" ||
    normalizedLocale.startsWith("pl-") ||
    normalizedLocale.startsWith("pl_")
  ) {
    return "pl"
  }

  return null
}

export const normalizeAppLocale = (locale?: string | null): AppLocale => {
  const matchedLocale = matchSupportedAppLocale(locale)
  if (matchedLocale) {
    return matchedLocale
  }

  return DEFAULT_APP_LOCALE
}

export const getAppLocaleFromAcceptLanguageHeader = (
  acceptLanguage?: string | null
): AppLocale | null => {
  if (!acceptLanguage) {
    return null
  }

  for (const languageEntry of acceptLanguage.split(",")) {
    const [rawLocale] = languageEntry.split(";")
    const matchedLocale = matchSupportedAppLocale(rawLocale)
    if (matchedLocale) {
      return matchedLocale
    }
  }

  return null
}

const getCookieValue = (
  cookieSource: string,
  cookieName: string
): string | undefined => {
  const cookieParts = cookieSource.split(";")

  for (const part of cookieParts) {
    const [rawName, ...rawValueParts] = part.trim().split("=")

    if (rawName !== cookieName) {
      continue
    }

    const rawValue = rawValueParts.join("=")
    if (!rawValue) {
      return undefined
    }

    try {
      return decodeURIComponent(rawValue)
    } catch {
      return rawValue
    }
  }

  return undefined
}

export const getAppLocaleFromCookieSource = (
  cookieSource?: string | null
): AppLocale | null => {
  if (!cookieSource) {
    return null
  }

  const localeFromCookie = getCookieValue(cookieSource, LOCALE_COOKIE_NAME)
  if (!localeFromCookie) {
    return null
  }

  return normalizeAppLocale(localeFromCookie)
}

export const getClientAppLocale = (): AppLocale => {
  if (typeof document === "undefined") {
    return DEFAULT_APP_LOCALE
  }

  const localeFromCookie = getAppLocaleFromCookieSource(document.cookie)
  if (localeFromCookie) {
    return localeFromCookie
  }

  const htmlLanguage = document.documentElement.lang
  if (htmlLanguage) {
    return normalizeAppLocale(htmlLanguage)
  }

  if (typeof navigator !== "undefined") {
    return normalizeAppLocale(navigator.language)
  }

  return DEFAULT_APP_LOCALE
}

export const setServerRuntimeLocale = (locale: AppLocale): void => {
  if (typeof window !== "undefined") {
    return
  }

  globalThis.__magazynRuntimeLocale = locale
}

export const getServerRuntimeLocale = (): AppLocale | null => {
  if (typeof window !== "undefined") {
    return null
  }

  return globalThis.__magazynRuntimeLocale ?? null
}

export const createLocaleCookie = (locale: AppLocale): string =>
  `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
