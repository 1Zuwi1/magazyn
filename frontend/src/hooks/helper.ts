import type {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseQueryOptions,
} from "@tanstack/react-query"
import type { FetchError } from "@/lib/fetcher"

export type SafeQueryOptions<
  TData,
  TError = FetchError,
  TKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TData, TError, TData, TKey>, "queryKey" | "queryFn">

export type SafeInfiniteQueryOptions<
  TQueryFnData,
  TPageParam,
  TError = FetchError,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  TKey extends QueryKey = QueryKey,
> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TKey, TPageParam>,
  "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
>
