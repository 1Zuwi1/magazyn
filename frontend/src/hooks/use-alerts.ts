import { apiFetch, type InferApiInput } from "@/lib/fetcher"
import { AlertsSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export default function useAlerts(
  params: InferApiInput<typeof AlertsSchema, "GET">
) {
  return useApiQuery({
    queryKey: ["alerts", params],
    queryFn: async () =>
      await apiFetch("/api/alerts", AlertsSchema, {
        method: "GET",
        queryParams: params,
      }),
  })
}
