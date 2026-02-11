"use client"

import {
  Add01Icon,
  DatabaseIcon,
  DatabaseRestoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  useBackupAllWarehouses,
  useBackupSchedules,
  useCreateBackup,
  useDeleteBackup,
  useDeleteBackupSchedule,
  useRestoreAllWarehouses,
  useRestoreBackup,
  useUpsertBackupSchedule,
} from "@/hooks/use-backups"
import useWarehouses from "@/hooks/use-warehouses"
import { useAppTranslations } from "@/i18n/use-translations"
import { AdminPageHeader } from "../components/admin-page-header"
import { ConfirmDialog } from "../components/dialogs"
import { BackupDetailDialog } from "./components/backup-detail-dialog"
import { BackupsHeaderStats } from "./components/backups-header-stats"
import { BackupsTable } from "./components/backups-table"
import { CreateBackupDialog } from "./components/create-backup-dialog"
import { ScheduleDialog } from "./components/schedule-dialog"
import { SchedulesSection } from "./components/schedules-section"
import type { Backup, BackupSchedule, ScheduleSubmitPayload } from "./types"
import {
  DEFAULT_BACKUP_RESOURCE_TYPES,
  mapApiScheduleToViewModel,
} from "./utils"

export function BackupsMain() {
  const t = useAppTranslations()
  const { data: schedulesData, isLoading: isSchedulesLoading } =
    useBackupSchedules()
  const { data: warehousesSummaryData } = useWarehouses({
    page: 0,
    size: 1,
  })

  const createBackupMutation = useCreateBackup()
  const backupAllWarehousesMutation = useBackupAllWarehouses()
  const restoreAllWarehousesMutation = useRestoreAllWarehouses()
  const deleteBackupMutation = useDeleteBackup()
  const restoreBackupMutation = useRestoreBackup()
  const upsertScheduleMutation = useUpsertBackupSchedule()
  const deleteScheduleMutation = useDeleteBackupSchedule()

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
  const [restoreAllDialogOpen, setRestoreAllDialogOpen] = useState(false)

  const schedules = useMemo(
    () => (schedulesData ?? []).map(mapApiScheduleToViewModel),
    [schedulesData]
  )
  const usedScheduleWarehouseIds = useMemo(
    () => schedules.map((schedule) => schedule.warehouseId),
    [schedules]
  )

  const handleViewBackup = (backup: Backup) => {
    setSelectedBackup(backup)
    setDetailOpen(true)
  }

  const handleDeleteBackup = (backup: Backup) => {
    setBackupToDelete(backup)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBackup = async () => {
    if (!backupToDelete) {
      return
    }

    await deleteBackupMutation.mutateAsync(backupToDelete.id)
    toast.success(
      t("generated.admin.backups.backupDeletedToast", {
        value0: backupToDelete.name,
      })
    )
    setBackupToDelete(undefined)
  }

  const handleRestoreBackup = (backup: Backup) => {
    setBackupToRestore(backup)
    setRestoreDialogOpen(true)
  }

  const confirmRestoreBackup = async () => {
    if (!backupToRestore) {
      return
    }

    await restoreBackupMutation.mutateAsync(backupToRestore.id)
    toast.success(
      t("generated.admin.backups.backupRestoreStartedToast", {
        value0: backupToRestore.name,
      })
    )
    setBackupToRestore(undefined)
  }

  const handleRestoreAllWarehouses = async () => {
    const result = await restoreAllWarehousesMutation.mutateAsync()
    toast.success(
      t("generated.admin.backups.restoreAllStartedToast", {
        value0: result.successful.length,
      })
    )
  }

  const handleCreateManualConfirm = async (
    warehouseId: number | null,
    warehouseName: string | null
  ) => {
    if (warehouseId == null) {
      const createdBackups = await backupAllWarehousesMutation.mutateAsync()
      toast.success(
        t("generated.admin.backups.backupAllStartedToast", {
          value0: createdBackups.length,
        })
      )
      return
    }

    await createBackupMutation.mutateAsync({
      warehouseId,
      resourceTypes: DEFAULT_BACKUP_RESOURCE_TYPES,
    })
    toast.success(
      t("generated.admin.backups.backupCreateStartedToast", {
        value0: warehouseName ?? t("generated.shared.warehouse"),
      })
    )
  }

  const handleRetryBackup = async (backup: Backup) => {
    await createBackupMutation.mutateAsync({
      warehouseId: backup.warehouseId,
      resourceTypes:
        backup.resourceTypes.length > 0
          ? backup.resourceTypes
          : DEFAULT_BACKUP_RESOURCE_TYPES,
    })
    toast.success(
      t("generated.admin.backups.backupRetryStartedToast", {
        value0: backup.name,
      })
    )
  }

  const handleAddSchedule = () => {
    const totalWarehouses = warehousesSummaryData?.totalElements

    if (totalWarehouses != null && schedules.length >= totalWarehouses) {
      toast.info(t("generated.admin.backups.noWarehousesForSchedule"))
      return
    }

    setSelectedSchedule(undefined)
    setScheduleDialogOpen(true)
  }

  const handleEditSchedule = (schedule: BackupSchedule) => {
    setSelectedSchedule(schedule)
    setScheduleDialogOpen(true)
  }

  const handleToggleSchedule = async (
    warehouseId: number,
    schedule: BackupSchedule
  ) => {
    const nextEnabled = !schedule.enabled

    await upsertScheduleMutation.mutateAsync({
      warehouseId,
      scheduleCode: schedule.frequency,
      backupHour: schedule.backupHour,
      dayOfWeek: schedule.dayOfWeek ?? undefined,
      dayOfMonth: schedule.dayOfMonth ?? undefined,
      resourceTypes:
        schedule.resourceTypes.length > 0
          ? schedule.resourceTypes
          : DEFAULT_BACKUP_RESOURCE_TYPES,
      enabled: nextEnabled,
    })

    toast.success(
      nextEnabled
        ? t("generated.admin.backups.scheduleEnabledToast", {
            value0: schedule.warehouseName,
          })
        : t("generated.admin.backups.scheduleDisabledToast", {
            value0: schedule.warehouseName,
          })
    )
  }

  const handleDeleteSchedule = async (warehouseId: number) => {
    const scheduleToDelete = schedules.find(
      (schedule) => schedule.warehouseId === warehouseId
    )

    await deleteScheduleMutation.mutateAsync(warehouseId)

    if (scheduleToDelete) {
      toast.success(
        t("generated.admin.backups.scheduleDeletedToast", {
          value0: scheduleToDelete.warehouseName,
        })
      )
    }
  }

  const handleScheduleSubmit = async (data: ScheduleSubmitPayload) => {
    const existingSchedule = schedules.find(
      (schedule) => schedule.warehouseId === data.warehouseId
    )

    await upsertScheduleMutation.mutateAsync({
      warehouseId: data.warehouseId,
      scheduleCode: data.frequency,
      backupHour: data.backupHour,
      dayOfWeek: data.dayOfWeek ?? undefined,
      dayOfMonth: data.dayOfMonth ?? undefined,
      resourceTypes: existingSchedule?.resourceTypes.length
        ? existingSchedule.resourceTypes
        : DEFAULT_BACKUP_RESOURCE_TYPES,
      enabled: data.enabled,
    })

    toast.success(
      existingSchedule
        ? t("generated.admin.backups.scheduleUpdatedToast", {
            value0: data.warehouseName,
          })
        : t("generated.admin.backups.scheduleCreatedToast", {
            value0: data.warehouseName,
          })
    )
  }

  const isCreateBackupPending =
    createBackupMutation.isPending || backupAllWarehousesMutation.isPending
  const isRestoreAllPending = restoreAllWarehousesMutation.isPending
  const isScheduleMutationPending =
    upsertScheduleMutation.isPending || deleteScheduleMutation.isPending
  const isAnyMutationPending =
    isCreateBackupPending || isRestoreAllPending || isScheduleMutationPending

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button
              disabled={isAnyMutationPending}
              onClick={() => setRestoreAllDialogOpen(true)}
              variant="outline"
            >
              <HugeiconsIcon
                className="mr-2 size-4"
                icon={DatabaseRestoreIcon}
              />
              {t("generated.admin.backups.restoreAllTitle")}
            </Button>
            <Button
              disabled={isAnyMutationPending}
              onClick={() => setCreateBackupDialogOpen(true)}
            >
              <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
              {t("generated.admin.backups.createBackupTitle")}
            </Button>
          </div>
        }
        description={t("generated.admin.backups.pageDescription")}
        icon={DatabaseIcon}
        title={t("generated.shared.backups")}
      >
        <BackupsHeaderStats />
      </AdminPageHeader>

      <SchedulesSection
        isLoading={isSchedulesLoading}
        onAdd={handleAddSchedule}
        onDelete={(warehouseId) => {
          handleDeleteSchedule(warehouseId).catch(() => undefined)
        }}
        onEdit={handleEditSchedule}
        onToggle={(warehouseId, schedule) => {
          handleToggleSchedule(warehouseId, schedule).catch(() => undefined)
        }}
        schedules={schedules}
      />

      <BackupsTable
        onCreateManual={() => setCreateBackupDialogOpen(true)}
        onDelete={handleDeleteBackup}
        onRestore={handleRestoreBackup}
        onRetry={(backup) => {
          handleRetryBackup(backup).catch(() => undefined)
        }}
        onView={handleViewBackup}
      />

      <BackupDetailDialog
        backup={selectedBackup}
        onOpenChange={setDetailOpen}
        open={detailOpen}
      />

      <ConfirmDialog
        description={t("generated.admin.backups.deleteBackupDescription", {
          value0: backupToDelete?.name,
        })}
        onConfirm={() => {
          confirmDeleteBackup().catch(() => undefined)
        }}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title={t("generated.admin.backups.deleteBackupTitle")}
      />

      <ConfirmDialog
        description={t("generated.admin.backups.restoreBackupDescription", {
          value0: backupToRestore?.name,
        })}
        onConfirm={() => {
          confirmRestoreBackup().catch(() => undefined)
        }}
        onOpenChange={setRestoreDialogOpen}
        open={restoreDialogOpen}
        title={t("generated.admin.backups.restoreBackupTitle")}
      />

      <ConfirmDialog
        description={t("generated.admin.backups.restoreAllDescription")}
        onConfirm={() => {
          handleRestoreAllWarehouses().catch(() => undefined)
        }}
        onOpenChange={setRestoreAllDialogOpen}
        open={restoreAllDialogOpen}
        title={t("generated.admin.backups.restoreAllTitle")}
      />

      <ScheduleDialog
        isSubmitting={isScheduleMutationPending}
        onOpenChange={setScheduleDialogOpen}
        onSubmit={(payload) => {
          handleScheduleSubmit(payload).catch(() => undefined)
        }}
        open={scheduleDialogOpen}
        schedule={selectedSchedule}
        usedWarehouseIds={usedScheduleWarehouseIds}
      />

      <CreateBackupDialog
        isSubmitting={isCreateBackupPending}
        onConfirm={(warehouseId, warehouseName) => {
          handleCreateManualConfirm(warehouseId, warehouseName).catch(
            () => undefined
          )
        }}
        onOpenChange={setCreateBackupDialogOpen}
        open={createBackupDialogOpen}
      />
    </div>
  )
}
