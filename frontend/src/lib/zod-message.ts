type MessageValues = Record<
  string,
  boolean | Date | null | number | string | undefined
>

type Translate = (key: string, values?: MessageValues) => string

const TRANSLATION_KEY_PREFIX = "generated."
const ZOD_MESSAGE_PREFIX = "__zod_i18n__:"

export const createZodMessage = (
  key: string,
  values?: MessageValues
): string => {
  if (!values) {
    return key
  }

  return `${ZOD_MESSAGE_PREFIX}${JSON.stringify({ key, values })}`
}

const isTranslationKey = (message: string): boolean =>
  message.startsWith(TRANSLATION_KEY_PREFIX)

const parseZodMessage = (
  message: string
): { key: string; values?: MessageValues } | null => {
  if (!message.startsWith(ZOD_MESSAGE_PREFIX)) {
    return null
  }

  const payload = message.slice(ZOD_MESSAGE_PREFIX.length)

  try {
    const parsed = JSON.parse(payload) as {
      key?: string
      values?: MessageValues
    }

    if (typeof parsed.key !== "string") {
      return null
    }

    return {
      key: parsed.key,
      values: parsed.values,
    }
  } catch {
    return null
  }
}

export const translateZodMessage = (
  message: string,
  translate: Translate
): string => {
  const parsedMessage = parseZodMessage(message)

  if (parsedMessage) {
    try {
      return translate(parsedMessage.key, parsedMessage.values)
    } catch {
      return parsedMessage.key
    }
  }

  if (!isTranslationKey(message)) {
    return message
  }

  try {
    return translate(message)
  } catch {
    return message
  }
}
