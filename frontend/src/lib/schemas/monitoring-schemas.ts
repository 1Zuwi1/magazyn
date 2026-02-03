import z from "zod"
import { createApiSchema } from "../create-api-schema"

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum([
    "UNAUTHORIZED_REMOVAL",
    "RACK_OVERWEIGHT",
    "ITEM_EXPIRED",
    "TEMPERATURE_VIOLATION",
  ]),
  severity: z.enum(["info", "warning", "critical"]),
  warehouseId: z.string().optional(),
  rackId: z.string().optional(),
  itemId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  date: z.date(),
  read: z.boolean(),
})

export const WeightAlertSchema = z.object({
  id: z.string(),
  rackId: z.string(),
  previousWeight: z.number(),
  currentWeight: z.number(),
  timestamp: z.date(),
})

export const ApiNotificationsSchema = createApiSchema({
  GET: {
    output: z.array(NotificationSchema),
  },
})
