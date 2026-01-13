import z from "zod"
import type { Namespace, TranslatorFor } from "@/types/translation"
import { createApiSchema } from "./create-api-schema"

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

export const createAuthSchemas = (t: TranslatorFor<Namespace>) => {
  const usernameSchema = z
    .string()
    .min(3, t("validation.username.min", { min: "3" }))
    .max(20, t("validation.username.max", { max: "20" }))
    .regex(USERNAME_REGEX, t("validation.username.format"))

  const passwordSchema = z
    .string()
    .min(6, t("validation.password.min", { min: "6" }))
    .refine(
      (value) => {
        const bytes = new TextEncoder().encode(value).length
        return bytes <= 72
      },
      t("validation.password.maxBytes", { max: "72" })
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
            .min(2, t("validation.fullName.min", { min: "2" })),
          username: usernameSchema,
          email: z.email(t("validation.email.invalid")),
          password: passwordSchema,
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("validation.password.mismatch"),
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
          .length(6, t("validation.code.length", { length: "6" })),
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
