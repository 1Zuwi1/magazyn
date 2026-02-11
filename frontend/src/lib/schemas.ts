import z from "zod"
import { OTP_LENGTH } from "@/config/constants"
import type { AppTranslate } from "@/i18n/use-translations"
import { createApiSchema } from "./create-api-schema"
import { AlertSchema } from "./schemas/monitoring-schemas"
import { createZodMessage } from "./zod-message"

const txtEncoder = new TextEncoder()

export const TFAMethods = z.enum([
  "AUTHENTICATOR",
  "EMAIL",
  "PASSKEYS",
  "BACKUP_CODES",
])
export type TwoFactorMethod = z.infer<typeof TFAMethods>
export type RemovableTwoFactorMethod = Exclude<TwoFactorMethod, "EMAIL">

export const ResendMethods = TFAMethods.exclude(["AUTHENTICATOR", "PASSKEYS"])
export type ResendType = z.infer<typeof ResendMethods>

export const PasswordSchema = z
  .string()
  .min(8, createZodMessage("generated.validation.passwordMustLeast8Characters"))
  .regex(
    /[A-Z]/,
    createZodMessage("generated.validation.passwordMustContainLeastOne")
  )
  .regex(
    /[a-z]/,
    createZodMessage(
      "generated.validation.passwordMustContainLeastOneLowercase"
    )
  )
  .regex(
    /[0-9]/,
    createZodMessage("generated.validation.passwordMustContainLeastOneDigit")
  )
  .regex(
    /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/,
    createZodMessage("generated.validation.passwordMustContainLeastOneSpecial")
  )
  .refine((value) => {
    const bytes = txtEncoder.encode(value).length
    return bytes <= 72
  }, createZodMessage("generated.validation.passwordCannotExceed72Bytes"))

const OTPSchema = z
  .string()
  .nullable()
  .refine(
    (val) => {
      if (val === null) {
        return true
      }
      return val.length === OTP_LENGTH
    },
    createZodMessage("generated.validation.value2faCodeMustExactly", {
      value0: OTP_LENGTH,
    })
  )

export const Check2FASchema = createApiSchema({
  POST: {
    input: z.object({
      code: OTPSchema,
      method: TFAMethods,
    }),
    output: z.null(),
  },
})

export const BackupCodesGenerateSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: z.array(z.string()),
  },
})

export const ChangePasswordFormSchema = z
  .object({
    newPassword: PasswordSchema,
    oldPassword: z
      .string()
      .min(1, createZodMessage("generated.validation.currentPasswordRequired")),
    confirmPassword: z
      .string()
      .min(
        1,
        createZodMessage("generated.validation.passwordConfirmationRequired")
      ),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: createZodMessage("generated.shared.passwordsMatch"),
    path: ["confirmPassword"],
  })

export const ChangePasswordSchema = createApiSchema({
  PATCH: {
    input: z.object({
      newPassword: PasswordSchema,
      oldPassword: z
        .string()
        .min(
          1,
          createZodMessage("generated.validation.currentPasswordRequired")
        ),
    }),
    output: z.null(),
  },
})

