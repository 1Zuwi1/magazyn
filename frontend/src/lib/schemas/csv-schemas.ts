import z from "zod"
import { createApiSchema } from "../create-api-schema"

export const ItemSchema = z.object({
  name: z.string(),
  id: z.string(),
  qrCode: z.string(),
  imageUrl: z.string().optional().or(z.literal("")),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  comment: z.string().optional(),
  daysToExpiry: z.number().nonnegative(),
  isDangerous: z.boolean().default(false),
})

export const RackSchema = z.object({
  id: z.string(),
  symbol: z.string().optional(),
  name: z.string(),
  rows: z.number().min(1),
  cols: z.number().min(1),
  minTemp: z.number(),
  maxTemp: z.number(),
  maxWeight: z.number().nonnegative(),
  currentWeight: z.number().nonnegative(),
  maxItemWidth: z.number().positive(),
  maxItemHeight: z.number().positive(),
  maxItemDepth: z.number().positive(),
  comment: z.string().optional(),
  occupancy: z.number().min(0).max(100),
  items: z.array(ItemSchema),
})

export const RackCsvSchema = RackSchema.omit({
  id: true,
  currentWeight: true,
  occupancy: true,
  items: true,
})

export const ItemCsvSchema = ItemSchema.omit({
  qrCode: true,
})

export const ApiRacksSchema = createApiSchema({
  GET: {
    output: z.array(RackSchema),
  },
  POST: {
    input: RackCsvSchema,
    output: RackSchema,
  },
})

export const ApiItemsSchema = createApiSchema({
  POST: {
    input: ItemSchema.omit({
      id: true,
    }),
    output: ItemSchema,
  },
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
  role: z.enum(["user", "admin"]),
  team: z.string(),
  status: z.enum(["active", "inactive"]),
})
