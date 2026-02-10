"use client"

import { Clock01Icon, DatabaseIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { formatDuration, intervalToDuration } from "date-fns"
import { pl } from "date-fns/locale"
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
import { formatBytes, formatDateTime } from "../../lib/utils"
import type { Backup } from "../types"
import { BackupStatusBadge } from "./backup-status-badge"

interface DetailRowProps {
  label: string
  children: React.ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm">{children}</span>
    </div>
  )
}

function formatBackupDuration(
  createdAt: string,
  completedAt: string | null
): string {
  if (!completedAt) {
    return "—"
  }

  const duration = intervalToDuration({
    start: new Date(createdAt),
    end: new Date(completedAt),
  })

  return formatDuration(duration, { locale: pl }) || "< 1 sek."
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
  if (!backup) {
    return null
  }

  const isInProgress =
    backup.status === "PENDING" || backup.status === "RESTORING"

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon
              className="size-5 text-primary"
              icon={DatabaseIcon}
            />
          </div>
          <div className="space-y-1.5">
            <DialogTitle>{backup.name}</DialogTitle>
            <DialogDescription>Szczegóły kopii zapasowej</DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        {isInProgress && backup.progress != null && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {backup.status === "PENDING"
                  ? "Tworzenie kopii..."
                  : "Przywracanie danych..."}
              </span>
              <span className="font-mono text-muted-foreground">
                {backup.progress}%
              </span>
            </div>
            <Progress className="h-2" value={backup.progress} />
          </div>
        )}

        <div className="space-y-1">
          <DetailRow label="Status">
            <BackupStatusBadge status={backup.status} />
          </DetailRow>
          <DetailRow label="Typ">
            <Badge variant="outline">
              {backup.type === "MANUAL" ? "Ręczny" : "Zaplanowany"}
            </Badge>
          </DetailRow>
          <DetailRow label="Magazyn">
            {backup.warehouseName ?? "Wszystkie"}
          </DetailRow>
          <DetailRow label="Rozmiar">
            {backup.sizeBytes != null ? formatBytes(backup.sizeBytes) : "—"}
          </DetailRow>
          <DetailRow label="Utworzony">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon
                className="size-3.5 text-muted-foreground"
                icon={Clock01Icon}
              />
              {formatDateTime(backup.createdAt)}
            </span>
          </DetailRow>
          <DetailRow label="Ukończony">
            {formatDateTime(backup.completedAt)}
          </DetailRow>
          <DetailRow label="Czas tworzenia kopii">
            {formatBackupDuration(backup.createdAt, backup.completedAt)}
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  )
}
