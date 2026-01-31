import z from "zod"
import { createApiSchema } from "../create-api-schema"

export const NotificationTypeSchema = z.enum([
  "UNAUTHORIZED_REMOVAL",
  "RACK_OVERWEIGHT",
  "ITEM_EXPIRED",
  "TEMPERATURE_VIOLATION",
])

export const NotificationSeveritySchema = z.enum([
  "info",
  "warning",
  "critical",
])

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: NotificationTypeSchema,
  severity: NotificationSeveritySchema,
  warehouseId: z.string().optional(),
  rackId: z.string().optional(),
  itemId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  date: z.string(),
  read: z.boolean(),
})

export const ApiNotificationsSchema = createApiSchema({
  GET: {
    output: z.array(NotificationSchema),
  },
})
