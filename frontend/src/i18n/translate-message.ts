import { createTranslator } from "use-intl/core"
import enMessages from "../../messages/en.json"
import plMessages from "../../messages/pl.json"
import {
  type AppLocale,
  DEFAULT_APP_LOCALE,
  getClientAppLocale,
  getServerRuntimeLocale,
  normalizeAppLocale,
} from "./locale"

type MessageValues = Record<
  string,
  boolean | Date | null | number | string | undefined
>

const messagesByLocale: Readonly<Record<AppLocale, Record<string, unknown>>> = {
  en: enMessages as Record<string, unknown>,
  pl: plMessages as Record<string, unknown>,
}

const translators: Readonly<
  Record<AppLocale, ReturnType<typeof createTranslator>>
> = {
  en: createTranslator({
    locale: "en",
    messages: messagesByLocale.en,
  }),
  pl: createTranslator({
    locale: "pl",
    messages: messagesByLocale.pl,
  }),
}

const resolveCurrentLocale = (locale?: string): AppLocale => {
  if (locale) {
    return normalizeAppLocale(locale)
  }

  if (typeof document !== "undefined") {
    return getClientAppLocale()
  }

  const serverLocale = getServerRuntimeLocale()
  if (serverLocale) {
    return serverLocale
  }

  return DEFAULT_APP_LOCALE
}

export const translateMessage = (
  key: string,
  values?: MessageValues,
  locale?: string
): string => {
  const resolvedLocale = resolveCurrentLocale(locale)
  const translator = translators[resolvedLocale]

  if (values) {
    return translator(key as never, values as never)
  }

  return translator(key as never)
}
