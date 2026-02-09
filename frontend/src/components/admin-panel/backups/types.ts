export type BackupStatus = "COMPLETED" | "FAILED" | "PENDING" | "RESTORING"

export const BACKUP_STATUS_CONFIG: Record<
  BackupStatus,
  {
    label: string
    variant: "success" | "destructive" | "warning" | "secondary"
  }
> = {
  COMPLETED: { label: "Ukończony", variant: "success" },
  FAILED: { label: "Błąd", variant: "destructive" },
  PENDING: { label: "W trakcie", variant: "warning" },
  RESTORING: { label: "Przywracanie", variant: "secondary" },
}

export const getBackupStatusConfig = (status: BackupStatus) =>
  BACKUP_STATUS_CONFIG[status]

export type ScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM"

export const FREQUENCY_CONFIG: Record<ScheduleFrequency, { label: string }> = {
  DAILY: { label: "Codziennie" },
  WEEKLY: { label: "Co tydzień" },
  MONTHLY: { label: "Co miesiąc" },
  CUSTOM: { label: "Własne" },
}

export const getFrequencyLabel = (
  frequency: ScheduleFrequency,
  customDays?: number | null
): string =>
  frequency === "CUSTOM"
    ? `Co ${customDays ?? 1} dni`
    : FREQUENCY_CONFIG[frequency].label

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
}

export interface BackupSchedule {
  warehouseId: string | null
  warehouseName: string
  frequency: ScheduleFrequency
  customDays?: number | null
  enabled: boolean
  lastBackupAt: string | null
  nextBackupAt: string | null
}
