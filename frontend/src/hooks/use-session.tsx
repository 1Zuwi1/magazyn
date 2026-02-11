"use client"

import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, FetchError, type InferApiOutput } from "@/lib/fetcher"
import { ApiMeSchema, LogoutSchema } from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

export type Session = InferApiOutput<typeof ApiMeSchema, "GET">
export type SessionResult = Session | null

export const SESSION_QUERY_KEY = ["session"] as const

const fetchSession = async (): Promise<SessionResult> => {
  try {
    return await apiFetch("/api/users/me", ApiMeSchema, { method: "GET" })
  } catch (error) {
    if (
      FetchError.isError(error) &&
      (error.status === 401 || error.status === 403)
    ) {
      return null
    }
    throw error
  }
}

export const useSession = (
  options?: SafeQueryOptions<SessionResult>
): UseQueryResult<SessionResult, FetchError> =>
  useApiQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    ...options,
  })

export const useLogout = () => {
  return useApiMutation({
    mutationFn: async () => {
      await apiFetch("/api/auth/logout", LogoutSchema, {
        method: "POST",
        body: null,
      })
      return null
    },
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    },
  })
}
