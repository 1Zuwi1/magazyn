"use client"

import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query"
import { apiFetch, FetchError, type InferApiOutput } from "@/lib/fetcher"
import { ApiMeSchema } from "@/lib/schemas"

export type Session = InferApiOutput<typeof ApiMeSchema, "GET">
export type SessionResult = Session | null

export const SESSION_QUERY_KEY = ["session"] as const
type SessionQueryKey = typeof SESSION_QUERY_KEY

const fetchSession = async (): Promise<SessionResult> => {
  try {
    return await apiFetch("/api/users/me", ApiMeSchema, { method: "GET" })
  } catch (error) {
    if (
      error instanceof FetchError &&
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
  useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    ...options,
  })
