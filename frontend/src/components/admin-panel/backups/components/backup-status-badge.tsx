"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BackupStatus } from "../types"
import { getBackupStatusConfig } from "../utils"

interface BackupStatusBadgeProps {
  status: BackupStatus
}

function PulsingDots() {
  return (
    <span className="ml-1.5 inline-flex items-center gap-[3px]">
      <span className="size-[3px] animate-bounce rounded-full bg-current opacity-80" />
      <span
        className="size-[3px] animate-bounce rounded-full bg-current opacity-80"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="size-[3px] animate-bounce rounded-full bg-current opacity-80"
        style={{ animationDelay: "0.3s" }}
      />
    </span>
  )
}

function RestoreSpinner() {
  return (
    <span className="relative ml-1 inline-flex size-3">
      <span className="absolute inset-0 rounded-full border-[1.5px] border-current opacity-25" />
      <span className="absolute inset-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
    </span>
  )
}

function StatusDot({ status }: { status: BackupStatus }) {
  const dotColor = {
    COMPLETED: "bg-green-500",
    FAILED: "bg-destructive",
    IN_PROGRESS: "bg-orange-500",
    RESTORING: "bg-primary",
  }[status]

  const isPulsing = status === "IN_PROGRESS" || status === "RESTORING"

  return (
    <span className="relative mr-0.5 inline-flex size-1.5">
      {isPulsing && (
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-40",
            dotColor
          )}
        />
      )}
      <span className={cn("relative size-1.5 rounded-full", dotColor)} />
    </span>
  )
}

export function BackupStatusBadge({ status }: BackupStatusBadgeProps) {
  const t = useTranslations()
  const { label, variant } = getBackupStatusConfig(status, t)
  const isInProgress = status === "IN_PROGRESS"
  const isRestoring = status === "RESTORING"

  return (
    <Badge variant={variant}>
      <StatusDot status={status} />
      {label}
      {isInProgress && <PulsingDots />}
      {isRestoring && <RestoreSpinner />}
    </Badge>
  )
}
