import { addDays, addMonths, addWeeks } from "date-fns"
import { ScheduleFrequency, BackupStatus } from "./types"
export function nextBackupDate(
  frequency: ScheduleFrequency,
  customDays: number | null,
  enabled: boolean
): string | null {
  if (!enabled) {
    return null
  }

  const now = new Date()
  const nextDate: Record<ScheduleFrequency, Date> = {
    DAILY: addDays(now, 1),
    WEEKLY: addWeeks(now, 1),
    MONTHLY: addMonths(now, 1),
    CUSTOM: addDays(now, Math.max(1, customDays ?? 1)),
  }

  return nextDate[frequency].toISOString()
}


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

export const getBackupStatusConfig = (status: BackupStatus) => BACKUP_STATUS_CONFIG[status]
