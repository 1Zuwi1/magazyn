import type { UseQueryResult } from "@tanstack/react-query"
import type { FetchError, InferApiInput } from "@/lib/fetcher"
import { apiFetch, type InferApiOutput } from "@/lib/fetcher"
import {
  ApiMarkAllNotifications,
  ApiNotificationsSchema,
  type ApiUnreadNotificationsSchema,
} from "@/lib/schemas/monitoring-schemas"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const
const DEFAULT_NOTIFICATIONS_PAGE_SIZE = 20

interface NotificationsListParams {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: "asc" | "desc"
}

const normalizeNotificationsParams = (
  params?: NotificationsListParams
): Required<Pick<NotificationsListParams, "page" | "size">> &
  Pick<NotificationsListParams, "sortBy" | "sortDir"> => ({
  page: params?.page ?? 0,
  size: params?.size ?? DEFAULT_NOTIFICATIONS_PAGE_SIZE,
  sortBy: params?.sortBy,
  sortDir: params?.sortDir,
})

export type NotificationsList = InferApiOutput<
  typeof ApiNotificationsSchema,
  "GET"
>
export type UnreadNotificationsList = InferApiOutput<
  typeof ApiUnreadNotificationsSchema,
  "GET"
>
export type UserNotification = NotificationsList["content"][number]

export default function useNotifications(
  params?: NotificationsListParams
): UseQueryResult<NotificationsList, FetchError> {
  const queryParams = normalizeNotificationsParams(params)

  return useApiQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "all", queryParams],
    queryFn: async () =>
      await apiFetch("/api/notifications", ApiNotificationsSchema, {
        method: "GET",
        queryParams,
      }),
  })
}

export function useMarkNotification(
  body: InferApiInput<typeof ApiMarkAllNotifications, "PATCH">
) {
  return useApiMutation({
    mutationFn: (notificationId: number) =>
      apiFetch(
        `/api/notifications/${notificationId}/read`,
        ApiMarkAllNotifications,
        {
          body,
          method: "PATCH",
        }
      ),
    onSuccess: (_, __, ___, context) =>
      context.client.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      }),
  })
}

export function useMarkAllNotifications(
  body: InferApiInput<typeof ApiMarkAllNotifications, "PATCH">
) {
  return useApiMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/mark-all", ApiMarkAllNotifications, {
        body,
        method: "PATCH",
      }),
    onSuccess: (_, __, ___, context) =>
      context.client.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      }),
  })
}
