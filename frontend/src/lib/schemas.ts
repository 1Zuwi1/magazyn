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
  PATCH: {
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
      method: TFAMethods.exclude(["EMAIL"], "Cannot remove email 2FA method"),
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

interface EmptyAdditionalSchemas extends Record<never, z.ZodType> {}

type PaginatedSchemaObject<
  TItem extends z.ZodType,
  TAdditional extends z.ZodRawShape = EmptyAdditionalSchemas,
> = z.ZodObject<
  {
    content: z.ZodArray<TItem>
    page: z.ZodNumber
    size: z.ZodNumber
    totalElements: z.ZodNumber
    totalPages: z.ZodNumber
    first: z.ZodBoolean
    last: z.ZodBoolean
  } & TAdditional
>

type PaginatedInputSchemaObject<
  TAdditional extends z.ZodRawShape = EmptyAdditionalSchemas,
> = z.ZodObject<
  {
    page: z.ZodOptional<z.ZodNumber>
    size: z.ZodOptional<z.ZodNumber>
    sortBy: z.ZodOptional<z.ZodString>
    sortDir: z.ZodOptional<z.ZodEnum<{ asc: "asc"; desc: "desc" }>>
  } & TAdditional
>

function createPaginatedSchema<TItem extends z.ZodType>(
  itemSchema: TItem
): PaginatedSchemaObject<TItem>

function createPaginatedSchema<
  TItem extends z.ZodType,
  TAdditional extends z.ZodRawShape,
>(
  itemSchema: TItem,
  additionalSchemas: TAdditional
): PaginatedSchemaObject<TItem, TAdditional>

function createPaginatedSchema<
  TItem extends z.ZodType,
  TAdditional extends z.ZodRawShape = EmptyAdditionalSchemas,
>(
  itemSchema: TItem,
  additionalSchemas?: TAdditional
): PaginatedSchemaObject<TItem, TAdditional> {
  const baseSchema = z.object({
    content: z.array(itemSchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
  })

  if (additionalSchemas) {
    return baseSchema.extend(additionalSchemas) as PaginatedSchemaObject<
      TItem,
      TAdditional
    >
  }

  return baseSchema as PaginatedSchemaObject<TItem, TAdditional>
}

function createPaginatedSchemaInput(): PaginatedInputSchemaObject

function createPaginatedSchemaInput<TAdditional extends z.ZodRawShape>(
  additionalSchemas: TAdditional
): PaginatedInputSchemaObject<TAdditional>

function createPaginatedSchemaInput<
  TAdditional extends z.ZodRawShape = EmptyAdditionalSchemas,
>(additionalSchemas?: TAdditional): PaginatedInputSchemaObject<TAdditional> {
  const baseSchema = z.object({
    page: z.number().int().nonnegative().optional(),
    size: z.number().int().nonnegative().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  })

  if (additionalSchemas) {
    return baseSchema.extend(
      additionalSchemas
    ) as PaginatedInputSchemaObject<TAdditional>
  }

  return baseSchema as PaginatedInputSchemaObject<TAdditional>
}

export type PaginatedResponse<
  TItem extends z.ZodType,
  TAdditional extends z.ZodRawShape = EmptyAdditionalSchemas,
> = z.output<PaginatedSchemaObject<TItem, TAdditional>>

export type PaginatedRequest<
  TAdditional extends z.ZodRawShape = EmptyAdditionalSchemas,
> = z.output<PaginatedInputSchemaObject<TAdditional>>

const AdminTeamSchema = z.enum([
  "OPERATIONS",
  "LOGISTICS",
  "WAREHOUSE",
  "INVENTORY",
  "QUALITY_CONTROL",
  "RECEIVING",
  "SHIPPING",
  "IT_SUPPORT",
  "MANAGEMENT",
])

const UserAccountStatusSchema = z.enum([
  "ACTIVE",
  "PENDING_VERIFICATION",
  "DISABLED",
  "LOCKED",
])

const AdminUserSchema = z.object({
  id: z.number().int().nonnegative(),
  full_name: z.string().nullable().optional(),
  email: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
  account_status: UserAccountStatusSchema,
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  team: z.string().nullable().optional(),
})

const TeamOptionSchema = z.object({
  value: AdminTeamSchema,
  label: z.string().min(1),
})

export const AdminUsersSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput(),
    output: createPaginatedSchema(AdminUserSchema),
  },
})

export const AdminUserTeamsSchema = createApiSchema({
  GET: {
    output: z.array(TeamOptionSchema),
  },
})

