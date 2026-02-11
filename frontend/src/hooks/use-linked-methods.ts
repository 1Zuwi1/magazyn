import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import { TFASchema } from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiQuery } from "./use-api-query"

export const LINKED_2FA_METHODS_QUERY_KEY = ["linked-2fa-methods"]
export type LinkedMethods = InferApiOutput<typeof TFASchema, "GET">

export default function useLinkedMethods(
  options?: SafeQueryOptions<LinkedMethods>
): UseQueryResult<LinkedMethods, FetchError> {
  return useApiQuery({
    queryKey: LINKED_2FA_METHODS_QUERY_KEY,
    queryFn: () => apiFetch("/api/2fa", TFASchema),
    ...options,
  })
}
