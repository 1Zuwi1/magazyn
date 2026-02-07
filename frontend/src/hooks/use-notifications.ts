import type { UseQueryResult } from "@tanstack/react-query"
import type { FetchError } from "@/lib/fetcher"
import { apiFetch, type InferApiOutput } from "@/lib/fetcher"
import {
  ApiMarkAllNotificationsReadSchema,
  ApiMarkNotificationReadSchema,
  ApiMarkNotificationUnreadSchema,
  ApiNotificationByAlertSchema,
  ApiNotificationsSchema,
  ApiUnreadNotificationsCountSchema,
  ApiUnreadNotificationsSchema,
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

export function useUnreadNotifications(
  params?: NotificationsListParams
): UseQueryResult<UnreadNotificationsList, FetchError> {
  const queryParams = normalizeNotificationsParams(params)

  return useApiQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread", queryParams],
    queryFn: async () =>
      await apiFetch(
        "/api/notifications/unread",
        ApiUnreadNotificationsSchema,
        {
          method: "GET",
          queryParams,
        }
      ),
  })
}

export function useUnreadNotificationsCount(): UseQueryResult<
  number,
  FetchError
> {
  return useApiQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread-count"],
    queryFn: async () =>
      await apiFetch(
        "/api/notifications/unread/count",
        ApiUnreadNotificationsCountSchema,
        {
          method: "GET",
        }
      ),
  })
}

export function useNotificationByAlert(
  alertId?: number | null
): UseQueryResult<UserNotification, FetchError> {
  const safeAlertId = alertId ?? -1

  return useApiQuery({
    enabled: safeAlertId > 0,
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "alert", safeAlertId],
    queryFn: async () =>
      await apiFetch(
        `/api/notifications/alert/${safeAlertId}`,
        ApiNotificationByAlertSchema,
        {
          method: "GET",
        }
      ),
  })
}

export function useMarkNotificationAsRead() {
  return useApiMutation({
    mutationFn: async (notificationId: number) =>
      await apiFetch(
        `/api/notifications/${notificationId}/read`,
        ApiMarkNotificationReadSchema,
        {
          body: {},
          method: "PATCH",
        }
      ),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      })
    },
  })
}

export function useMarkNotificationAsUnread() {
  return useApiMutation({
    mutationFn: async (notificationId: number) =>
      await apiFetch(
        `/api/notifications/${notificationId}/unread`,
        ApiMarkNotificationUnreadSchema,
        {
          body: {},
          method: "PATCH",
        }
      ),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  return useApiMutation({
    mutationFn: async () =>
      await apiFetch(
        "/api/notifications/read-all",
        ApiMarkAllNotificationsReadSchema,
        {
          body: {},
          method: "PATCH",
        }
      ),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY,
      })
    },
  })
}
