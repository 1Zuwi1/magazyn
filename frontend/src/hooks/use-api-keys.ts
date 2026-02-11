import type { QueryClient, UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import { ApiKeyDetailsSchema, ApiKeysSchema } from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

export const API_KEYS_QUERY_KEY = ["api-keys"] as const
export const API_KEY_DETAILS_QUERY_KEY = [
  ...API_KEYS_QUERY_KEY,
  "details",
] as const

export type ApiKeysList = InferApiOutput<typeof ApiKeysSchema, "GET">
export type ApiKey = ApiKeysList[number]
export type ApiKeyDetails = InferApiOutput<typeof ApiKeyDetailsSchema, "GET">
export type CreateApiKeyInput = InferApiInput<typeof ApiKeysSchema, "POST">

const invalidateApiKeysCache = (client: QueryClient): void => {
  client.invalidateQueries({
    queryKey: API_KEYS_QUERY_KEY,
  })
}

export default function useApiKeys(
  options?: SafeQueryOptions<ApiKeysList>
): UseQueryResult<ApiKeysList, FetchError> {
  return useApiQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: () =>
      apiFetch("/api/api-keys", ApiKeysSchema, {
        method: "GET",
      }),
    ...options,
  })
}

export function useApiKey(
  { apiKeyId }: { apiKeyId: number },
  options?: SafeQueryOptions<ApiKeyDetails>
): UseQueryResult<ApiKeyDetails, FetchError> {
  return useApiQuery({
    queryKey: [...API_KEY_DETAILS_QUERY_KEY, apiKeyId],
    queryFn: () =>
      apiFetch(`/api/api-keys/${apiKeyId}`, ApiKeyDetailsSchema, {
        method: "GET",
      }),
    ...options,
  })
}

export function useCreateApiKey() {
  return useApiMutation({
    mutationFn: (params: CreateApiKeyInput) =>
      apiFetch("/api/api-keys", ApiKeysSchema, {
        method: "POST",
        body: params,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateApiKeysCache(context.client)
    },
  })
}

export function useDeleteApiKey() {
  return useApiMutation({
    mutationFn: (apiKeyId: number) =>
      apiFetch(`/api/api-keys/${apiKeyId}`, ApiKeyDetailsSchema, {
        method: "DELETE",
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateApiKeysCache(context.client)
    },
  })
}