export const LoginSchema = createApiSchema({
  POST: {
    input: z.object({
      email: z.email(
        createZodMessage("generated.validation.invalidEmailAddress")
      ),
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
        .min(2, createZodMessage("generated.validation.fullNameMustLeast2")),
      email: z.email(
        createZodMessage("generated.validation.invalidEmailAddress")
      ),
      password: PasswordSchema,
      phoneNumber: z.e164(
        createZodMessage("generated.validation.invalidPhoneNumber")
      ),
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
        .max(50, createZodMessage("generated.validation.nameTooLong")),
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
    message: createZodMessage("generated.shared.passwordsMatch"),
    path: ["confirmPassword"],
  })

export const Verify2FASchema = createApiSchema({
  POST: {
    input: z.object({
      method: TFAMethods,
      code: z
        .string()
        .min(1, createZodMessage("generated.validation.codeRequired")),
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

export const TFAAuthenticatorFinishSchema = createApiSchema({
  POST: {
    input: z.object({
      code: z
        .string()
        .length(
          6,
          createZodMessage("generated.validation.codeMustExactly6Digits")
        ),
    }),
    output: z.null(),
  },
})

const UserSchema = z.object({
  id: z.number().int().nonnegative(),
  full_name: z.string(),
  email: z.email(),
  role: z.enum(["USER", "ADMIN"]),
  account_status: z.enum([
    "ACTIVE",
    "PENDING_VERIFICATION",
    "DISABLED",
    "LOCKED",
  ]),
  phone: z.string().nullish(),
  location: z.string(),
  team: z.string().nullish(),
  last_login: z.string().nullish(),
  warehouse_ids: z.array(z.number().int().nonnegative()),
  backup_codes_refresh_needed: z.boolean(),
})

export type User = z.infer<typeof UserSchema>

export const ApiMeSchema = createApiSchema({
  GET: {
    output: UserSchema,
  },
})

export const LogoutSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: z.null(),
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
        .max(50, createZodMessage("generated.validation.nameTooLong")),
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

export function createPaginatedSchema<TItem extends z.ZodType>(
  itemSchema: TItem
): PaginatedSchemaObject<TItem>

export function createPaginatedSchema<
  TItem extends z.ZodType,
  TAdditional extends z.ZodRawShape,
>(
  itemSchema: TItem,
  additionalSchemas: TAdditional
): PaginatedSchemaObject<TItem, TAdditional>

export function createPaginatedSchema<
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

export function createPaginatedSchemaInput(): PaginatedInputSchemaObject

export function createPaginatedSchemaInput<TAdditional extends z.ZodRawShape>(
  additionalSchemas: TAdditional
): PaginatedInputSchemaObject<TAdditional>

export function createPaginatedSchemaInput<
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
  full_name: z.string().nullish(),
  email: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
  account_status: UserAccountStatusSchema,
  phone: z.string().nullish(),
  location: z.string().nullish(),
  team: z.string().nullish(),
  warehouse_ids: z.array(z.number().int().nonnegative()).default([]),
})

const TeamOptionSchema = z.object({
  value: AdminTeamSchema,
})

const ImportErrorSchema = z.object({
  lineNumber: z.number().int().nonnegative(),
  message: z.string(),
  rawLine: z.string().nullish(),
})

const ImportReportSchema = z.object({
  processedLines: z.number().int().nonnegative(),
  imported: z.number().int().nonnegative(),
  errors: z.array(ImportErrorSchema),
})

export const AdminUsersSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      name: z.string().nullish(),
      email: z.string().nullish(),
      status: UserAccountStatusSchema.nullish(),
    }),
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
        .nullish(),
      fullName: z.string().trim().min(3).max(100).nullish(),
      location: z.string().trim().max(100).nullish(),
      team: AdminTeamSchema.nullish(),
    }),
    output: z.null(),
  },
})

export const AdminUpdateUserStatusSchema = createApiSchema({
  PATCH: {
    input: z.object({
      status: UserAccountStatusSchema,
      reason: z.string().trim().max(500).nullish(),
    }),
    output: z.null(),
  },
})

export const AdminUsersWarehouseAssignmentSchema = createApiSchema({
  POST: {
    input: z.object({
      userId: z.number().int().nonnegative(),
      warehouseId: z.number().int().nonnegative(),
    }),
    output: z.null(),
  },
  DELETE: {
    input: z.object({
      userId: z.number().int().nonnegative(),
      warehouseId: z.number().int().nonnegative(),
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
  occupancy: z.number().int().min(0).max(100),
})

export type Warehouse = z.infer<typeof WarehouseSchema>

export const WarehousesSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      nameFilter: z.string().nullish(),
      minPercentOfOccupiedSlots: z.number().int().min(0).max(100).nullish(),
      onlyNonEmpty: z.boolean().nullish(),
    }),
    output: createPaginatedSchema(WarehouseSchema, {
      summary: z.object({
        occupancy: z.number().int().min(0).max(100),
        totalCapacity: z.number().int().nonnegative(),
        freeSlots: z.number().int().nonnegative(),
        occupiedSlots: z.number().int().nonnegative(),
        totalWarehouses: z.number().int().nonnegative(),
        totalRacks: z.number().int().nonnegative(),
      }),
    }),
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
      name: z.string().trim().min(3).max(100),
    }),
    output: WarehouseSchema,
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
      name: z.string().trim().min(3).max(100),
    }),
    output: WarehouseSchema,
  },
})

export const WarehouseImportSchema = createApiSchema({
  POST: {
    input: z.object({
      file: z.custom<File>(),
    }),
    output: ImportReportSchema,
  },
})

export const ItemImageSchema = z.object({
  id: z.number().int().nonnegative(),
  itemId: z.number().int().nonnegative(),
  photoUrl: z.string(),
  displayOrder: z.number().int().nonnegative(),
  hasEmbedding: z.boolean(),
  createdAt: z.string(),
  primary: z.boolean(),
})

