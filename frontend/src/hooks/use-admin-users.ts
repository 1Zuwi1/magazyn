import type { QueryClient, UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  AdminChangeUserEmailSchema,
  AdminDeleteUserSchema,
  AdminUpdateUserProfileSchema,
  AdminUsersSchema,
  AdminUserTeamsSchema,
} from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"
import { SESSION_QUERY_KEY } from "./use-session"

const ADMIN_USERS_QUERY_KEY = ["admin-users"] as const
const ADMIN_USER_TEAMS_QUERY_KEY = ["admin-user-teams"] as const

export type AdminUsersList = InferApiOutput<typeof AdminUsersSchema, "GET">
export type AdminUser = AdminUsersList["content"][number]
export type AdminTeamOption = InferApiOutput<
  typeof AdminUserTeamsSchema,
  "GET"
>[number]
export type UpdateAdminUserProfileInput = InferApiInput<
  typeof AdminUpdateUserProfileSchema,
  "PATCH"
>
export type ChangeAdminUserEmailInput = InferApiInput<
  typeof AdminChangeUserEmailSchema,
  "PATCH"
>

type UseAdminUsersParams = InferApiInput<typeof AdminUsersSchema, "GET">

const normalizeAdminUsersParams = (
  params: UseAdminUsersParams
): UseAdminUsersParams => {
  const normalizedName = params.name?.trim() || undefined
  const normalizedEmail = params.email?.trim() || undefined

  return {
    ...params,
    page: params.page ?? 0,
    size: params.size ?? 20,
    sortBy: params.sortBy ?? "id",
    sortDir: params.sortDir ?? "asc",
    name: normalizedName,
    email: normalizedEmail,
  }
}

export default function useAdminUsers(
  params: UseAdminUsersParams = {}
): UseQueryResult<AdminUsersList, FetchError> {
  const queryParams = normalizeAdminUsersParams(params)

  return useApiQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, queryParams],
    queryFn: () =>
      apiFetch("/api/users", AdminUsersSchema, {
        method: "GET",
        queryParams,
      }),
  })
}

export function useAdminUserTeams() {
  return useApiQuery({
    queryKey: ADMIN_USER_TEAMS_QUERY_KEY,
    queryFn: () =>
      apiFetch("/api/users/teams", AdminUserTeamsSchema, {
        method: "GET",
      }),
  })
}

const invalidateAdminUsersCache = (client: QueryClient): void => {
  client.invalidateQueries({
    queryKey: ADMIN_USERS_QUERY_KEY,
  })
  client.invalidateQueries({
    queryKey: SESSION_QUERY_KEY,
  })
}

export function useUpdateAdminUserProfile() {
  return useApiMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: number
      body: UpdateAdminUserProfileInput
    }) =>
      apiFetch(`/api/users/${userId}/profile`, AdminUpdateUserProfileSchema, {
        method: "PATCH",
        body,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateAdminUsersCache(context.client)
    },
  })
}

export function useChangeAdminUserEmail() {
  return useApiMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: number
      body: ChangeAdminUserEmailInput
    }) =>
      apiFetch(`/api/users/${userId}/email`, AdminChangeUserEmailSchema, {
        method: "PATCH",
        body,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateAdminUsersCache(context.client)
    },
  })
}

export function useDeleteAdminUser() {
  return useApiMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/api/users/${userId}`, AdminDeleteUserSchema, {
        method: "DELETE",
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateAdminUsersCache(context.client)
    },
  })
}
