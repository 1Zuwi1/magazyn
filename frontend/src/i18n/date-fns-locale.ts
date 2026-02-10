import type { Locale } from "date-fns"
import { enUS, pl } from "date-fns/locale"
import {
  type AppLocale,
  DEFAULT_APP_LOCALE,
  normalizeAppLocale,
} from "@/i18n/locale"

const DATE_FNS_LOCALES: Readonly<Record<AppLocale, Locale>> = {
  en: enUS,
  pl,
}

const DEFAULT_DATE_FNS_LOCALE = DATE_FNS_LOCALES[DEFAULT_APP_LOCALE]

export const getDateFnsLocale = (locale?: string): Locale =>
  DATE_FNS_LOCALES[normalizeAppLocale(locale)] ?? DEFAULT_DATE_FNS_LOCALE
