import type { Locale } from "date-fns"
import { enUS, pl } from "date-fns/locale"

const DEFAULT_DATE_FNS_LOCALE = pl

const DATE_FNS_LOCALES: Readonly<Record<string, Locale>> = {
  en: enUS,
  pl,
}

export const getDateFnsLocale = (locale?: string): Locale => {
  if (!locale) {
    return DEFAULT_DATE_FNS_LOCALE
  }

  const normalizedLocale = locale.toLowerCase()

  if (normalizedLocale.startsWith("en")) {
    return DATE_FNS_LOCALES.en
  }

  if (normalizedLocale.startsWith("pl")) {
    return DATE_FNS_LOCALES.pl
  }

  return DEFAULT_DATE_FNS_LOCALE
}
