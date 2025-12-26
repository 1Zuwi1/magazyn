import z from "zod"
import { createApiSchema } from "./create-api-schema"

export const LoginSchema = createApiSchema({
  POST: {
    input: z.object({
      email: z.email("Nieprawidłowy adres email"),
      // TODO: Add more password rules
      password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
      rememberMe: z.boolean("Pole zapamiętaj mnie musi być wartością logiczną"),
    }),
    output: z.object({
      requiresTwoFactor: z.boolean(),
    }),
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
    }),
  },
})
