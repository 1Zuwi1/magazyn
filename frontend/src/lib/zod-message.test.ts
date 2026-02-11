import { describe, expect, it } from "vitest"
import type { AppTranslate } from "@/i18n/use-translations"
import { createZodMessage, translateZodMessage } from "./zod-message"

const createTranslatorMock = (
  translate: (key: string, values?: Record<string, unknown>) => string
): AppTranslate => {
  const translator = translate as unknown as AppTranslate
  translator.rich = ((key: string): string => key) as AppTranslate["rich"]
  translator.markup = ((key: string): string => key) as AppTranslate["markup"]
  translator.raw = (() => undefined) as AppTranslate["raw"]
  translator.has = (() => true) as AppTranslate["has"]
  return translator
}

describe("zod-message", () => {
  it("returns plain key when no interpolation values are provided", () => {
    expect(createZodMessage("generated.validation.invalidEmailAddress")).toBe(
      "generated.validation.invalidEmailAddress"
    )
  })

  it("translates serialized key with interpolation values", () => {
    const message = createZodMessage(
      "generated.validation.value2faCodeMustExactly",
      {
        value0: 6,
      }
    )

    const translated = translateZodMessage(
      message,
      createTranslatorMock((key, values) => `${key}:${String(values?.value0)}`)
    )

    expect(translated).toBe("generated.validation.value2faCodeMustExactly:6")
  })

  it("keeps non-translation text unchanged", () => {
    expect(
      translateZodMessage(
        "Credential JSON jest wymagany",
        createTranslatorMock(() => "ignored")
      )
    ).toBe("Credential JSON jest wymagany")
  })
})
