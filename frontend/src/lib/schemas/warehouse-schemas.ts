import z from "zod"
import { createApiSchema } from "../create-api-schema"

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  qrCode: z.string(),
  expiryDate: z.date(),
  weight: z.number().nonnegative(),
  dimensions: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    z: z.number().nonnegative(),
  }),
  minTemp: z.number(),
  maxTemp: z.number(),
  comment: z.string().optional(),
  isDangerous: z.boolean().default(false),
  imageUrl: z.string().optional().nullable(),
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
