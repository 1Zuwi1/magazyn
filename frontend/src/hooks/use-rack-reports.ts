import type { UseQueryOptions } from "@tanstack/react-query"
import { apiFetch, type InferApiInput } from "@/lib/fetcher"
import { RackReportsSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export default function useRackReports(
  params: InferApiInput<typeof RackReportsSchema, "GET">,
  options?: UseQueryOptions
) {
  return useApiQuery({
    queryKey: ["rack-reports", params],
    queryFn: async () =>
      await apiFetch("/api/rack-reports", RackReportsSchema, {
        method: "GET",
        queryParams: params,
      }),
    ...options,
  })
}
