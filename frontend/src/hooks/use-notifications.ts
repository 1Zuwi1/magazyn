import { apiFetch, type InferApiOutput } from "@/lib/fetcher"
import { ApiNotificationsSchema } from "@/lib/schemas/monitoring-schemas"
import { useApiQuery } from "./use-api-query"

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const

export type NotificationsList = InferApiOutput<
  typeof ApiNotificationsSchema,
  "GET"
>

export default function useNotifications() {
  return useApiQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () =>
      await apiFetch("/api/notifications", ApiNotificationsSchema, {
        method: "GET",
      }),
  })
}
