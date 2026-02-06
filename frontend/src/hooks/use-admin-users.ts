import type { UseQueryResult } from "@tanstack/react-query"
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

interface AdminUsersListParams {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: "asc" | "desc"
}

export default function useAdminUsers(
  {
    page = 0,
    size = 20,
    sortBy = "id",
    sortDir = "asc",
  }: AdminUsersListParams = {
    page: 0,
    size: 20,
    sortBy: "id",
    sortDir: "asc",
  }
): UseQueryResult<AdminUsersList, FetchError> {
  return useApiQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, { page, size, sortBy, sortDir }],
    queryFn: async () => {
      return await apiFetch("/api/users", AdminUsersSchema, {
        queryParams: {
          page,
          size,
          sortBy,
          sortDir,
        },
      })
    },
  })
}

export function useAdminUserTeams() {
  return useApiQuery({
    queryKey: ADMIN_USER_TEAMS_QUERY_KEY,
    queryFn: async () => {
      return await apiFetch("/api/users/teams", AdminUserTeamsSchema, {
        method: "GET",
      })
    },
  })
}

export function useUpdateAdminUserProfile() {
  return useApiMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: number
      body: UpdateAdminUserProfileInput
    }) => {
      return await apiFetch(
        `/api/users/${userId}/profile`,
        AdminUpdateUserProfileSchema,
        {
          method: "PATCH",
          body,
        }
      )
    },
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ADMIN_USERS_QUERY_KEY,
      })
      context.client.invalidateQueries({
        queryKey: SESSION_QUERY_KEY,
      })
    },
  })
}

export function useChangeAdminUserEmail() {
  return useApiMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: number
      body: ChangeAdminUserEmailInput
    }) => {
      return await apiFetch(
        `/api/users/${userId}/email`,
        AdminChangeUserEmailSchema,
        {
          method: "PATCH",
          body,
        }
      )
    },
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ADMIN_USERS_QUERY_KEY,
      })
      context.client.invalidateQueries({
        queryKey: SESSION_QUERY_KEY,
      })
    },
  })
}

export function useDeleteAdminUser() {
  return useApiMutation({
    mutationFn: async (userId: number) => {
      return await apiFetch(`/api/users/${userId}`, AdminDeleteUserSchema, {
        method: "DELETE",
      })
    },
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ADMIN_USERS_QUERY_KEY,
      })
      context.client.invalidateQueries({
        queryKey: SESSION_QUERY_KEY,
      })
    },
  })
}
