export type BackupStatus = "COMPLETED" | "FAILED" | "PENDING" | "RESTORING"

export type ScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM"

export interface Backup {
  id: number
  name: string
  createdAt: string
  completedAt: string | null
  sizeBytes: number | null
  status: BackupStatus
  type: "MANUAL" | "SCHEDULED"
  warehouseId: string | null
  warehouseName: string | null
  progress?: number
}

export interface BackupSchedule {
  id: string
  warehouseId: string | null
  warehouseName: string
  frequency: ScheduleFrequency
  customDays?: number | null
  enabled: boolean
  lastBackupAt: string | null
  nextBackupAt: string | null
}

export interface AvailableWarehouse {
  id: string
  name: string
}