export const ItemDefinitionSchema = z.object({
  id: z.number().int().nonnegative(),
  code: z.string(),
  qrCode: z.string().nullish(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number(),
  sizeX: z.number(),
  sizeY: z.number(),
  sizeZ: z.number(),
  comment: z.string().nullable(),
  expireAfterDays: z.number().int().nonnegative(),
  imageUploaded: z.boolean().nullish(),
  imageCount: z.number().int().nonnegative().nullish(),
  images: z.array(ItemImageSchema).nullish(),
  dangerous: z.boolean(),
})

const AssortmentSchema = z.object({
  id: z.number().int().nonnegative(),
  code: z.string(),
  rackId: z.number().int().nonnegative(),
  userId: z.number().int().nonnegative(),
  itemId: z.number().int().nonnegative(),
  createdAt: z.string(),
  expiresAt: z.string(),
  positionX: z.number().int().nonnegative(),
  positionY: z.number().int().nonnegative(),
})

const RackAssortmentSchema = AssortmentSchema.omit({ itemId: true }).extend({
  item: ItemDefinitionSchema,
})

export type Assortment = z.infer<typeof AssortmentSchema>
export type RackAssortment = z.infer<typeof RackAssortmentSchema>

export const WarehouseAssortmentsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      expiryFilters: z
        .array(z.enum(["ALL", "EXPIRED", "DAYS_3", "DAYS_7", "DAYS_14"]))
        .nullish(),
      search: z.string().nullish(),
      weekToExpire: z.boolean().nullish(),
    }),
    output: createPaginatedSchema(RackAssortmentSchema),
  },
})

export const AssortmentsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      expiryFilters: z
        .array(z.enum(["ALL", "EXPIRED", "DAYS_3", "DAYS_7", "DAYS_14"]))
        .nullish(),
      search: z.string().nullish(),
      weekToExpire: z.boolean().nullish(),
    }),
    output: createPaginatedSchema(AssortmentSchema),
  },
})

export const RackAssortmentsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      search: z.string().nullish(),
      positionX: z.number().int().nonnegative().nullish(),
      positionY: z.number().int().nonnegative().nullish(),
      weekToExpire: z.boolean().nullish(),
    }),
    output: createPaginatedSchema(RackAssortmentSchema),
  },
})

export const AssortmentDetailsSchema = createApiSchema({
  GET: {
    output: AssortmentSchema,
  },
})

export const UpdateAssortmentSchema = createApiSchema({
  PUT: {
    input: AssortmentSchema.pick({
      itemId: true,
      rackId: true,
      expiresAt: true,
    }),
    output: AssortmentSchema,
  },
})

export const ItemsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      search: z.string().nullish(),
      dangerous: z.boolean().nullish(),
      minTempFrom: z.number().nullish(),
      minTempTo: z.number().nullish(),
      maxTempFrom: z.number().nullish(),
      maxTempTo: z.number().nullish(),
      weightFrom: z.number().nullish(),
      weightTo: z.number().nullish(),
      expireAfterDaysFrom: z.number().int().nonnegative().nullish(),
      expireAfterDaysTo: z.number().int().nonnegative().nullish(),
    }),
    output: createPaginatedSchema(ItemDefinitionSchema),
  },
})

export const ItemDetailsSchema = createApiSchema({
  GET: {
    output: ItemDefinitionSchema,
  },
})

const ItemMutationInputSchema = z.object({
  name: z.string().trim().max(255).nullish(),
  qrCode: z.string().trim().max(32).nullish(),
  minTemp: z.number().min(-273.15),
  maxTemp: z.number().min(-273.15),
  weight: z.number().nonnegative(),
  sizeX: z.number().nonnegative(),
  sizeY: z.number().nonnegative(),
  sizeZ: z.number().nonnegative(),
  comment: z.string().trim().max(1000).nullish(),
  expireAfterDays: z.number().int().nonnegative(),
  dangerous: z.boolean(),
})

export const CreateItemSchema = createApiSchema({
  POST: {
    input: ItemMutationInputSchema,
    output: ItemDefinitionSchema,
  },
})

export const UpdateItemSchema = createApiSchema({
  PUT: {
    input: ItemMutationInputSchema,
    output: ItemDefinitionSchema,
  },
})

export const DeleteItemSchema = createApiSchema({
  DELETE: {
    output: z.null(),
  },
})

export const UploadItemPhotoSchema = createApiSchema({
  POST: {
    input: z.object({ photo: z.instanceof(File) }),
    output: z.string(),
  },
})

export const ItemPhotosSchema = createApiSchema({
  GET: {
    output: z.array(ItemImageSchema),
  },
  POST: {
    input: z.object({ file: z.instanceof(File) }),
    output: ItemImageSchema,
  },
})

export const BatchUploadPhotoSchema = createApiSchema({
  POST: {
    input: z.object({ files: z.array(z.instanceof(File)) }),
    output: z.array(z.string()),
  },
})

export const SetPrimaryItemPhotoSchema = createApiSchema({
  PUT: {
    input: z.null(),
    output: z.null(),
  },
})

