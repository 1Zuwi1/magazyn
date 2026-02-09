"use client"

import { Badge } from "@/components/ui/badge"
import { type BackupStatus, getBackupStatusConfig } from "./types"

interface BackupStatusBadgeProps {
  status: BackupStatus
}

export function BackupStatusBadge({ status }: BackupStatusBadgeProps) {
  const { label, variant } = getBackupStatusConfig(status)
  return <Badge variant={variant}>{label}</Badge>
}
