"use client"

import { Clock01Icon, DatabaseIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatBytes, formatDateTime } from "../lib/utils"
import { type Backup, getBackupStatusConfig } from "./types"

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
            <DialogDescription>
              Szczegóły kopii zapasowej #{backup.id}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-1">
          <DetailRow label="Status">
            <Badge variant={getBackupStatusConfig(backup.status).variant}>
              {getBackupStatusConfig(backup.status).label}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
