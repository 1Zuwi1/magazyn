import type { QueryClient, UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  type BackupAllSchema,
  BackupDetailsSchema,
  BackupRestoreAllSchema,
  BackupRestoreSchema,
  BackupScheduleByWarehouseSchema,
  BackupScheduleGlobalSchema,
  BackupSchedulesSchema,
  BackupsSchema,
} from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

export const BACKUPS_QUERY_KEY = ["backups"] as const
export const BACKUP_DETAILS_QUERY_KEY = [
  ...BACKUPS_QUERY_KEY,
  "details",
] as const
export const BACKUP_SCHEDULES_QUERY_KEY = [
  ...BACKUPS_QUERY_KEY,
  "schedules",
] as const
export const BACKUP_GLOBAL_SCHEDULE_QUERY_KEY = [
  ...BACKUP_SCHEDULES_QUERY_KEY,
  "global",
] as const

export type BackupsList = InferApiOutput<typeof BackupsSchema, "GET">
export type Backup = BackupsList["content"][number]
export type BackupDetails = InferApiOutput<typeof BackupDetailsSchema, "GET">
export type BackupSchedules = InferApiOutput<
  typeof BackupSchedulesSchema,
  "GET"
>
export type BackupSchedule = BackupSchedules[number]
export type GlobalBackupSchedule = InferApiOutput<
  typeof BackupScheduleGlobalSchema,
  "GET"
>
export type BackupCreateInput = InferApiInput<typeof BackupsSchema, "POST">
export type BackupListParams = InferApiInput<typeof BackupsSchema, "GET">
export type BackupScheduleUpsertInput = InferApiInput<
  typeof BackupScheduleByWarehouseSchema,
  "PUT"
>
export type BackupRestoreResult = InferApiOutput<
  typeof BackupRestoreSchema,
  "POST"
>
export type BackupRestoreAllResult = InferApiOutput<
  typeof BackupRestoreAllSchema,
  "POST"
>
export type BackupAllResult = InferApiOutput<typeof BackupAllSchema, "POST">

function invalidateBackupsCache(client: QueryClient): void {
  client.invalidateQueries({
    queryKey: BACKUPS_QUERY_KEY,
  })
}

export default function useBackups(
  params?: BackupListParams,
  options?: SafeQueryOptions<BackupsList>
): UseQueryResult<BackupsList, FetchError> {
  return useApiQuery({
    queryKey: [...BACKUPS_QUERY_KEY, params],
    queryFn: () =>
      apiFetch("/api/backups", BackupsSchema, {
        method: "GET",
        queryParams: params,
      }),
    refetchInterval: 10_000,
    ...options,
  })
}

export function useBackup(
  { backupId }: { backupId: number },
  options?: SafeQueryOptions<BackupDetails>
): UseQueryResult<BackupDetails, FetchError> {
  return useApiQuery({
    queryKey: [...BACKUP_DETAILS_QUERY_KEY, backupId],
    queryFn: () =>
      apiFetch(`/api/backups/${backupId}`, BackupDetailsSchema, {
        method: "GET",
      }),
    ...options,
  })
}

export function useBackupSchedules(
  options?: SafeQueryOptions<BackupSchedules>
): UseQueryResult<BackupSchedules, FetchError> {
  return useApiQuery({
    queryKey: BACKUP_SCHEDULES_QUERY_KEY,
    queryFn: () =>
      apiFetch("/api/backups/schedules", BackupSchedulesSchema, {
        method: "GET",
      }),
    ...options,
  })
}

export function useCreateBackup() {
  return useApiMutation({
    mutationFn: (params: BackupCreateInput) =>
      apiFetch("/api/backups", BackupsSchema, {
        method: "POST",
        body: params,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}

export function useDeleteBackup() {
  return useApiMutation({
    mutationFn: (backupId: number) =>
      apiFetch(`/api/backups/${backupId}`, BackupDetailsSchema, {
        method: "DELETE",
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}

export function useRestoreBackup() {
  return useApiMutation({
    mutationFn: (backupId: number) =>
      apiFetch(`/api/backups/${backupId}/restore`, BackupRestoreSchema, {
        method: "POST",
        body: null,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}

export function useRestoreAllWarehouses() {
  return useApiMutation({
    mutationFn: () =>
      apiFetch("/api/backups/restore-all", BackupRestoreAllSchema, {
        method: "POST",
        body: null,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}

export function useUpsertBackupSchedule() {
  return useApiMutation({
    mutationFn: ({
      warehouseId,
      ...params
    }: {
      warehouseId: number
    } & BackupScheduleUpsertInput) =>
      apiFetch(
        `/api/backups/schedules/${warehouseId}`,
        BackupScheduleByWarehouseSchema,
        {
          method: "PUT",
          body: params,
        }
      ),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}

export function useDeleteBackupSchedule() {
  return useApiMutation({
    mutationFn: (warehouseId: number) =>
      apiFetch(
        `/api/backups/schedules/${warehouseId}`,
        BackupScheduleByWarehouseSchema,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}

export function useUpsertGlobalBackupSchedule() {
  return useApiMutation({
    mutationFn: (params: BackupScheduleUpsertInput) =>
      apiFetch("/api/backups/schedules/global", BackupScheduleGlobalSchema, {
        method: "PUT",
        body: params,
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}

export function useDeleteGlobalBackupSchedule() {
  return useApiMutation({
    mutationFn: () =>
      apiFetch("/api/backups/schedules/global", BackupScheduleGlobalSchema, {
        method: "DELETE",
      }),
    onSuccess: (_, __, ___, context) => {
      invalidateBackupsCache(context.client)
    },
  })
}
