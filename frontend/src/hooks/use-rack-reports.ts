import { apiFetch, type InferApiInput } from "@/lib/fetcher"
import { RackReportsSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export default function useRackReports(
  params: InferApiInput<typeof RackReportsSchema, "GET">
) {
  return useApiQuery({
    queryKey: ["rack-reports"],
    queryFn: async () =>
      await apiFetch("/api/rack-reports", RackReportsSchema, {
        method: "GET",
        queryParams: params,
      }),
  })
}
