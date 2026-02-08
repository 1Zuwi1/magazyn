import z from "zod"
import { createApiSchema } from "../create-api-schema"
import { createPaginatedSchema, createPaginatedSchemaInput } from "../schemas"

export const AlertSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
  rackId: z.coerce.number().int().nonnegative().nullable().optional(),
  rackMarker: z.string().nullable().optional(),
  warehouseId: z.coerce.number().int().nonnegative().nullable().optional(),
  warehouseName: z.string().nullable().optional(),
  alertType: z.string(),
  alertTypeDescription: z.string().nullable().optional(),
  status: z.string(),
  message: z.string(),
  thresholdValue: z.number().nullable().optional(),
  actualValue: z.number().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
  resolvedByName: z.string().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
})

const RawUserNotificationSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
  alert: AlertSchema,
  createdAt: z.coerce.date(),
  readAt: z.coerce.date().nullable().optional(),
  read: z.boolean().optional(),
  isRead: z.boolean().optional(),
})

export const UserNotificationSchema = RawUserNotificationSchema.transform(
  ({ isRead, read, ...notification }) => ({
    ...notification,
    read: read ?? isRead ?? false,
    readAt: notification.readAt ?? null,
  })
)

export const ApiNotificationsSchema = createApiSchema({
  GET: {
    input: createPaginatedSchemaInput({
      read: z.boolean().optional(),
      alertId: z.number().int().nonnegative().optional(),
    }),
    output: createPaginatedSchema(UserNotificationSchema),
  },
})

export const ApiMarkNotificationSchema = createApiSchema({
  PATCH: {
    input: z.object({
      read: z.boolean(),
    }),
    output: UserNotificationSchema,
  },
})

export const ApiMarkBulkNotificationsSchema = createApiSchema({
  PATCH: {
    input: z.object({
      read: z.boolean(),
    }),
    output: z.number().int().nonnegative(),
  },
})
