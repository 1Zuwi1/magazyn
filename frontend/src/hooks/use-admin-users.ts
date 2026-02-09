import type {
  QueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query"
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
  AdminUpdateUserStatusSchema,
  AdminUsersSchema,
  AdminUsersWarehouseAssignmentSchema,
  AdminUserTeamsSchema,
} from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
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
type AdminUsersParams = InferApiInput<typeof AdminUsersSchema, "GET">
type AdminUserTeamsQueryKey = typeof ADMIN_USER_TEAMS_QUERY_KEY

export default function useAdminUsers(
  params: AdminUsersParams,
  options?: SafeQueryOptions<AdminUsersList>
): UseQueryResult<AdminUsersList, FetchError> {
  return useApiQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params],
    queryFn: () =>
      apiFetch("/api/users", AdminUsersSchema, {
        method: "GET",
        queryParams: params,
      }),
    ...options,
  })
}

export function useAdminUserTeams(
  options?: Omit<
    UseQueryOptions<
      AdminTeamOption[],
      FetchError,
      AdminTeamOption[],
      AdminUserTeamsQueryKey
    >,
    "queryKey" | "queryFn"
  >
): UseQueryResult<AdminTeamOption[], FetchError> {
  return useApiQuery({
    queryKey: ADMIN_USER_TEAMS_QUERY_KEY,
    queryFn: () =>
      apiFetch("/api/users/teams", AdminUserTeamsSchema, {
        method: "GET",
      }),
    ...options,
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

export function useUpdateAdminUserStatus() {
  return useApiMutation({
    mutationFn: ({
      userId,
      ...params
    }: InferApiInput<typeof AdminUpdateUserStatusSchema, "PATCH"> & {
      userId: number
    }) =>
      apiFetch(`/api/users/${userId}/status`, AdminUpdateUserStatusSchema, {
        method: "PATCH",
        body: params,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateAdminUsersCache(context.client)
    },
  })
}

export function useUsersWarehouseAssignments() {
  return useApiMutation({
    mutationFn: (
      params: InferApiInput<typeof AdminUsersWarehouseAssignmentSchema, "POST">
    ) =>
      apiFetch(
        "/api/users/warehouse-assignments",
        AdminUsersWarehouseAssignmentSchema,
        {
          method: "POST",
          body: params,
        }
      ),
    onSuccess: (_, __, ___, context) => {
      invalidateAdminUsersCache(context.client)
    },
  })
}

export function useUsersWarehouseAssignmentsDelete() {
  return useApiMutation({
    mutationFn: (
      params: InferApiInput<
        typeof AdminUsersWarehouseAssignmentSchema,
        "DELETE"
      >
    ) =>
      apiFetch(
        "/api/users/warehouse-assignments",
        AdminUsersWarehouseAssignmentSchema,
        {
          method: "DELETE",
          body: params,
        }
      ),
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