export const DeleteItemPhotoSchema = createApiSchema({
  DELETE: {
    output: z.null(),
  },
})

export const DownloadItemPhotoSchema = createApiSchema({
  GET: {
    output: z.instanceof(Blob),
  },
})

export const DownloadItemPhotoByImageIdSchema = createApiSchema({
  GET: {
    output: z.instanceof(Blob),
  },
})

export const GenerateItemEmbeddingsSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: z.null(),
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
  occupiedSlots: z.number().int().nonnegative(),
  freeSlots: z.number().int().nonnegative(),
  totalSlots: z.number().int().nonnegative(),
  totalWeight: z.number().nonnegative(),
})

export type Rack = z.infer<typeof RackSchema>

export const RackLookupSchema = createApiSchema({
  GET: {
    output: RackSchema,
  },
})

export const RacksSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput(),
    output: createPaginatedSchema(RackSchema, {
      summary: z.object({
        totalCapacity: z.number().int().nonnegative(),
        freeSlots: z.number().int().nonnegative(),
        occupiedSlots: z.number().int().nonnegative(),
        totalRacks: z.number().int().nonnegative(),
        totalWeight: z.number().nonnegative(),
      }),
    }),
  },
})

export const RackDetailsSchema = createApiSchema({
  GET: {
    output: RackSchema,
  },
  POST: {
    input: RackSchema.omit({
      id: true,
      occupiedSlots: true,
      freeSlots: true,
      totalSlots: true,
      totalWeight: true,
    }),
    output: RackSchema,
  },
  PUT: {
    input: RackSchema.omit({
      id: true,
      occupiedSlots: true,
      freeSlots: true,
      totalSlots: true,
      totalWeight: true,
    }),
    output: RackSchema,
  },
})

export const DeleteRackSchema = createApiSchema({
  DELETE: {
    output: z.null(),
  },
})

export const RackImportSchema = createApiSchema({
  POST: {
    input: z.object({
      file: z.custom<File>(),
    }),
    output: ImportReportSchema,
  },
})

