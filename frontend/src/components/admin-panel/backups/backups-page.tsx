"use client"

import {
  Add01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  DatabaseIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { addDays, addMonths, addWeeks } from "date-fns"
import { useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"
import { pluralize } from "@/components/dashboard/utils/helpers"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"
import { BackupDetailDialog } from "./components/backup-detail-dialog"
import { BackupsTable } from "./components/backups-table"
import { CreateBackupDialog } from "./components/create-backup-dialog"
import { ScheduleDialog } from "./components/schedule-dialog"
import { SchedulesSection } from "./components/schedules-section"
import { MOCK_BACKUPS, MOCK_SCHEDULES } from "./mock-data"
import type { Backup, BackupSchedule, ScheduleFrequency } from "./types"

const AVAILABLE_WAREHOUSES = MOCK_WAREHOUSES.map((w) => ({
  id: w.id,
  name: w.name,
}))

interface StatBadgeConfig {
  icon: IconSvgElement
  count: number
  label: string
  className?: string
}

function StatBadge({ icon, count, label, className = "" }: StatBadgeConfig) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 backdrop-blur-sm ${className}`}
    >
      <HugeiconsIcon className="size-3.5" icon={icon} />
      <span className="font-mono font-semibold">{count}</span>
      <span className="text-xs">{label}</span>
    </div>
  )
}

function nextBackupDate(
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

export function BackupsMain() {
  const [backups, setBackups] = useState<Backup[]>(MOCK_BACKUPS)
  const [schedules, setSchedules] = useState<BackupSchedule[]>(MOCK_SCHEDULES)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | undefined>()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [backupToDelete, setBackupToDelete] = useState<Backup | undefined>()

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [backupToRestore, setBackupToRestore] = useState<Backup | undefined>()

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<
    BackupSchedule | undefined
  >()

  const [createBackupDialogOpen, setCreateBackupDialogOpen] = useState(false)

  const handleViewBackup = (backup: Backup) => {
    setSelectedBackup(backup)
    setDetailOpen(true)
  }

  const handleDeleteBackup = (backup: Backup) => {
    setBackupToDelete(backup)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBackup = () => {
    if (backupToDelete) {
      setBackups((prev) => prev.filter((b) => b.id !== backupToDelete.id))
      setBackupToDelete(undefined)
    }
  }

  const handleRestoreBackup = (backup: Backup) => {
    setBackupToRestore(backup)
    setRestoreDialogOpen(true)
  }

  const confirmRestoreBackup = () => {
    if (backupToRestore) {
      setBackups((prev) =>
        prev.map((backup) =>
          backup.id === backupToRestore.id
            ? { ...backup, status: "RESTORING" as const }
            : backup
        )
      )
      setBackupToRestore(undefined)
    }
  }

  const handleCreateManualClick = () => {
    setCreateBackupDialogOpen(true)
  }

  const handleCreateManualConfirm = (
    warehouseId: string | null,
    warehouseName: string | null
  ) => {
    const newBackup: Backup = {
      id: Date.now(),
      name: `backup-${new Date().toISOString().slice(0, 10)}-manual`,
      createdAt: new Date().toISOString(),
      completedAt: null,
      sizeBytes: null,
      status: "PENDING",
      type: "MANUAL",
      warehouseId,
      warehouseName,
    }
    setBackups((prev) => [...prev, newBackup])
  }

  const handleRetryBackup = (backup: Backup) => {
    setBackups((prev) =>
      prev.map((b) =>
        b.id === backup.id
          ? {
              ...b,
              status: "PENDING" as const,
              createdAt: new Date().toISOString(),
              completedAt: null,
              sizeBytes: null,
            }
          : b
      )
    )
  }

  const handleAddSchedule = () => {
    setSelectedSchedule(undefined)
    setScheduleDialogOpen(true)
  }

  const handleEditSchedule = (schedule: BackupSchedule) => {
    setSelectedSchedule(schedule)
    setScheduleDialogOpen(true)
  }

  const handleToggleSchedule = (warehouseId: string | null) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.warehouseId === warehouseId
          ? {
              ...schedule,
              enabled: !schedule.enabled,
              nextBackupAt: nextBackupDate(
                schedule.frequency,
                schedule.customDays ?? null,
                !schedule.enabled
              ),
            }
          : schedule
      )
    )
  }

  const handleDeleteSchedule = (warehouseId: string | null) => {
    setSchedules((prev) =>
      prev.filter((schedule) => schedule.warehouseId !== warehouseId)
    )
  }

  const handleScheduleSubmit = (data: {
    warehouseId: string | null
    warehouseName: string
    frequency: ScheduleFrequency
    customDays: number | null
    enabled: boolean
  }) => {
    const nextBackupAt = nextBackupDate(
      data.frequency,
      data.customDays,
      data.enabled
    )
    const exists = schedules.some(
      (schedule) => schedule.warehouseId === data.warehouseId
    )
    if (exists) {
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.warehouseId === data.warehouseId
            ? {
                ...schedule,
                frequency: data.frequency,
                customDays: data.customDays,
                enabled: data.enabled,
                nextBackupAt,
              }
            : schedule
        )
      )
    } else {
      const newSchedule: BackupSchedule = {
        warehouseId: data.warehouseId,
        warehouseName: data.warehouseName,
        frequency: data.frequency,
        customDays: data.customDays,
        enabled: data.enabled,
        lastBackupAt: null,
        nextBackupAt,
      }
      setSchedules((prev) => [...prev, newSchedule])
    }
  }

  const completedCount = backups.filter(
    (backup) => backup.status === "COMPLETED"
  ).length
  const failedCount = backups.filter(
    (backup) => backup.status === "FAILED"
  ).length
  const pendingCount = backups.filter(
    (backup) => backup.status === "PENDING" || backup.status === "RESTORING"
  ).length
  const activeSchedules = schedules.filter(
    (schedule) => schedule.enabled
  ).length

  const statBadges: (StatBadgeConfig & { show: boolean })[] = [
    {
      icon: DatabaseIcon,
      count: backups.length,
      label: `${pluralize(backups.length, "kopia", "kopie", "kopii")}`,
      className: "bg-background/50 text-muted-foreground",
      show: true,
    },
    {
      icon: Tick02Icon,
      count: completedCount,
      label: "ukończonych",
      className:
        "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-500",
      show: completedCount > 0,
    },
    {
      icon: Cancel01Icon,
      count: failedCount,
      label: "błędów",
      className: "border-destructive/30 bg-destructive/5 text-destructive",
      show: failedCount > 0,
    },
    {
      icon: Clock01Icon,
      count: pendingCount,
      label: "w trakcie",
      className: "border-orange-500/30 bg-orange-500/5 text-orange-500",
      show: pendingCount > 0,
    },
    {
      icon: Calendar03Icon,
      count: activeSchedules,
      label: pluralize(
        activeSchedules,
        "harmonogram",
        "harmonogramy",
        "harmonogramów"
      ),
      className: "bg-background/50 text-muted-foreground",
      show: true,
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button onClick={handleCreateManualClick}>
            <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
            Utwórz kopię zapasową
          </Button>
        }
        description="Zarządzaj kopiami zapasowymi i harmonogramami"
        icon={DatabaseIcon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Kopie zapasowe"
      >
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
      </AdminPageHeader>

      <SchedulesSection
        onAdd={handleAddSchedule}
        onDelete={handleDeleteSchedule}
        onEdit={handleEditSchedule}
        onToggle={handleToggleSchedule}
        schedules={schedules}
      />

      <BackupsTable
        backups={backups}
        onCreateManual={handleCreateManualClick}
        onDelete={handleDeleteBackup}
        onRestore={handleRestoreBackup}
        onRetry={handleRetryBackup}
        onView={handleViewBackup}
      />

      <BackupDetailDialog
        backup={selectedBackup}
        onOpenChange={setDetailOpen}
        open={detailOpen}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć kopię zapasową "${backupToDelete?.name}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDeleteBackup}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Usuń kopię zapasową"
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz przywrócić dane z kopii "${backupToRestore?.name}"? Obecne dane zostaną nadpisane.`}
        onConfirm={confirmRestoreBackup}
        onOpenChange={setRestoreDialogOpen}
        open={restoreDialogOpen}
        title="Przywróć z kopii zapasowej"
      />

      <ScheduleDialog
        availableWarehouses={AVAILABLE_WAREHOUSES.filter(
          (w) => !schedules.some((s) => s.warehouseId === w.id)
        )}
        onOpenChange={setScheduleDialogOpen}
        onSubmit={handleScheduleSubmit}
        open={scheduleDialogOpen}
        schedule={selectedSchedule}
      />

      <CreateBackupDialog
        availableWarehouses={AVAILABLE_WAREHOUSES}
        onConfirm={handleCreateManualConfirm}
        onOpenChange={setCreateBackupDialogOpen}
        open={createBackupDialogOpen}
      />
    </div>
  )
}
