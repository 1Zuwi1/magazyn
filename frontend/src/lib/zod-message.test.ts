import { describe, expect, it } from "vitest"
import { createZodMessage, translateZodMessage } from "./zod-message"

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
      (key, values) => `${key}:${String(values?.value0)}`
    )

    expect(translated).toBe("generated.validation.value2faCodeMustExactly:6")
  })

  it("keeps non-translation text unchanged", () => {
    expect(
      translateZodMessage("Credential JSON jest wymagany", () => "ignored")
    ).toBe("Credential JSON jest wymagany")
  })
})