export const ItemImportSchema = createApiSchema({
  POST: {
    input: z.object({
      file: z.custom<File>(),
    }),
    output: ImportReportSchema,
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

export const ItemByCodeSchema = createApiSchema({
  GET: {
    output: ItemDefinitionSchema,
  },
})

export const InboundOperationPlanSchema = createApiSchema({
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

const IdentificationCandidateSchema = z.object({
  itemId: z.number().int().nonnegative(),
  itemName: z.string(),
  code: z.string(),
  photoUrl: z.string().nullable(),
  weight: z.number(),
  isDangerous: z.boolean(),
  cosineDistance: z.number(),
  similarityScore: z.number(),
  rank: z.number().int().nonnegative(),
})

export type IdentificationCandidate = z.infer<
  typeof IdentificationCandidateSchema
>

const IdentificationResultSchema = z.object({
  identificationId: z.string(),
  itemId: z.number().int().nonnegative().nullable(),
  itemName: z.string().nullable(),
  code: z.string().nullable(),
  similarityScore: z.number(),
  confidentMatch: z.boolean(),
  confidenceLevel: z.string(),
  needsVerification: z.boolean(),
  message: z.string(),
  candidates: z.array(IdentificationCandidateSchema),
  candidateCount: z.number().int().nonnegative(),
  excludedItemIds: z.array(z.number().int()),
})

export type IdentificationResult = z.infer<typeof IdentificationResultSchema>

export const ItemIdentifySchema = createApiSchema({
  POST: {
    input: z.object({
      file: z.custom<File>(),
    }),
    output: IdentificationResultSchema,
  },
})

export const ItemIdentifyMismatchSchema = createApiSchema({
  POST: {
    input: z.object({
      identificationId: z.string(),
      rejectedItemId: z.number().int().nonnegative(),
    }),
    output: IdentificationResultSchema,
  },
})

const PlacementsSchema = z
  .array(
    z.object({
      rackId: z.number().int().nonnegative(),
      positionX: z.number().int().nonnegative(),
      positionY: z.number().int().nonnegative(),
    })
  )
  .min(1)

export const InboundOperationExecuteSchema = createApiSchema({
  POST: {
    input: z.union([
      z.object({
        itemId: z.number().int().nonnegative(),
        placements: PlacementsSchema,
        code: z.undefined().nullish(), // explicitly forbid
      }),
      z.object({
        code: z.string().min(1),
        placements: PlacementsSchema,
        itemId: z.undefined().nullish(), // explicitly forbid
      }),
    ]),
    output: z.object({
      itemId: z.number().int().nonnegative(),
      storedQuantity: z.number().int().nonnegative(),
      codes: z.array(z.string()),
    }),
  },
})

// ── Outbound (Zdejmowanie) ──────────────────────────────────────────

export const AssortmentByCodeSchema = createApiSchema({
  GET: {
    output: z.object({
      id: z.number().int().nonnegative(),
      code: z.string(),
      itemId: z.number().int().nonnegative(),
      rackId: z.number().int().nonnegative(),
      userId: z.number().int().nonnegative(),
      createdAt: z.string(),
      expiresAt: z.string(),
      positionX: z.number().int().nonnegative(),
      positionY: z.number().int().nonnegative(),
    }),
  },
})

export type ScannedAssortment = z.infer<
  typeof AssortmentByCodeSchema.shape.GET.shape.output
>

const OutboundPickSlotSchema = z.object({
  assortmentId: z.number().int().nonnegative(),
  assortmentCode: z.string(),
  rackId: z.number().int().nonnegative(),
  rackMarker: z.string(),
  positionX: z.number().int().nonnegative(),
  positionY: z.number().int().nonnegative(),
  createdAt: z.string(),
  expiresAt: z.string(),
})

export type OutboundPickSlot = z.infer<typeof OutboundPickSlotSchema>

export const OutboundCheckSchema = createApiSchema({
  POST: {
    input: z.object({
      code: z.string().min(1, "Kod jest wymagany"),
    }),
    output: z.object({
      fifoCompliant: z.boolean(),
      requestedAssortment: OutboundPickSlotSchema,
      olderAssortments: z.array(OutboundPickSlotSchema),
      warning: z.string().nullish(),
    }),
  },
})

export type OutboundCheckResult = z.infer<
  typeof OutboundCheckSchema.shape.POST.shape.output
>

export const OutboundPlanSchema = createApiSchema({
  POST: {
    input: z.object({
      itemId: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
    }),
    output: z.object({
      itemId: z.number().int().nonnegative(),
      itemName: z.string(),
      requestedQuantity: z.number().int().nonnegative(),
      availableQuantity: z.number().int().nonnegative(),
      expiredQuantity: z.number().int().nonnegative(),
      warning: z.string().nullish(),
      pickSlots: z.array(OutboundPickSlotSchema),
    }),
  },
})

export type OutboundPlan = z.infer<
  typeof OutboundPlanSchema.shape.POST.shape.output
>

const OutboundOperationSchema = z.object({
  id: z.number().int().nonnegative(),
  itemName: z.string(),
  itemCode: z.string(),
  rackMarker: z.string(),
  issuedByName: z.string(),
  operationTimestamp: z.string(),
  positionX: z.number().int().nonnegative(),
  positionY: z.number().int().nonnegative(),
  quantity: z.number().int().nonnegative(),
  assortmentCode: z.string(),
  fifoCompliant: z.boolean(),
})

export const OutboundExecuteSchema = createApiSchema({
  POST: {
    input: z.object({
      assortments: z.array(
        z.object({
          code: z.string().min(1, "Kod jest wymagany"),
        })
      ),
      skipFifo: z.boolean(),
    }),
    output: z.object({
      issuedCount: z.number().int().nonnegative(),
      operations: z.array(OutboundOperationSchema),
    }),
  },
})

export type OutboundExecuteResult = z.infer<
  typeof OutboundExecuteSchema.shape.POST.shape.output
>

export const RackReportsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      rackId: z.number().int().nonnegative().nullish(),
      warehouseId: z.number().int().nonnegative().nullish(),
      withAlerts: z.boolean().nullish(),
    }),
    output: createPaginatedSchema(
      z.object({
        id: z.number().int().nonnegative(),
        rackId: z.number().int().nonnegative(),
        rackMarker: z.string(),
        warehouseId: z.number().int().nonnegative(),
        warehouseName: z.string(),
        currentWeight: z.number().nonnegative(),
        currentTemperature: z.number().nonnegative(),
        sensorId: z.string(),
        alertTriggered: z.boolean(),
        createdAt: z.string(),
      })
    ),
  },
})

export const ReportFileFormatSchema = z.enum(["PDF", "EXCEL", "CSV"])
export type ReportFileFormat = z.infer<typeof ReportFileFormatSchema>

const BaseReportRequestSchema = z.object({
  format: ReportFileFormatSchema,
  warehouseId: z.number().int().nonnegative().nullable(),
  sendEmail: z.boolean().nullish(),
})

export const TemperatureAlertReportSchema = createApiSchema({
  POST: {
    input: BaseReportRequestSchema.extend({
      startDate: z.string().nullish(),
      endDate: z.string().nullish(),
    }),
    output: z.union([z.instanceof(Blob), z.null()]),
  },
})

