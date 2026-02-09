import type { UseQueryOptions } from "@tanstack/react-query"
import { apiFetch, type InferApiInput } from "@/lib/fetcher"
import {
  AlertsSchema,
  ApiAlertSchema,
  ApiAlertsStatusSchema,
} from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

export default function useAlerts(
  params: InferApiInput<typeof AlertsSchema, "GET">,
  options?: UseQueryOptions
) {
  return useApiQuery({
    queryKey: ["alerts", params],
    queryFn: () =>
      apiFetch("/api/alerts", AlertsSchema, {
        method: "GET",
        queryParams: params,
      }),
    ...options,
  })
}

export function useAlert({ alertId }: { alertId: string }) {
  return useApiQuery({
    queryKey: ["alert", alertId],
    queryFn: () =>
      apiFetch(`/api/alerts/${alertId}`, ApiAlertSchema, {
        method: "GET",
      }),
    enabled: false,
  })
}

export function usePatchAlert() {
  return useApiMutation({
    mutationFn: (
      params: InferApiInput<typeof ApiAlertsStatusSchema, "PATCH">
    ) =>
      apiFetch("/api/alerts/status", ApiAlertsStatusSchema, {
        method: "PATCH",
        body: params,
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({ queryKey: ["alerts"] })
    },
  })
}
