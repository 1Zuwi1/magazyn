import type { formats } from "@/i18n/request"
import type { locales } from "@/i18n/routing"
import type messages from "./messages/en.json"

declare module "next-intl" {
  interface AppConfig {
    // ...
    Locale: (typeof locales)[number]
    Messages: typeof messages
    Formats: typeof formats
  }
}
