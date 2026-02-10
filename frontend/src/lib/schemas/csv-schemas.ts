import z from "zod"
import { translateMessage } from "@/i18n/translate-message"

export const WarehouseCsvSchema = z.object({
  name: z.string().trim().min(1, "Nazwa magazynu jest wymagana"),
})

const csvBoolean = z.preprocess((v) => {
  // treat empty cell as "missing"
  if (v === "" || v === null || v === undefined) {
    return undefined
  }

  // already a boolean
  if (typeof v === "boolean") {
    return v
  }

  // numbers from some CSV parsers
  if (typeof v === "number") {
    return v !== 0
  }

  if (typeof v === "string") {
    const s = v.trim().toLowerCase()

    // common CSV variants
    if (["true", "t", "1", "yes", "y"].includes(s)) {
      return true
    }
    if (["false", "f", "0", "no", "n"].includes(s)) {
      return false
    }
  }

  // let Zod throw a nice error for weird values
  return v
}, z.boolean())

export const RackCsvSchema = z.object({
  marker: z.string().trim().min(1, "Marker jest wymagany"),
  rows: z.coerce.number().int().min(1),
  cols: z.coerce.number().int().min(1),
  minTemp: z.coerce.number(),
  maxTemp: z.coerce.number(),
  maxWeight: z.coerce.number().nonnegative(),
  maxItemWidth: z.coerce.number().positive(),
  maxItemHeight: z.coerce.number().positive(),
  maxItemDepth: z.coerce.number().positive(),
  isDangerous: csvBoolean.optional(),
  comment: z.coerce.string().optional(),
})

export const ItemCsvSchema = z.object({
  name: z.string().trim().min(1, "Nazwa produktu jest wymagana"),
  minTemp: z.coerce.number(),
  maxTemp: z.coerce.number(),
  weight: z.coerce.number().nonnegative(),
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  depth: z.coerce.number().positive(),
  daysToExpiry: z.coerce.number().int().nonnegative().optional(),
  isDangerous: csvBoolean.optional(),
  comment: z.string().optional(),
})

const usernameSchema = z
  .string()
  .min(3, translateMessage("generated.m0841"))
  .max(20, translateMessage("generated.m0842"))
  .regex(/^[a-zA-Z0-9_]+$/, translateMessage("generated.m0843"))

export const UserFormSchema = z.object({
  username: usernameSchema,
  email: z.email(),
  role: z.enum(["USER", "ADMIN"]),
  team: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})
