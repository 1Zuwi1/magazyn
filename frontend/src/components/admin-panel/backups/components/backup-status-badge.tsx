"use client"

import { Badge } from "@/components/ui/badge"
import { type BackupStatus, getBackupStatusConfig } from "../types"

interface BackupStatusBadgeProps {
  status: BackupStatus
}

function PulsingDots() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5">
      <span className="size-1 animate-bounce rounded-full bg-current" />
      <span
        className="size-1 animate-bounce rounded-full bg-current"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="size-1 animate-bounce rounded-full bg-current"
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

export function BackupStatusBadge({ status }: BackupStatusBadgeProps) {
  const { label, variant } = getBackupStatusConfig(status)
  const isPending = status === "PENDING"
  const isRestoring = status === "RESTORING"

  return (
    <Badge variant={variant}>
      {label}
      {isPending && <PulsingDots />}
      {isRestoring && <RestoreSpinner />}
    </Badge>
  )
}
