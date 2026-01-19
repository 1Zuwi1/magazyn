import z from "zod"
import type { TranslatorFor } from "@/types/translation"
import { createApiSchema } from "./create-api-schema"

const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_BYTES = 72
const FULL_NAME_MIN_LENGTH = 2
const CODE_LENGTH = 6

const txtEncoder = new TextEncoder()
export const createAuthSchemas = (t: TranslatorFor<"auth">) => {
  const PasswordSchema = z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      t("validation.password.min", { min: PASSWORD_MIN_LENGTH })
    )
    .refine(
      (value) => {
        const bytes = txtEncoder.encode(value).length
        return bytes <= PASSWORD_MAX_BYTES
      },
      t("validation.password.maxBytes", { max: PASSWORD_MAX_BYTES })
    )

  const LoginSchema = createApiSchema({
    POST: {
      input: z.object({
        email: z.email(t("validation.email.invalid")),
        password: PasswordSchema,
      }),
      output: z.object({
        requiresTwoFactor: z.boolean(),
      }),
    },
  })
  const RegisterSchema = createApiSchema({
    POST: {
      input: z.object({
        fullName: z
          .string()
          .min(
            FULL_NAME_MIN_LENGTH,
            t("validation.fullName.min", { min: FULL_NAME_MIN_LENGTH })
          ),
        email: z.email(t("validation.email.invalid")),
        password: PasswordSchema,
      }),
      output: z.null(),
    },
  })

  const FormRegisterSchema = RegisterSchema.shape.POST.shape.input
    .extend({
      confirmPassword: PasswordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password.mismatch"),
      path: ["confirmPassowrd"],
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
    FormRegisterSchema,
  }
}

export const ApiMeSchema = createApiSchema({
  GET: {
    output: z.object({
      id: z.number(),
      email: z.email(),
      full_name: z.string().nullable(),
      two_factor_enabled: z.boolean(),
      status: z.enum(["verified", "unverified", "banned"]),
      role: z.enum(["user", "admin"]),
    }),
  },
})
