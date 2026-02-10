import { createTranslator } from "use-intl/core"
import messages from "../../messages/pl.json"

type MessageValues = Record<
  string,
  boolean | Date | null | number | string | undefined
>

const translator = createTranslator({
  locale: "pl",
  messages,
})

export const translateMessage = (
  key: string,
  values?: MessageValues
): string => {
  if (values) {
    return translator(key as never, values as never)
  }

  return translator(key as never)
}
