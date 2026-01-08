import z from "zod"
import { createApiSchema } from "./create-api-schema"

const usernameSchema = z
  .string()
  .min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki")
  .max(20, "Nazwa użytkownika może mieć maksymalnie 20 znaków")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia"
  )

const passwordSchema = z
  .string()
  .min(6, "Hasło musi mieć co najmniej 6 znaków")
  .refine((value) => {
    const bytes = new TextEncoder().encode(value).length
    if (bytes > 72) {
      return false
    }
    return true
  }, "Hasło nie może przekraczać 72 bajtów w kodowaniu UTF-8.")

export const LoginSchema = createApiSchema({
  POST: {
    input: z.object({
      username: usernameSchema,
      password: passwordSchema,
    }),
    output: z.object({
      requiresTwoFactor: z.boolean(),
    }),
  },
})
export const RegisterSchema = createApiSchema({
  POST: {
    input: z
      .object({
        fullName: z
          .string()
          .min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki"),
        username: usernameSchema,
        email: z.email("Nieprawidłowy adres email"),
        password: passwordSchema,
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Hasła nie są zgodne",
        path: ["confirmPassword"],
      }),
    output: z.null(),
  },
})

export const Verify2FASchema = createApiSchema({
  POST: {
    input: z.object({
      method: z.enum(["authenticator", "sms", "email"]),
      code: z.string().length(6, "Kod musi mieć dokładnie 6 cyfr"),
    }),
    output: z.null(),
  },
})

export const Resend2FASchema = createApiSchema({
  POST: {
    input: z.object({
      method: z.enum(["sms", "email"]),
    }),
    output: z.null(),
  },
})

export const ApiMeSchema = createApiSchema({
  GET: {
    output: z.object({
      id: z.number(),
      email: z.email(),
      username: z.string(),
      full_name: z.string().nullable(),
      two_factor_enabled: z.boolean(),
      role: z.enum(["user", "admin"]),
    }),
  },
})
