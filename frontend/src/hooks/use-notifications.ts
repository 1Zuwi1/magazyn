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

export type NotificationsList = InferApiOutput<
  typeof ApiNotificationsSchema,
  "GET"
>
export type UserNotification = NotificationsList["content"][number]

export default function useNotifications(
  params?: InferApiInput<typeof ApiNotificationsSchema, "GET">,
  options?: SafeQueryOptions<NotificationsList>
): UseQueryResult<NotificationsList, FetchError> {
  return useApiQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "all", params],
    queryFn: async () =>
      apiFetch("/api/notifications", ApiNotificationsSchema, {
        method: "GET",
        queryParams: params,
      }),
    ...options,
  })
}

export function useMarkNotification() {
  return useApiMutation({
    mutationFn: ({
      notificationId,
      ...params
    }: InferApiInput<typeof ApiMarkNotificationSchema, "PATCH"> & {
      notificationId: string
    }) =>
      apiFetch(
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
    mutationFn: (
      params: InferApiInput<typeof ApiMarkBulkNotificationsSchema, "PATCH">
    ) =>
      apiFetch("/api/notifications/bulk", ApiMarkBulkNotificationsSchema, {
        method: "PATCH",
        body: params,
      }),
  })
}
