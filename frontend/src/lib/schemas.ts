import z from "zod"
import { OTP_LENGTH } from "@/config/constants"
import { createApiSchema } from "./create-api-schema"

const txtEncoder = new TextEncoder()

export const TFAMethods = z.enum(["AUTHENTICATOR", "SMS", "EMAIL", "PASSKEYS"])
export type TwoFactorMethod = z.infer<typeof TFAMethods>

export const ResendMethods = TFAMethods.exclude(["AUTHENTICATOR", "PASSKEYS"])
export type ResendType = z.infer<typeof ResendMethods>

export const PasswordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
  .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
  .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
  .regex(
    /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/,
    "Hasło musi zawierać co najmniej jeden znak specjalny"
  )
  .refine((value) => {
    const bytes = txtEncoder.encode(value).length
    return bytes <= 72
  }, "Hasło nie może przekraczać 72 bajtów w kodowaniu UTF-8.")

const OTPSchema = z
  .string()
  .nullable()
  .refine((val) => {
    if (val === null) {
      return true
    }
    return val.length === OTP_LENGTH
  }, `Kod 2FA musi mieć dokładnie ${OTP_LENGTH} znaków`)

export const Check2FASchema = createApiSchema({
  POST: {
    input: z.object({
      code: OTPSchema,
      method: TFAMethods,
    }),
    output: z.object({
      success: z.literal(true),
    }),
  },
})

export const ChangePasswordFormSchema = z
  .object({
    newPassword: PasswordSchema,
    oldPassword: z.string().min(1, "Obecne hasło jest wymagane"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  })

export const ChangePasswordSchema = createApiSchema({
  POST: {
    input: z.object({
      newPassword: PasswordSchema,
      oldPassword: z.string().min(1, "Obecne hasło jest wymagane"),
    }),
    output: z.null(),
  },
})

export const LoginSchema = createApiSchema({
  POST: {
    input: z.object({
      email: z.email("Nieprawidłowy adres email"),
      password: PasswordSchema,
      rememberMe: z.boolean(),
    }),
    output: z.null(),
  },
})
export const RegisterSchema = createApiSchema({
  POST: {
    input: z.object({
      fullName: z
        .string()
        .min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki"),
      email: z.email("Nieprawidłowy adres email"),
      password: PasswordSchema,
    }),
    output: z.null(),
  },
})

function sanitizeCreationOptionsJSON(
  optionsJSON: PublicKeyCredentialCreationOptionsJSON
) {
  if (!optionsJSON?.excludeCredentials) {
    return optionsJSON
  }

  return {
    ...optionsJSON,
    excludeCredentials: optionsJSON.excludeCredentials.map((cred) => {
      const out = { ...cred }

      // WebAuthn JSON parsing hates null here: must be array or absent
      if (out.transports == null) {
        out.transports = undefined
      } else if (!Array.isArray(out.transports)) {
        // If something weird got in here, force it to a valid type
        out.transports = []
      }

      return out
    }),
  }
}

export const WebAuthnStartRegistrationSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: z
      .custom<PublicKeyCredentialCreationOptionsJSON>()
      .transform((data, ctx) => {
        try {
          return PublicKeyCredential.parseCreationOptionsFromJSON(
            sanitizeCreationOptionsJSON(data)
          )
        } catch (err) {
          ctx.addIssue({
            code: "custom",
            message:
              "Invalid WebAuthn creation options JSON" +
              (err instanceof Error ? `: ${err.message}` : ""),
          })
          return z.NEVER
        }
      }),
  },
})

export const WebAuthnFinishRegistrationSchema = createApiSchema({
  POST: {
    input: z.object({
      credentialJson: z.string().min(1, "Credential JSON jest wymagany"),
    }),
    output: z.null(),
  },
})

export const WebAuthnStartAssertionSchema = createApiSchema({
  POST: {
    input: z.object({}),
    output: z.object({
      challenge: z.string(),
    }),
  },
})

export const WebAuthnFinishAssertionSchema = createApiSchema({
  POST: {
    input: z.object({
      credentialJson: z.string().min(1, "Credential JSON jest wymagany"),
    }),
    output: z.null(),
  },
})

export const FormRegisterSchema = RegisterSchema.shape.POST.shape.input
  .extend({
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  })

export const Verify2FASchema = createApiSchema({
  POST: {
    input: z.object({
      method: TFAMethods,
      code: z.string().length(6, "Kod musi mieć dokładnie 6 cyfr"),
    }),
    output: z.null(),
  },
})

export const Resend2FASchema = createApiSchema({
  POST: {
    input: z.object({
      method: ResendMethods,
    }),
    output: z.null(),
  },
})

export const ApiMeSchema = createApiSchema({
  GET: {
    output: z.object({
      id: z.number(),
      email: z.email(),
      full_name: z.string().nullish(),
      account_status: z.enum([
        "ACTIVE",
        "PENDING_VERIFICATION",
        "DISABLED",
        "LOCKED",
      ]),
      role: z.enum(["USER", "ADMIN"]),
    }),
  },
})

export const TFASchema = createApiSchema({
  GET: {
    output: z.object({
      defaultMethod: TFAMethods,
      methods: z.array(TFAMethods),
    }),
  },
})

export const TFADefaultMethodSchema = createApiSchema({
  PATCH: {
    input: z.object({
      method: TFAMethods,
    }),
    output: z.null(),
  },
})

export const PasskeysSchema = createApiSchema({
  GET: {
    output: z.any(),
  },
})