export const InventoryStockReportSchema = createApiSchema({
  POST: {
    input: BaseReportRequestSchema,
    output: z.union([z.instanceof(Blob), z.null()]),
  },
})

export const ExpiryReportSchema = createApiSchema({
  POST: {
    input: BaseReportRequestSchema.extend({
      daysAhead: z.number().int().nonnegative().nullish(),
    }),
    output: z.union([z.instanceof(Blob), z.null()]),
  },
})

// --- Backup Management ---

export const BackupResourceTypeSchema = z.enum([
  "RACKS",
  "ITEMS",
  "ASSORTMENTS",
])
export type BackupResourceType = z.infer<typeof BackupResourceTypeSchema>

export const BackupTypeSchema = z.enum(["SCHEDULED", "MANUAL"])
export type BackupType = z.infer<typeof BackupTypeSchema>

export const BackupStatusSchema = z.enum([
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "RESTORING",
])
export type BackupStatus = z.infer<typeof BackupStatusSchema>

export const BackupScheduleCodeSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"])

const BackupResourceTypesArraySchema = z
  .array(BackupResourceTypeSchema)
  .min(1, "At least one resource type is required")
  .refine(
    (resourceTypes) => new Set(resourceTypes).size === resourceTypes.length,
    {
      message: "Resource types must be unique",
    }
  )

const BackupResourceTypesOutputSchema = z.array(BackupResourceTypeSchema)

const BackupRecordSchema = z.object({
  id: z.number().int().nonnegative(),
  warehouseId: z.number().int().nonnegative(),
  warehouseName: z.string(),
  backupType: BackupTypeSchema,
  status: BackupStatusSchema,
  resourceTypes: BackupResourceTypesOutputSchema,
  totalRecords: z.number().int().nonnegative().nullish(),
  sizeBytes: z.number().int().nonnegative().nullish(),
  backupProgressPercentage: z.number().int().min(0).max(100).nullish(),
  restoreProgressPercentage: z.number().int().min(0).max(100).nullish(),
  createdAt: z.string(),
  completedAt: z.string().nullish(),
  errorMessage: z.string().nullish(),
  restoreStartedAt: z.string().nullish(),
  restoreCompletedAt: z.string().nullish(),
  racksRestored: z.number().int().nonnegative().nullish(),
  itemsRestored: z.number().int().nonnegative().nullish(),
  assortmentsRestored: z.number().int().nonnegative().nullish(),
  triggeredByName: z.string().nullish(),
})

export type BackupRecord = z.infer<typeof BackupRecordSchema>

const BackupCreateInputSchema = z.object({
  warehouseId: z.number().int().nonnegative(),
  resourceTypes: BackupResourceTypesArraySchema,
})

const BackupScheduleSchema = z.object({
  warehouseId: z.number().int().nonnegative().nullish(),
  warehouseName: z.string(),
  scheduleCode: BackupScheduleCodeSchema,
  backupHour: z.number().int().min(0).max(23),
  dayOfWeek: z.number().int().min(1).max(7).nullish(),
  dayOfMonth: z.number().int().min(1).max(31).nullish(),
  resourceTypes: BackupResourceTypesOutputSchema,
  enabled: z.boolean(),
  lastRunAt: z.string().nullish(),
  nextRunAt: z.string().nullish(),
})

export type BackupSchedule = z.infer<typeof BackupScheduleSchema>

const BackupScheduleUpsertInputSchema = z
  .object({
    scheduleCode: BackupScheduleCodeSchema,
    backupHour: z.number().int().min(0).max(23),
    dayOfWeek: z.number().int().min(1).max(7).nullish(),
    dayOfMonth: z.number().int().min(1).max(31).nullish(),
    resourceTypes: BackupResourceTypesArraySchema,
    enabled: z.boolean().nullish(),
  })
  .superRefine((value, ctx) => {
    if (value.scheduleCode === "WEEKLY" && value.dayOfWeek == null) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfWeek"],
        message: "dayOfWeek is required for WEEKLY schedules",
      })
    }

    if (value.scheduleCode === "MONTHLY" && value.dayOfMonth == null) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfMonth"],
        message: "dayOfMonth is required for MONTHLY schedules",
      })
    }
  })

const RestoreResultSchema = z.object({
  backupId: z.number().int().nonnegative(),
  warehouseId: z.number().int().nonnegative(),
  racksRestored: z.number().int().nonnegative(),
  itemsRestored: z.number().int().nonnegative(),
  assortmentsRestored: z.number().int().nonnegative(),
  restoredAt: z.string(),
})

export type RestoreResult = z.infer<typeof RestoreResultSchema>

