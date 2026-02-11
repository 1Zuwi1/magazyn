import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import { PasskeysSchema } from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiQuery } from "./use-api-query"

export const PASSKEYS_QUERY_KEY = ["passkeys"] as const
export type Passkeys = InferApiOutput<typeof PasskeysSchema, "GET">

export default function usePasskeys(
  options?: SafeQueryOptions<Passkeys>
): UseQueryResult<Passkeys, FetchError> {
  return useApiQuery({
    queryKey: PASSKEYS_QUERY_KEY,
    queryFn: () => apiFetch("/api/2fa/passkeys", PasskeysSchema),
    ...options,
  })
}
