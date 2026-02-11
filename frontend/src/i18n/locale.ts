export const APP_LOCALES = ["pl", "en"] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const DEFAULT_APP_LOCALE: AppLocale = "pl"

const isAppLocale = (locale: string): locale is AppLocale =>
  APP_LOCALES.includes(locale as AppLocale)

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

export const getAppLocaleFromPathname = (
  pathname?: string | null
): AppLocale | null => {
  if (!pathname) {
    return null
  }

  const [, rawLocaleSegment] = pathname.split("/")
  if (!rawLocaleSegment) {
    return null
  }

  return isAppLocale(rawLocaleSegment) ? rawLocaleSegment : null
}

export const getClientAppLocale = (): AppLocale => {
  if (typeof window === "undefined") {
    return DEFAULT_APP_LOCALE
  }

  const localeFromPathname = getAppLocaleFromPathname(window.location.pathname)
  if (localeFromPathname) {
    return localeFromPathname
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

export const stripAppLocaleFromPathname = (pathname: string): string => {
  const localeFromPathname = getAppLocaleFromPathname(pathname)
  if (!localeFromPathname) {
    return pathname
  }

  const strippedPathname = pathname.replace(
    new RegExp(`^/${localeFromPathname}(?=/|$)`),
    ""
  )

  return strippedPathname.length > 0 ? strippedPathname : "/"
}

export const addAppLocaleToPathname = (
  pathname: string,
  locale: AppLocale
): string => {
  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`
  const strippedPathname = stripAppLocaleFromPathname(normalizedPathname)

  if (strippedPathname === "/") {
    return `/${locale}`
  }

  return `/${locale}${strippedPathname}`
}

const APP_LOCALE_PATH_REGEX = new RegExp(`^/(${APP_LOCALES.join("|")})(?=/|$)`)

export const removeAppLocalePrefix = (pathname: string): string => {
  return pathname.replace(APP_LOCALE_PATH_REGEX, "")
}
