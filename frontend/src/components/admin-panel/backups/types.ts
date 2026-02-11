import type {
  Backup as ApiBackup,
  BackupSchedule as ApiBackupSchedule,
} from "@/hooks/use-backups"
import type { BackupResourceType } from "@/lib/schemas"

export type BackupStatus = ApiBackup["status"]
export type ScheduleFrequency = ApiBackupSchedule["scheduleCode"]

export interface Backup {
  id: number
  name: string
  createdAt: string
  completedAt: string | null
  sizeBytes: number | null
  status: BackupStatus
  type: ApiBackup["backupType"]
  warehouseId: number
  warehouseName: string
  progress?: number | null
  resourceTypes: BackupResourceType[]
}

export interface BackupSchedule {
  id: string
  warehouseId: number | null
  warehouseName: string
  frequency: ScheduleFrequency
  backupHour: number
  dayOfWeek: number | null
  dayOfMonth: number | null
  enabled: boolean
  lastBackupAt: string | null
  nextBackupAt: string | null
  resourceTypes: BackupResourceType[]
}

export interface ScheduleSubmitPayload {
  warehouseId: number | null
  warehouseName: string
  frequency: ScheduleFrequency
  backupHour: number
  dayOfWeek: number | null
  dayOfMonth: number | null
  enabled: boolean
}
