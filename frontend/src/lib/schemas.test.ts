import { describe, expect, it } from "vitest"

import {
  ApiMeSchema,
  FormRegisterSchema,
  LoginSchema,
  PasswordSchema,
  RegisterSchema,
  Resend2FASchema,
  Verify2FASchema,
} from "./schemas"

describe("PasswordSchema", () => {
  it("accepts a strong password", () => {
    const result = PasswordSchema.safeParse("Password123!")

    expect(result.success).toBe(true)
  })

  it("rejects passwords missing an uppercase letter", () => {
    const result = PasswordSchema.safeParse("password123!")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Hasło musi zawierać co najmniej jedną wielką literę"
      )
    }
  })

  it("rejects passwords missing a lowercase letter", () => {
    const result = PasswordSchema.safeParse("PASSWORD123!")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Hasło musi zawierać co najmniej jedną małą literę"
      )
    }
  })

  it("rejects passwords missing a digit", () => {
    const result = PasswordSchema.safeParse("Password!!!")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Hasło musi zawierać co najmniej jedną cyfrę"
      )
    }
  })

  it("rejects passwords missing a special character", () => {
    const result = PasswordSchema.safeParse("Password123")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Hasło musi zawierać co najmniej jeden znak specjalny"
      )
    }
  })
})

describe("LoginSchema", () => {
  it("accepts valid login input", () => {
    const validInput = {
      email: "testuser@example.com",
      password: "Password123!",
    }

    const result = LoginSchema.shape.POST.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects password shorter than 8 characters", () => {
    const invalidInput = {
      email: "testuser@example.com",
      password: "1234567",
    }

    const result = LoginSchema.shape.POST.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Hasło musi mieć co najmniej 8 znaków"
      )
    }
  })

  it("rejects invalid emails", () => {
    const invalidInput = {
      email: "invalid@email",
      password: "Password123!",
    }

    const result = LoginSchema.shape.POST.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nieprawidłowy adres email")
    }
  })

  it("accepts valid email", () => {
    const validInput = {
      email: "validEmail@example.com",
      password: "Password123!",
    }

    const result = LoginSchema.shape.POST.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("has null output schema", () => {
    const result = LoginSchema.shape.POST.shape.output.safeParse(null)

    expect(result.success).toBe(true)
  })

  it("rejects non-null output", () => {
    const invalidOutput = { requiresTwoFactor: true }

    const result = LoginSchema.shape.POST.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })
})

describe("RegisterSchema", () => {
  it("accepts valid registration input", () => {
    const validInput = {
      fullName: "Test User",
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    }

    const result = FormRegisterSchema.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects mismatched confirmPassword", () => {
    const invalidInput = {
      fullName: "Test User",
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Different123!",
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
      password: "Password123!",
      confirmPassword: "Password123!",
    }

    const result = FormRegisterSchema.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("rejects short fullName", () => {
    const invalidInput = {
      fullName: "A",
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
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
    const result = RegisterSchema.shape.POST.shape.output.safeParse(null)

    expect(result.success).toBe(true)
  })
})

describe("Verify2FASchema", () => {
  it("accepts valid authenticator input", () => {
    const validInput = {
      method: "AUTHENTICATOR" as const,
      code: "123456",
    }

    const result = Verify2FASchema.shape.POST.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("accepts valid SMS input", () => {
    const validInput = {
      method: "SMS" as const,
      code: "123456",
    }

    const result = Verify2FASchema.shape.POST.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("accepts valid email input", () => {
    const validInput = {
      method: "EMAIL" as const,
      code: "123456",
    }

    const result = Verify2FASchema.shape.POST.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects invalid method", () => {
    const invalidInput = {
      method: "invalid",
      code: "123456",
    }

    const result =
      Verify2FASchema.shape.POST.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("rejects code that is not 6 characters", () => {
    const invalidInput = {
      method: "AUTHENTICATOR" as const,
      code: "12345",
    }

    const result =
      Verify2FASchema.shape.POST.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Kod musi mieć dokładnie 6 cyfr"
      )
    }
  })

  it("rejects code longer than 6 characters", () => {
    const invalidInput = {
      method: "AUTHENTICATOR" as const,
      code: "1234567",
    }

    const result =
      Verify2FASchema.shape.POST.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("has null output schema", () => {
    const result = Verify2FASchema.shape.POST.shape.output.safeParse(null)

    expect(result.success).toBe(true)
  })
})

describe("Resend2FASchema", () => {
  it("accepts valid SMS method", () => {
    const validInput = {
      method: "SMS" as const,
    }

    const result = Resend2FASchema.shape.POST.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("accepts valid email method", () => {
    const validInput = {
      method: "EMAIL" as const,
    }

    const result = Resend2FASchema.shape.POST.shape.input.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it("rejects authenticator method (not valid for resend)", () => {
    const invalidInput = {
      method: "AUTHENTICATOR",
    }

    const result =
      Resend2FASchema.shape.POST.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("rejects invalid method", () => {
    const invalidInput = {
      method: "invalid",
    }

    const result =
      Resend2FASchema.shape.POST.shape.input.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })

  it("has null output schema", () => {
    const result = Resend2FASchema.shape.POST.shape.output.safeParse(null)

    expect(result.success).toBe(true)
  })
})

describe("ApiMeSchema", () => {
  it("accepts valid user data", () => {
    const validOutput = {
      id: 1,
      email: "user@example.com",
      full_name: "Test User",
      account_status: "ACTIVE",
      role: "USER",
    }

    const result = ApiMeSchema.shape.GET.shape.output.safeParse(validOutput)

    expect(result.success).toBe(true)
  })

  it("accepts user data with nullable full_name", () => {
    const validOutput = {
      id: 1,
      email: "user@example.com",
      full_name: null,
      account_status: "ACTIVE",
      role: "ADMIN",
    }

    const result = ApiMeSchema.shape.GET.shape.output.safeParse(validOutput)

    expect(result.success).toBe(true)
  })

  it("rejects invalid email format", () => {
    const invalidOutput = {
      id: 1,
      email: "not-an-email",
      full_name: null,
      account_status: "ACTIVE",
      role: "USER",
    }

    const result = ApiMeSchema.shape.GET.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })

  it("rejects non-number id", () => {
    const invalidOutput = {
      id: "not-a-number",
      email: "user@example.com",
      full_name: null,
      account_status: "ACTIVE",
      role: "USER",
    }

    const result = ApiMeSchema.shape.GET.shape.output.safeParse(invalidOutput)
    expect(result.success).toBe(false)
  })

  it("rejects invalid account_status", () => {
    const invalidOutput = {
      id: 1,
      email: "user@example.com",
      full_name: null,
      account_status: "VERIFIED",
      role: "USER",
    }

    const result = ApiMeSchema.shape.GET.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })

  it("rejects missing required fields", () => {
    const invalidOutput = {
      id: 1,
      email: "user@example.com",
    }

    const result = ApiMeSchema.shape.GET.shape.output.safeParse(invalidOutput)

    expect(result.success).toBe(false)
  })
})
