import type { UseQueryResult } from "@tanstack/react-query"
import type { FetchError, InferApiInput } from "@/lib/fetcher"
import { apiFetch, type InferApiOutput } from "@/lib/fetcher"
import {
  ApiMarkBulkNotificationsSchema,
  ApiMarkNotificationSchema,
  ApiNotificationsSchema,
} from "@/lib/schemas/monitoring-schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const

interface NotificationsListParams {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: "asc" | "desc"
  alertType?: string[]
}

const normalizeNotificationsParams = (
  params?: NotificationsListParams
): Required<Pick<NotificationsListParams, "page" | "size">> &
  Pick<NotificationsListParams, "sortBy" | "sortDir" | "alertType"> => ({
  page: params?.page ?? 0,
  size: params?.size ?? 20,
  sortBy: params?.sortBy,
  sortDir: params?.sortDir,
  alertType:
    params?.alertType && params.alertType.length > 0
      ? params.alertType
      : undefined,
})

export type NotificationsList = InferApiOutput<
  typeof ApiNotificationsSchema,
  "GET"
>
export type UserNotification = NotificationsList["content"][number]

export default function useNotifications(
  params?: NotificationsListParams,
  options?: SafeQueryOptions<NotificationsList>
): UseQueryResult<NotificationsList, FetchError> {
  const queryParams = normalizeNotificationsParams(params)

  return useApiQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "all", queryParams],
    queryFn: async () =>
      await apiFetch("/api/notifications", ApiNotificationsSchema, {
        method: "GET",
        queryParams,
      }),
    ...options,
  })
}

export function useMarkNotification() {
  return useApiMutation({
    mutationFn: async ({
      notificationId,
      ...params
    }: InferApiInput<typeof ApiMarkNotificationSchema, "PATCH"> & {
      notificationId: string
    }) =>
      await apiFetch(
        `/api/notifications/${notificationId}/mark`,
        ApiMarkNotificationSchema,
        {
          method: "PATCH",
          body: params,
        }
      ),
  })
}

export function useMarkBulkNotifications() {
  return useApiMutation({
    mutationFn: async (
      params: InferApiInput<typeof ApiMarkBulkNotificationsSchema, "PATCH">
    ) =>
      await apiFetch(
        "/api/notifications/bulk",
        ApiMarkBulkNotificationsSchema,
        {
          method: "PATCH",
          body: params,
        }
      ),
  })
}