const SkippedWarehouseSchema = z.object({
  warehouseId: z.number().int().nonnegative(),
  warehouseName: z.string(),
  reason: z.string(),
})

const RestoreAllWarehousesResultSchema = z.object({
  successful: z.array(RestoreResultSchema),
  skipped: z.array(SkippedWarehouseSchema),
})

export type RestoreAllWarehousesResult = z.infer<
  typeof RestoreAllWarehousesResultSchema
>

export const BackupsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      warehouseId: z.number().int().nonnegative().nullish(),
    }),
    output: createPaginatedSchema(BackupRecordSchema),
  },
  POST: {
    input: BackupCreateInputSchema,
    output: BackupRecordSchema,
  },
})

export const BackupDetailsSchema = createApiSchema({
  GET: {
    output: BackupRecordSchema,
  },
  DELETE: {
    output: z.null(),
  },
})

export const BackupRestoreSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: RestoreResultSchema,
  },
})

export const BackupRestoreAllSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: RestoreAllWarehousesResultSchema,
  },
})

export const BackupAllSchema = createApiSchema({
  POST: {
    input: z.null(),
    output: z.array(BackupRecordSchema),
  },
})

export const BackupSchedulesSchema = createApiSchema({
  GET: {
    output: z.array(BackupScheduleSchema),
  },
})

export const BackupScheduleByWarehouseSchema = createApiSchema({
  PUT: {
    input: BackupScheduleUpsertInputSchema,
    output: BackupScheduleSchema,
  },
  DELETE: {
    output: z.null(),
  },
})

export const BackupScheduleGlobalSchema = createApiSchema({
  GET: {
    output: BackupScheduleSchema,
  },
  PUT: {
    input: BackupScheduleUpsertInputSchema,
    output: BackupScheduleSchema,
  },
  DELETE: {
    output: z.null(),
  },
})

// --- API Keys ---

export const ApiKeyScopeSchema = z.enum([
  "SENSOR_WRITE",
  "REPORTS_GENERATE",
  "INVENTORY_READ",
  "STRUCTURE_READ",
])

const ApiKeyScopesArraySchema = z
  .array(ApiKeyScopeSchema)
  .min(1, "At least one scope is required")
  .refine((scopes) => new Set(scopes).size === scopes.length, {
    message: "Scopes must be unique",
  })

const ApiKeyResponseSchema = z.object({
  id: z.number().int().nonnegative(),
  keyPrefix: z.string(),
  name: z.string(),
  warehouseId: z.number().int().nonnegative().nullish(),
  warehouseName: z.string().nullish(),
  scopes: z.array(ApiKeyScopeSchema),
  createdAt: z.string(),
  lastUsedAt: z.string().nullish(),
  createdByUserId: z.number().int().nonnegative(),
  active: z.boolean(),
})

const ApiKeyCreatedResponseSchema = z.object({
  id: z.number().int().nonnegative(),
  rawKey: z.string(),
  keyPrefix: z.string(),
  name: z.string(),
  warehouseId: z.number().int().nonnegative().nullish(),
  warehouseName: z.string().nullish(),
  scopes: z.array(ApiKeyScopeSchema),
  createdAt: z.string(),
})

const CreateApiKeyInputSchema = z.object({
  name: z.string().trim().min(3).max(100),
  warehouseId: z.number().int().nonnegative().nullish(),
  scopes: ApiKeyScopesArraySchema,
})

export const ApiKeysSchema = createApiSchema({
  GET: {
    output: z.array(ApiKeyResponseSchema),
  },
  POST: {
    input: CreateApiKeyInputSchema,
    output: ApiKeyCreatedResponseSchema,
  },
})

export const ApiKeyDetailsSchema = createApiSchema({
  GET: {
    output: ApiKeyResponseSchema,
  },
  DELETE: {
    output: z.null(),
  },
})

// --- AUDIT ---
const InboudOperationSchema = z.object({
  id: z.number().int().nonnegative(),
  itemName: z.string(),
  itemCode: z.string(),
  rackMarker: z.string(),
  receivedByName: z.string(),
  operationTimestamp: z.string(),
  positionX: z.number().int().nonnegative(),
  positionY: z.number().int().nonnegative(),
  quantity: z.number().int().nonnegative(),
  assortmentCode: z.string(),
})
export const AuditInboudOperationsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      userId: z.number().int().nonnegative().nullish(),
      itemId: z.number().int().nonnegative().nullish(),
      rackId: z.number().int().nonnegative().nullish(),
      startDate: z.string().nullish(),
      endDate: z.string().nullish(),
    }),
    output: createPaginatedSchema(InboudOperationSchema),
  },
})

