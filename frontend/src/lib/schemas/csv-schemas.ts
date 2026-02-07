import z from "zod"

export const WarehouseCsvSchema = z.object({
  name: z.string().trim().min(1, "Nazwa magazynu jest wymagana"),
})

export const RackCsvSchema = z.object({
  marker: z.string().trim().min(1, "Marker jest wymagany"),
  rows: z.number().int().min(1),
  cols: z.number().int().min(1),
  minTemp: z.number(),
  maxTemp: z.number(),
  maxWeight: z.number().nonnegative(),
  maxItemWidth: z.number().positive(),
  maxItemHeight: z.number().positive(),
  maxItemDepth: z.number().positive(),
  isDangerous: z.boolean().optional(),
  comment: z.string().optional(),
})

export const ItemCsvSchema = z.object({
  name: z.string().trim().min(1, "Nazwa produktu jest wymagana"),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  daysToExpiry: z.number().int().nonnegative().optional(),
  isDangerous: z.boolean().optional(),
  comment: z.string().optional(),
})

const usernameSchema = z
  .string()
  .min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki")
  .max(20, "Nazwa użytkownika może mieć maksymalnie 20 znaków")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia"
  )

export const UserFormSchema = z.object({
  username: usernameSchema,
  email: z.email(),
  role: z.enum(["USER", "ADMIN"]),
  team: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})
