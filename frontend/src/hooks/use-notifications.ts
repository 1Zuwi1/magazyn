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
      read,
    }: {
      notificationId: string
      read: boolean
    }) =>
      apiFetch(
        `/api/notifications/${notificationId}?read=${read}`,
        ApiMarkNotificationSchema,
        {
          method: "PATCH",
          body: null,
        }
      ),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      })
    },
  })
}

export function useMarkBulkNotifications() {
  return useApiMutation({
    mutationFn: ({ read }: { read: boolean }) =>
      apiFetch(
        `/api/notifications/bulk?read=${read}`,
        ApiMarkBulkNotificationsSchema,
        {
          method: "PATCH",
          body: null,
        }
      ),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      })
    },
  })
}
