import z from "zod"
import { OTP_LENGTH } from "@/config/constants"
import { createApiSchema } from "./create-api-schema"

const txtEncoder = new TextEncoder()

export const TFAMethods = z.enum(["AUTHENTICATOR", "EMAIL", "PASSKEYS"])
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
    output: z.null(),
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
      keyName: z
        .string()
        .min(1, "Nazwa klucza jest wymagana")
        .max(50, "Nazwa jest za długa"),
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

const TFAAuthenticatorStartOutputSchema = z.object({
  secretKey: z.string(),
  email: z.email(),
  issuer: z.string(),
})

export const TFAAuthenticatorStartSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: TFAAuthenticatorStartOutputSchema,
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

export const TFARemoveMethodSchema = createApiSchema({
  DELETE: {
    input: z.object({
      method: TFAMethods,
    }),
    output: z.null(),
  },
})

// Passkeys API schemas
const PasskeySchema = z.object({
  id: z.number(),
  name: z.string(),
})

export type Passkey = z.infer<typeof PasskeySchema>

export const PasskeysSchema = createApiSchema({
  GET: {
    output: z.array(PasskeySchema),
  },
})

export const PasskeyDeleteSchema = createApiSchema({
  DELETE: {
    input: z.null(),
    output: z.null(),
  },
})

export const PasskeyRenameSchema = createApiSchema({
  PUT: {
    input: z.object({
      name: z
        .string()
        .min(1, "Nazwa jest wymagana")
        .max(50, "Nazwa jest za długa"),
    }),
    output: z.null(),
  },
})

const createPaginatedSchema = <T extends z.ZodType>(itemSchema: T) => {
  return z.object({
    content: z.array(itemSchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
  })
}

const createPaginatedSchemaInput = <T extends z.ZodType | undefined>(
  itemSchema?: T
) => {
  return z.object({
    ...itemSchema,
    page: z.number().int().nonnegative().optional(),
    size: z.number().int().nonnegative().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  })
}

export type PaginatedResponse<T extends z.ZodType> = z.infer<
  ReturnType<typeof createPaginatedSchema<T>>
>
export type PaginatedRequest<T extends z.ZodType | undefined = undefined> =
  z.infer<ReturnType<typeof createPaginatedSchemaInput<T>>>

const WarehouseSchema = z.object({
  freeSlots: z.number().int().nonnegative(),
  id: z.number().int().nonnegative(),
  name: z.string(),
  occupiedSlots: z.number().int().nonnegative(),
  racksCount: z.number().int().nonnegative(),
})

export type Warehouse = z.infer<typeof WarehouseSchema>

export const WarehousesSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput(),
    output: createPaginatedSchema(WarehouseSchema),
  },
})

export const WarehouseDetailsSchema = createApiSchema({
  GET: {
    output: WarehouseSchema,
  },
})

export const AssortmentSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput(
      z.object({
        search: z.string(),
      })
    ),
    output: createPaginatedSchema(
      z.object({
        id: z.number().int().nonnegative(),
        barcode: z.string(),
        itemId: z.number().int().nonnegative(),
        rackId: z.number().int().nonnegative(),
        userId: z.number().int().nonnegative(),
        createdAt: z.string(),
        expiresAt: z.string(),
        positionX: z.number().int().nonnegative(),
        positionY: z.number().int().nonnegative(),
      })
    ),
  },
})

const ItemDefinitionSchema = z.object({
  id: z.number().int().nonnegative(),
  barcode: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number(),
  sizeX: z.number(),
  sizeY: z.number(),
  sizeZ: z.number(),
  comment: z.string().nullable(),
  expireAfterDays: z.number(),
  dangerous: z.boolean(),
})

export const ItemsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput(),
    output: createPaginatedSchema(ItemDefinitionSchema),
  },
})

const RackSchema = z.object({
  id: z.number().int().nonnegative(),
  marker: z.string().nullable(),
  warehouseId: z.number().int().nonnegative(),
  comment: z.string().nullable(),
  sizeX: z.number().int().nonnegative(),
  sizeY: z.number().int().nonnegative(),
  maxTemp: z.number(),
  minTemp: z.number(),
  maxWeight: z.number(),
  maxSizeX: z.number(),
  maxSizeY: z.number(),
  maxSizeZ: z.number(),
  acceptsDangerous: z.boolean(),
})

export const RacksSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput(),
    output: createPaginatedSchema(RackSchema),
  },
})

export const RackDetailsSchema = createApiSchema({
  GET: {
    output: RackSchema,
  },
})
