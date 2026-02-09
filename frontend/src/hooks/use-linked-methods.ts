import type { UseQueryOptions } from "@tanstack/react-query"
import { apiFetch } from "@/lib/fetcher"
import { TFASchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export const LINKED_2FA_METHODS_QUERY_KEY = ["linked-2fa-methods"]

export default function useLinkedMethods(options?: UseQueryOptions) {
  return useApiQuery({
    queryKey: LINKED_2FA_METHODS_QUERY_KEY,
    queryFn: () => apiFetch("/api/2fa", TFASchema),
    ...options,
  })
}
