import z from "zod"
import { createApiSchema } from "../create-api-schema"

const DimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
})

export const ItemSchema = z.object({
  // id: z.string().uuid(),
  id: z.string(),
  name: z.string(),
  qrCode: z.string(),
  imageUrl: z.string().optional().or(z.literal("")),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number().nonnegative(),
  dimensions: DimensionsSchema,
  expiryDate: z.date(),
  comment: z.string().optional(),
  isDangerous: z.boolean().default(false),
})

export const RackSchema = z.object({
  id: z.string(),
  name: z.string(),
  rows: z.number().min(1),
  cols: z.number().min(1),
  minTemp: z.number(),
  maxTemp: z.number(),
  maxWeight: z.number().nonnegative(),
  currentWeight: z.number().nonnegative(),
  maxItemSize: DimensionsSchema,
  comment: z.string().optional(),
  occupancy: z.number().min(0).max(100),
  items: z.array(ItemSchema),
})

export const CsvRackRowSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  rows: z.number().min(1),
  cols: z.number().min(1),
  minTemp: z.number(),
  maxTemp: z.number(),
  maxWeight: z.number().nonnegative(),
  maxItemWidth: z.number().positive(),
  maxItemHeight: z.number().positive(),
  maxItemDepth: z.number().positive(),
  comment: z.string().optional(),
})

export const CsvItemRowSchema = z.object({
  name: z.string(),
  id: z.string(),
  imageUrl: z.string().optional().or(z.literal("")),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  comment: z.string().optional(),
  daysToExpiry: z.number(),
  isDangerous: z.boolean().default(false),
})

export const ApiRacksSchema = createApiSchema({
  GET: {
    output: z.array(RackSchema),
  },
  POST: {
    input: RackSchema.omit({
      id: true,
      currentWeight: true,
      occupancy: true,
      items: true,
    }),
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
