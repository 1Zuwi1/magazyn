import z from "zod"
import { createApiSchema } from "../create-api-schema"

const dimensionSchema = z.number().nonnegative()

export const ItemSchema = z.object({
  // id: z.string().uuid(),
  id: z.string(),
  name: z.string(),
  qrCode: z.string(),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number().nonnegative(),
  dimensions: z.object({
    x: dimensionSchema,
    y: dimensionSchema,
    z: dimensionSchema,
  }),
  expiryDate: z.date(),
  comment: z.string().optional(),
  isDangerous: z.boolean().default(false),
})

export const RackSchema = z.object({
  // id: z.string().uuid(),
  id: z.string(),
  name: z.string(),
  size: {
    rows: z.number().min(1),
    cols: z.number().min(1),
  },
  minTemp: z.number(),
  maxTemp: z.number(),
  maxWeight: z.number().nonnegative(),
  currentWeight: z.number().nonnegative(),
  maxItemSize: {
    x: dimensionSchema,
    y: dimensionSchema,
    z: dimensionSchema,
  },
  comment: z.string().optional(),
  occupancy: z.number().min(0).max(100),
  items: z.array(ItemSchema),
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

export const CsvRackRowSchema = z.object({
  name: z.string(),
  rows: z.number().min(1),
  cols: z.number().min(1),
  minTemp: z.number(),
  maxTemp: z.number(),
  maxWeightKg: z.number().nonnegative(),
  maxItemX: dimensionSchema,
  maxItemY: dimensionSchema,
  maxItemZ: dimensionSchema,
  comment: z.string().optional(),
})

export const CsvItemRowSchema = z.object({
  name: z.string(),
  id: z.string(),
  imageUrl: z.string().optional().or(z.literal("")),
  minTemp: z.number(),
  maxTemp: z.number(),
  weight: z.number().nonnegative(),
  dimX: dimensionSchema,
  dimY: dimensionSchema,
  dimZ: dimensionSchema,
  comment: z.string().optional(),
  expiryDate: z.date(),
  isDangerous: z.boolean().default(false),
})
