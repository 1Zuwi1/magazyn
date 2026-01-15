import { describe, expect, it } from "vitest"

import {
  ApiMeSchema,
  FormRegisterSchema,
  LoginSchema,
  RegisterSchema,
  Resend2FASchema,
  Verify2FASchema,
} from "./schemas"

describe("LoginSchema", () => {
  it("accepts valid login input", () => {
    const validInput = {
      email: "testuser@example.com",
      password: "password123",
    }

    const result = LoginSchema.shape.POST?.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects password shorter than 6 characters", () => {
    const invalidInput = {
      email: "testuser@example.com",
      password: "12345",
    }

    const result = LoginSchema.shape.POST?.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Hasło musi mieć co najmniej 6 znaków"
      )
    }
  })

  it("rejects invalid emails", () => {
    const invalidInput = {
      email: "invalid@email",
      password: "password123",
    }

    const result = LoginSchema.shape.POST?.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nieprawidłowy adres email")
    }
  })

  it("accepts valid email", () => {
    const validInput = {
      email: "validEmail@example.com",
      password: "password123",
    }

    const result = LoginSchema.shape.POST?.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("has correct output schema with requiresTwoFactor boolean", () => {
    const validOutput = {
      requiresTwoFactor: true,
    }

    const result = LoginSchema.shape.POST?.shape.output.safeParse(validOutput)

    expect(result.success).toBe(true)
  })

  it("rejects output without requiresTwoFactor", () => {
    const invalidOutput = {}

    const result = LoginSchema.shape.POST?.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })
})

describe("RegisterSchema", () => {
  it("accepts valid registration input", () => {
    const validInput = {
      fullName: "Test User",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    }

    const result = FormRegisterSchema.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects mismatched confirmPassword", () => {
    const invalidInput = {
      fullName: "Test User",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "different123",
    }

    const result = FormRegisterSchema.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Hasła nie są zgodne")
    }
  })

  it("rejects invalid email format", () => {
    const invalidInput = {
      fullName: "Test User",
      email: "not-an-email",
      password: "password123",
      confirmPassword: "password123",
    }

    const result = FormRegisterSchema.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("rejects short fullName", () => {
    const invalidInput = {
      fullName: "A",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    }

    const result = FormRegisterSchema.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Imię i nazwisko musi mieć co najmniej 2 znaki"
      )
    }
  })

  it("has null output schema", () => {
    const result = RegisterSchema.shape.POST?.shape.output.safeParse(null)

    expect(result.success).toBe(true)
  })
})

describe("Verify2FASchema", () => {
  it("accepts valid authenticator input", () => {
    const validInput = {
      method: "authenticator" as const,
      code: "123456",
    }

    const result = Verify2FASchema.shape.POST?.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("accepts valid SMS input", () => {
    const validInput = {
      method: "sms" as const,
      code: "123456",
    }

    const result = Verify2FASchema.shape.POST?.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("accepts valid email input", () => {
    const validInput = {
      method: "email" as const,
      code: "123456",
    }

    const result = Verify2FASchema.shape.POST?.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects invalid method", () => {
    const invalidInput = {
      method: "invalid",
      code: "123456",
    }

    const result =
      Verify2FASchema.shape.POST?.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("rejects code that is not 6 characters", () => {
    const invalidInput = {
      method: "authenticator" as const,
      code: "12345",
    }

    const result =
      Verify2FASchema.shape.POST?.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Kod musi mieć dokładnie 6 cyfr"
      )
    }
  })

  it("rejects code longer than 6 characters", () => {
    const invalidInput = {
      method: "authenticator" as const,
      code: "1234567",
    }

    const result =
      Verify2FASchema.shape.POST?.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("has null output schema", () => {
    const result = Verify2FASchema.shape.POST?.shape.output.safeParse(null)

    expect(result.success).toBe(true)
  })
})

describe("Resend2FASchema", () => {
  it("accepts valid SMS method", () => {
    const validInput = {
      method: "sms" as const,
    }

    const result = Resend2FASchema.shape.POST?.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("accepts valid email method", () => {
    const validInput = {
      method: "email" as const,
    }

    const result = Resend2FASchema.shape.POST?.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects authenticator method (not valid for resend)", () => {
    const invalidInput = {
      method: "authenticator",
    }

    const result =
      Resend2FASchema.shape.POST?.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("rejects invalid method", () => {
    const invalidInput = {
      method: "invalid",
    }

    const result =
      Resend2FASchema.shape.POST?.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("has null output schema", () => {
    const result = Resend2FASchema.shape.POST?.shape.output.safeParse(null)

    expect(result.success).toBe(true)
  })
})

describe("ApiMeSchema", () => {
  it("accepts valid user data", () => {
    const validOutput = {
      id: 1,
      email: "user@example.com",
      full_name: "Test User",
      two_factor_enabled: true,
      status: "verified",
      role: "user",
    }

    const result = ApiMeSchema.shape.GET?.shape.output.safeParse(validOutput)

    expect(result.success).toBe(true)
  })

  it("accepts user data with nullable full_name", () => {
    const validOutput = {
      id: 1,
      email: "user@example.com",
      full_name: null,
      two_factor_enabled: false,
      status: "verified",
      role: "admin",
    }

    const result = ApiMeSchema.shape.GET?.shape.output.safeParse(validOutput)

    expect(result.success).toBe(true)
  })

  it("rejects invalid email format", () => {
    const invalidOutput = {
      id: 1,
      email: "not-an-email",
      full_name: null,
      two_factor_enabled: false,
      status: "randomstatus",
      role: "user",
    }

    const result = ApiMeSchema.shape.GET?.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })

  it("rejects non-number id", () => {
    const invalidOutput = {
      id: "not-a-number",
      email: "user@example.com",
      full_name: null,
      two_factor_enabled: false,
      status: "verified",
      role: "user",
    }

    const result = ApiMeSchema.shape.GET?.shape.output.safeParse(invalidOutput)
    expect(result.success).toBe(false)
  })

  it("rejects non-boolean two_factor_enabled", () => {
    const invalidOutput = {
      id: 1,
      email: "user@example.com",
      full_name: null,
      two_factor_enabled: "true",
      status: "verified",
      role: "user",
    }

    const result = ApiMeSchema.shape.GET?.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })

  it("rejects missing required fields", () => {
    const invalidOutput = {
      id: 1,
      email: "user@example.com",
    }

    const result = ApiMeSchema.shape.GET?.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })
})
