"use client"

import { Clock01Icon, DatabaseIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { formatDuration, intervalToDuration } from "date-fns"
import { useLocale } from "next-intl"
import { formatDateTime } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { useAppTranslations } from "@/i18n/use-translations"
import { formatBytes } from "../../lib/utils"
import type { Backup } from "../types"
import { BackupStatusBadge } from "./backup-status-badge"

interface DetailRowProps {
  label: string
  children: React.ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-2.5 odd:bg-muted/30">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm">{children}</span>
    </div>
  )
}

function formatBackupDuration(
  createdAt: string,
  completedAt: string | null,
  locale: string,
  fallbackLabel: string
): string {
  if (!completedAt) {
    return "—"
  }

  const duration = intervalToDuration({
    start: new Date(createdAt),
    end: new Date(completedAt),
  })

  return (
    formatDuration(duration, {
      locale: getDateFnsLocale(locale),
    }) || fallbackLabel
  )
}

interface BackupDetailDialogProps {
  backup: Backup | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackupDetailDialog({
  backup,
  open,
  onOpenChange,
}: BackupDetailDialogProps) {
  const t = useAppTranslations()
  const locale = useLocale()

  if (!backup) {
    return null
  }

  const isInProgress =
    backup.status === "IN_PROGRESS" || backup.status === "RESTORING"

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-5 text-primary"
              icon={DatabaseIcon}
            />
          </div>
          <div className="space-y-1.5">
            <DialogTitle>{backup.name}</DialogTitle>
            <DialogDescription>
              {t("generated.admin.backups.backupDetailsDescription")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        {isInProgress && backup.progress != null && (
          <div className="space-y-2 rounded-lg border bg-linear-to-br from-muted/40 to-muted/20 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {backup.status === "IN_PROGRESS"
                  ? t("generated.admin.backups.creatingBackupProgress")
                  : t("generated.admin.backups.restoringBackupProgress")}
              </span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {backup.progress}%
              </span>
            </div>
            <Progress className="h-2" value={backup.progress} />
          </div>
        )}

        <div className="space-y-1">
          <DetailRow label={t("generated.shared.status")}>
            <BackupStatusBadge status={backup.status} />
          </DetailRow>
          <DetailRow label={t("generated.admin.backups.typeLabel")}>
            <Badge variant="outline">
              {backup.type === "MANUAL"
                ? t("generated.admin.backups.typeManual")
                : t("generated.admin.backups.typeScheduled")}
            </Badge>
          </DetailRow>
          <DetailRow label={t("generated.shared.warehouse")}>
            {backup.warehouseName}
          </DetailRow>
          <DetailRow label={t("generated.admin.backups.sizeLabel")}>
            {backup.sizeBytes != null ? formatBytes(backup.sizeBytes) : "—"}
          </DetailRow>
          <DetailRow label={t("generated.shared.created")}>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon
                className="size-3.5 text-muted-foreground"
                icon={Clock01Icon}
              />
              {formatDateTime(backup.createdAt, locale)}
            </span>
          </DetailRow>
          <DetailRow label={t("generated.admin.backups.completedAtLabel")}>
            {backup.completedAt
              ? formatDateTime(backup.completedAt, locale)
              : "—"}
          </DetailRow>
          <DetailRow label={t("generated.admin.backups.durationLabel")}>
            {formatBackupDuration(
              backup.createdAt,
              backup.completedAt,
              locale,
              t("generated.admin.backups.durationLessThanSecond")
            )}
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  )
}
