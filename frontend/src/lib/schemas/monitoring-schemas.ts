import z from "zod"
import { createApiSchema } from "../create-api-schema"
import { createPaginatedSchema, createPaginatedSchemaInput } from "../schemas"

export const AlertSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
  rackId: z.coerce.number().int().nonnegative().nullable().nullish(),
  rackMarker: z.string().nullable().nullish(),
  warehouseId: z.coerce.number().int().nonnegative().nullable().nullish(),
  warehouseName: z.string().nullable().nullish(),
  alertType: z.string(),
  alertTypeDescription: z.string().nullable().nullish(),
  status: z.string(),
  message: z.string(),
  thresholdValue: z.number().nullable().nullish(),
  actualValue: z.number().nullable().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable().nullish(),
  resolvedAt: z.coerce.date().nullable().nullish(),
  resolvedByName: z.string().nullable().nullish(),
  resolutionNotes: z.string().nullable().nullish(),
})

const RawUserNotificationSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
  alert: AlertSchema,
  createdAt: z.coerce.date(),
  readAt: z.coerce.date().nullable().nullish(),
  read: z.boolean().nullish(),
  isRead: z.boolean().nullish(),
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
      read: z.boolean().nullish(),
      alertId: z.number().int().nonnegative().nullish(),
    }),
    output: createPaginatedSchema(UserNotificationSchema),
  },
})

export const ApiMarkNotificationSchema = createApiSchema({
  PATCH: {
    input: z.null(),
    output: UserNotificationSchema,
  },
})

export const ApiMarkBulkNotificationsSchema = createApiSchema({
  PATCH: {
    input: z.null(),
    output: z.number().int().nonnegative(),
  },
})
