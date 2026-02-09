import type { UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import { RackReportsSchema } from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiQuery } from "./use-api-query"

export type RackReportsList = InferApiOutput<typeof RackReportsSchema, "GET">

export default function useRackReports(
  params: InferApiInput<typeof RackReportsSchema, "GET">,
  options?: SafeQueryOptions<RackReportsList>
): UseQueryResult<RackReportsList, FetchError> {
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
