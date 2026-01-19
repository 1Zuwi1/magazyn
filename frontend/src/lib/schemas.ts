import z from "zod"
import type { TranslatorFor } from "@/types/translation"
import { createApiSchema } from "./create-api-schema"

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 20
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_BYTES = 72
const FULL_NAME_MIN_LENGTH = 2
const CODE_LENGTH = 6

export const createAuthSchemas = (t: TranslatorFor<"auth">) => {
  const usernameSchema = z
    .string()
    .min(
      USERNAME_MIN_LENGTH,
      t("validation.username.min", { min: USERNAME_MIN_LENGTH })
    )
    .max(
      USERNAME_MAX_LENGTH,
      t("validation.username.max", { max: USERNAME_MAX_LENGTH })
    )
    .regex(USERNAME_REGEX, t("validation.username.format"))

  const passwordSchema = z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      t("validation.password.min", { min: PASSWORD_MIN_LENGTH })
    )
    .refine(
      (value) => {
        const bytes = new TextEncoder().encode(value).length
        return bytes <= PASSWORD_MAX_BYTES
      },
      t("validation.password.maxBytes", { max: PASSWORD_MAX_BYTES })
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
            .min(
              FULL_NAME_MIN_LENGTH,
              t("validation.fullName.min", { min: FULL_NAME_MIN_LENGTH })
            ),
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
          .length(
            CODE_LENGTH,
            t("validation.code.length", { length: CODE_LENGTH })
          ),
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
