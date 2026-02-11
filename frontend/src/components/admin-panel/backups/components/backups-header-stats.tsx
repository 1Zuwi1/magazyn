import {
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  DatabaseIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { useMemo } from "react"
import useBackups, { useBackupSchedules } from "@/hooks/use-backups"
import { useAppTranslations } from "@/i18n/use-translations"
import { BACKUPS_PAGE_SIZE } from "../lib/backups-table-query"
import { mapApiBackupToViewModel, mapApiScheduleToViewModel } from "../utils"
import { StatBadge, type StatBadgeConfig } from "./stat-badge"

export function BackupsHeaderStats() {
  const t = useAppTranslations()
  const { data: backupsData } = useBackups({
    page: 0,
    size: BACKUPS_PAGE_SIZE,
  })
  const { data: schedulesData } = useBackupSchedules()

  const backups = useMemo(
    () =>
      (backupsData?.content ?? []).map((backup) =>
        mapApiBackupToViewModel(backup, t)
      ),
    [backupsData?.content, t]
  )
  const schedules = useMemo(
    () => (schedulesData ?? []).map(mapApiScheduleToViewModel),
    [schedulesData]
  )
  const totalBackups = backupsData?.totalElements ?? 0

  const statBadges = useMemo(() => {
    const completedCount = backups.filter(
      (backup) => backup.status === "COMPLETED"
    ).length
    const failedCount = backups.filter(
      (backup) => backup.status === "FAILED"
    ).length
    const pendingCount = backups.filter(
      (backup) =>
        backup.status === "IN_PROGRESS" || backup.status === "RESTORING"
    ).length
    const activeSchedules = schedules.filter(
      (schedule) => schedule.enabled
    ).length

    return [
      {
        icon: DatabaseIcon,
        count: totalBackups,
        label: t("generated.admin.backups.backupsCountLabel", {
          value0: totalBackups,
        }),
        className: "bg-background/50 text-muted-foreground",
        show: true,
      },
      {
        icon: Tick02Icon,
        count: completedCount,
        label: t("generated.admin.backups.completedCountLabel"),
        className:
          "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-500",
        show: completedCount > 0,
      },
      {
        icon: Cancel01Icon,
        count: failedCount,
        label: t("generated.admin.backups.failedCountLabel"),
        className: "border-destructive/30 bg-destructive/5 text-destructive",
        show: failedCount > 0,
      },
      {
        icon: Clock01Icon,
        count: pendingCount,
        label: t("generated.admin.backups.inProgressCountLabel"),
        className: "border-orange-500/30 bg-orange-500/5 text-orange-500",
        show: pendingCount > 0,
      },
      {
        icon: Calendar03Icon,
        count: activeSchedules,
        label: t("generated.admin.backups.schedulesCountLabel", {
          value0: activeSchedules,
        }),
        className: "bg-background/50 text-muted-foreground",
        show: true,
      },
    ] as (StatBadgeConfig & { show: boolean })[]
  }, [backups, schedules, t, totalBackups])

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {statBadges
        .filter((badge) => badge.show)
        .map((badge) => (
          <StatBadge
            className={badge.className}
            count={badge.count}
            icon={badge.icon}
            key={badge.label}
            label={badge.label}
          />
        ))}
    </div>
  )
}