export const AdminUpdateUserProfileSchema = createApiSchema({
  PATCH: {
    input: z.object({
      phone: z
        .string()
        .max(20)
        .regex(/^[+\d\s()-]*$/)
        .optional(),
      fullName: z.string().trim().min(3).max(100).optional(),
      location: z.string().trim().max(100).optional(),
      team: AdminTeamSchema.optional(),
    }),
    output: z.null(),
  },
})

export const AdminChangeUserEmailSchema = createApiSchema({
  PATCH: {
    input: z.object({
      newEmail: z.email().min(1),
    }),
    output: z.null(),
  },
})

export const AdminDeleteUserSchema = createApiSchema({
  DELETE: {
    output: z.null(),
  },
})

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
    input: createPaginatedSchemaInput({
      nameFilter: z.string().optional(),
    }),
    output: createPaginatedSchema(WarehouseSchema),
  },
})

export const WarehouseDetailsSchema = createApiSchema({
  GET: {
    output: WarehouseSchema,
  },
})

export const CreateWarehouseSchema = createApiSchema({
  POST: {
    input: z.object({
      name: z.string().min(1),
    }),
    output: WarehouseDetailsSchema,
  },
})

export const DeleteWarehouseSchema = createApiSchema({
  DELETE: {
    output: z.null(),
  },
})

export const UpdateWarehouseSchema = createApiSchema({
  PUT: {
    input: z.object({
      name: z.string().min(1),
    }),
    output: WarehouseDetailsSchema,
  },
})

const AssortmentSchema = z.object({
  id: z.number().int().nonnegative(),
  code: z.string(),
  itemId: z.number().int().nonnegative(),
  rackId: z.number().int().nonnegative(),
  userId: z.number().int().nonnegative(),
  createdAt: z.string(),
  expiresAt: z.string(),
  positionX: z.number().int().nonnegative(),
  positionY: z.number().int().nonnegative(),
})

export const AssortmentsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput(),
    output: createPaginatedSchema(AssortmentSchema),
  },
})

export const AssortmentDetailsSchema = createApiSchema({
  GET: {
    output: AssortmentSchema,
  },
})

const ItemDefinitionSchema = z.object({
  id: z.number().int().nonnegative(),
  code: z.string(),
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
  marker: z.string(),
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
    output: createPaginatedSchema(RackSchema, {
      summary: z.object({
        totalCapacity: z.number().int().nonnegative(),
        freeSlots: z.number().int().nonnegative(),
        occupiedSlots: z.number().int().nonnegative(),
        totalWarehouses: z.number().int().nonnegative(),
        totalRacks: z.number().int().nonnegative(),
      }),
    }),
  },
})

export const RackDetailsSchema = createApiSchema({
  GET: {
    output: RackSchema,
  },
})

export const VerifyMailSchema = createApiSchema({
  POST: {
    input: z.object({
      token: z.string().min(1, "Token jest wymagany"),
    }),
    output: z.null(),
  },
})

export const ITEM_BY_CODE_SCHEMA = createApiSchema({
  GET: {
    output: z.object({
      id: z.number().int().nonnegative(),
      code: z.string(),
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
    }),
  },
})

export const INBOUND_OPERATION_PLAN_SCHEMA = createApiSchema({
  POST: {
    input: z.object({
      itemId: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
      warehouseId: z.number().int().nonnegative(),
      reserve: z.boolean(),
    }),
    output: z.object({
      itemId: z.number().int().nonnegative(),
      requestedQuantity: z.number().int().nonnegative(),
      allocatedQuantity: z.number().int().nonnegative(),
      remainingQuantity: z.number().int().nonnegative(),
      placements: z.array(
        z.object({
          rackId: z.number().int().nonnegative(),
          rackMarker: z.string(),
          positionX: z.number().int().nonnegative(),
          positionY: z.number().int().nonnegative(),
        })
      ),
      reserved: z.boolean(),
      reservedUntil: z.string().nullable(),
      reservedCount: z.number().int().nonnegative(),
    }),
  },
})

export const INBOUND_OPERATION_EXECUTE_SCHEMA = createApiSchema({
  POST: {
    input: z.object({
      itemId: z.number().int().nonnegative(),
      code: z.string().min(1),
      placements: z
        .array(
          z.object({
            rackId: z.number().int().nonnegative(),
            positionX: z.number().int().nonnegative(),
            positionY: z.number().int().nonnegative(),
          })
        )
        .min(1),
    }),
    output: z.unknown(),
  },
})
