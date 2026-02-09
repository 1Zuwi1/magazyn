import type { UseQueryOptions } from "@tanstack/react-query"
import { apiFetch } from "@/lib/fetcher"
import { PasskeysSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export const PASSKEYS_QUERY_KEY = ["passkeys"] as const

export default function usePasskeys(options?: UseQueryOptions) {
  return useApiQuery({
    queryKey: PASSKEYS_QUERY_KEY,
    queryFn: () => apiFetch("/api/2fa/passkeys", PasskeysSchema),
    ...options,
  })
}
