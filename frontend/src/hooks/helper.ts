import type { QueryKey, UseQueryOptions } from "@tanstack/react-query"
import type { FetchError } from "@/lib/fetcher"

export type SafeQueryOptions<
  TData,
  TError = FetchError,
  TKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TData, TError, TData, TKey>, "queryKey" | "queryFn">
