import z from "zod"
import { createApiSchema } from "./create-api-schema"

type Translator = (
  key: string,
  values?: Record<string, string | number>
) => string

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

export const createAuthSchemas = (t: Translator) => {
  const usernameSchema = z
    .string()
    .min(3, t("auth.validation.username.min", { min: 3 }))
    .max(20, t("auth.validation.username.max", { max: 20 }))
    .regex(USERNAME_REGEX, t("auth.validation.username.format"))

  const passwordSchema = z
    .string()
    .min(6, t("auth.validation.password.min", { min: 6 }))
    .refine(
      (value) => {
        const bytes = new TextEncoder().encode(value).length
        return bytes <= 72
      },
      t("auth.validation.password.maxBytes", { max: 72 })
    )

  const LoginSchema = createApiSchema({
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
  const RegisterSchema = createApiSchema({
    POST: {
      input: z
        .object({
          fullName: z
            .string()
            .min(2, t("auth.validation.fullName.min", { min: 2 })),
          username: usernameSchema,
          email: z.email(t("auth.validation.email.invalid")),
          password: passwordSchema,
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("auth.validation.password.mismatch"),
          path: ["confirmPassword"],
        }),
      output: z.null(),
    },
  })

  const Verify2FASchema = createApiSchema({
    POST: {
      input: z.object({
        method: z.enum(["authenticator", "sms", "email"]),
        code: z
          .string()
          .length(6, t("auth.validation.code.length", { length: 6 })),
      }),
      output: z.null(),
    },
  })

  const Resend2FASchema = createApiSchema({
    POST: {
      input: z.object({
        method: z.enum(["sms", "email"]),
      }),
      output: z.null(),
    },
  })

  return {
    LoginSchema,
    RegisterSchema,
    Verify2FASchema,
    Resend2FASchema,
  }
}

export const ApiMeSchema = createApiSchema({
  GET: {
    output: z.object({
      id: z.number(),
      email: z.email(),
      username: z.string(),
      full_name: z.string().nullable(),
      two_factor_enabled: z.boolean(),
      status: z.enum(["verified", "unverified", "banned"]),
      role: z.enum(["user", "admin"]),
    }),
  },
})
