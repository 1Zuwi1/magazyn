import type { Formats } from "next-intl"
import { getRequestConfig, type RequestConfig } from "next-intl/server"

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

export const locales = ["pl"] as const

export default getRequestConfig(async () => {
  const locale = "pl"

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // ...
  } satisfies RequestConfig
})
