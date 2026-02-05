"use client"

import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query"
import { apiFetch, FetchError, type InferApiOutput } from "@/lib/fetcher"
import { ApiMeSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export type Session = InferApiOutput<typeof ApiMeSchema, "GET">
export type SessionResult = Session | null

export const SESSION_QUERY_KEY = ["session"] as const
type SessionQueryKey = typeof SESSION_QUERY_KEY

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
  options?: Omit<
    UseQueryOptions<SessionResult, FetchError, SessionResult, SessionQueryKey>,
    "queryKey" | "queryFn"
  >
): UseQueryResult<SessionResult, FetchError> =>
  useApiQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    ...options,
  })
