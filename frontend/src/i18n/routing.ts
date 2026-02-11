import { defineRouting } from "next-intl/routing"
import { APP_LOCALES, DEFAULT_APP_LOCALE } from "@/i18n/locale"

export const routing = defineRouting({
  locales: APP_LOCALES,
  defaultLocale: DEFAULT_APP_LOCALE,
  localePrefix: "as-needed",
})
