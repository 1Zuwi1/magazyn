import type {
  Backup as ApiBackup,
  BackupSchedule as ApiBackupSchedule,
} from "@/hooks/use-backups"
import type { AppTranslate } from "@/i18n/use-translations"
import type { BackupResourceType } from "@/lib/schemas"
import type {
  Backup,
  BackupSchedule,
  BackupStatus,
  ScheduleFrequency,
} from "./types"

const DAY_OF_WEEK_LABEL_KEYS = {
  1: "generated.admin.backups.weekdayMonday",
  2: "generated.admin.backups.weekdayTuesday",
  3: "generated.admin.backups.weekdayWednesday",
  4: "generated.admin.backups.weekdayThursday",
  5: "generated.admin.backups.weekdayFriday",
  6: "generated.admin.backups.weekdaySaturday",
  7: "generated.admin.backups.weekdaySunday",
} as const

export const DEFAULT_BACKUP_RESOURCE_TYPES: BackupResourceType[] = [
  "RACKS",
  "ITEMS",
  "ASSORTMENTS",
]

export const FREQUENCY_OPTIONS: ScheduleFrequency[] = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
]

export function mapApiBackupToViewModel(
  backup: ApiBackup,
  t: AppTranslate
): Backup {
  const progress =
    backup.status === "RESTORING"
      ? (backup.restoreProgressPercentage ?? null)
      : (backup.backupProgressPercentage ?? null)

  return {
    id: backup.id,
    name: t("generated.admin.backups.backupName", {
      value0: backup.id.toString(),
    }),
    createdAt: backup.createdAt,
    completedAt: backup.completedAt ?? null,
    sizeBytes: backup.sizeBytes ?? null,
    status: backup.status,
    type: backup.backupType,
    warehouseId: backup.warehouseId,
    warehouseName: backup.warehouseName,
    progress,
    resourceTypes: backup.resourceTypes,
  }
}

export function mapApiScheduleToViewModel(
  schedule: ApiBackupSchedule
): BackupSchedule {
  return {
    id: String(schedule.warehouseId ?? 0),
    warehouseId: schedule.warehouseId ?? 0,
    warehouseName: schedule.warehouseName ?? "",
    frequency: schedule.scheduleCode,
    backupHour: schedule.backupHour,
    dayOfWeek: schedule.dayOfWeek ?? null,
    dayOfMonth: schedule.dayOfMonth ?? null,
    enabled: schedule.enabled,
    lastBackupAt: schedule.lastRunAt ?? null,
    nextBackupAt: schedule.nextRunAt ?? null,
    resourceTypes: schedule.resourceTypes,
  }
}

const resolveWeekdayLabel = (
  dayOfWeek: number | null,
  t: AppTranslate
): string => {
  const translationKey = dayOfWeek
    ? DAY_OF_WEEK_LABEL_KEYS[dayOfWeek as keyof typeof DAY_OF_WEEK_LABEL_KEYS]
    : null
  return translationKey
    ? t(translationKey)
    : t("generated.admin.backups.weekdayMonday")
}

export function getFrequencyLabel(
  schedule: Pick<BackupSchedule, "dayOfMonth" | "dayOfWeek" | "frequency">,
  t: AppTranslate
): string {
  if (schedule.frequency === "DAILY") {
    return t("generated.admin.backups.frequencyDaily")
  }

  if (schedule.frequency === "WEEKLY") {
    return t("generated.admin.backups.frequencyWeekly", {
      value0: resolveWeekdayLabel(schedule.dayOfWeek, t),
    })
  }

  return t("generated.admin.backups.frequencyMonthly", {
    value0: (schedule.dayOfMonth ?? 1).toString(),
  })
}

const BACKUP_STATUS_CONFIG = {
  COMPLETED: {
    labelKey: "generated.admin.backups.statusCompleted",
    variant: "success",
  },
  FAILED: {
    labelKey: "generated.admin.backups.statusFailed",
    variant: "destructive",
  },
  IN_PROGRESS: {
    labelKey: "generated.admin.backups.statusInProgress",
    variant: "warning",
  },
  RESTORING: {
    labelKey: "generated.admin.backups.statusRestoring",
    variant: "secondary",
  },
} as const

export const getBackupStatusConfig = (
  status: BackupStatus,
  t: AppTranslate
) => {
  const statusConfig = BACKUP_STATUS_CONFIG[status]

  return {
    label: t(statusConfig.labelKey),
    variant: statusConfig.variant,
  }
}
