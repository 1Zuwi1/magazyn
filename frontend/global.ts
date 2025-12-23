import type { formats, locales } from "@/i18n/request"
import type messages from "./messages/pl.json"

declare module "next-intl" {
  interface AppConfig {
    // ...
    Locale: (typeof locales)[number]
    Messages: typeof messages
    Formats: typeof formats
  }
}