export const AuditOutboundOperationsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      userId: z.number().int().nonnegative().nullish(),
      itemId: z.number().int().nonnegative().nullish(),
      rackId: z.number().int().nonnegative().nullish(),
      startDate: z.string().nullish(),
      endDate: z.string().nullish(),
    }),
    output: createPaginatedSchema(OutboundOperationSchema),
  },
})

// --- Alerts ---

export const AlertTypeSchema = z.enum([
  "WEIGHT_EXCEEDED",
  "TEMPERATURE_TOO_HIGH",
  "TEMPERATURE_TOO_LOW",
  "LOW_VISUAL_SIMILARITY",
  "ITEM_TEMPERATURE_TOO_HIGH",
  "ITEM_TEMPERATURE_TOO_LOW",
  "EMBEDDING_GENERATION_COMPLETED",
  "EMBEDDING_GENERATION_FAILED",
  "ASSORTMENT_EXPIRED",
  "ASSORTMENT_CLOSE_TO_EXPIRY",
  "BACKUP_COMPLETED",
  "BACKUP_FAILED",
  "RESTORE_COMPLETED",
  "RESTORE_FAILED",
  "ADMIN_MESSAGE",
  "UNAUTHORIZED_OUTBOUND",
])

export type AlertType = z.infer<typeof AlertTypeSchema>

const ALERT_TYPE_OPTION_KEYS = [
  {
    value: "WEIGHT_EXCEEDED",
    labelKey: "generated.validation.exceedingWeight",
  },
  {
    value: "TEMPERATURE_TOO_HIGH",
    labelKey: "generated.validation.temperatureTooHigh",
  },
  {
    value: "TEMPERATURE_TOO_LOW",
    labelKey: "generated.validation.temperatureTooLow",
  },
  {
    value: "LOW_VISUAL_SIMILARITY",
    labelKey: "generated.validation.lowVisualCompatibility",
  },
  {
    value: "ITEM_TEMPERATURE_TOO_HIGH",
    labelKey: "generated.validation.productTemperatureTooHigh",
  },
  {
    value: "ITEM_TEMPERATURE_TOO_LOW",
    labelKey: "generated.validation.productTemperatureTooLow",
  },
  {
    value: "EMBEDDING_GENERATION_COMPLETED",
    labelKey: "generated.validation.embeddingGenerationComplete",
  },
  {
    value: "EMBEDDING_GENERATION_FAILED",
    labelKey: "generated.validation.embeddingGenerationFailed",
  },
  {
    value: "ASSORTMENT_EXPIRED",
    labelKey: "generated.validation.assortmentExpired",
  },
  {
    value: "ASSORTMENT_CLOSE_TO_EXPIRY",
    labelKey: "generated.validation.assortmentCloseExpiration",
  },
  {
    value: "BACKUP_COMPLETED",
    labelKey: "generated.validation.backupCompleted",
  },
  {
    value: "BACKUP_FAILED",
    labelKey: "generated.validation.backupFailed",
  },
  {
    value: "RESTORE_COMPLETED",
    labelKey: "generated.validation.restoreCompleted",
  },
  {
    value: "RESTORE_FAILED",
    labelKey: "generated.validation.restoreFailed",
  },
  {
    value: "ADMIN_MESSAGE",
    labelKey: "generated.validation.adminMessage",
  },
  {
    value: "UNAUTHORIZED_OUTBOUND",
    labelKey: "generated.validation.unauthorizedOutbound",
  },
] as const

export const getAlertTypeOptions = (t: AppTranslate) =>
  ALERT_TYPE_OPTION_KEYS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))

export const findAlertTitle = (alert: { alertType: string }, t: AppTranslate) =>
  getAlertTypeOptions(t).find((option) => option.value === alert.alertType)
    ?.label || alert.alertType

export const AlertsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      type: z.array(AlertTypeSchema).nullish(),
      warehouseId: z.number().int().nonnegative().nullish(),
      status: z
        .array(z.enum(["OPEN", "ACTIVE", "RESOLVED", "DISMISSED"]))
        .nullish(),
      rackId: z.number().int().nonnegative().nullish(),
    }),
    output: createPaginatedSchema(AlertSchema),
  },
})

export const ApiAlertSchema = createApiSchema({
  GET: {
    output: AlertSchema,
  },
})

export const ApiAlertsStatusSchema = createApiSchema({
  PATCH: {
    input: z.object({
      alertIds: z
        .array(z.number().int().nonnegative())
        .min(1, "At least one alert ID is required"),
      status: z.enum(["OPEN", "ACTIVE", "RESOLVED", "DISMISSED"]),
      resolutionNotes: z.string().nullish(),
    }),
    output: z.array(AlertSchema),
  },
})
