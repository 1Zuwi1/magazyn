"use client"

import {
  Add01Icon,
  Calendar03Icon,
  Clock01Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { formatDateTime } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"

import type { BackupSchedule } from "../types"
import { getFrequencyLabel } from "../utils"

interface SchedulesSectionProps {
  schedules: BackupSchedule[]
  onAdd: () => void
  onEdit: (schedule: BackupSchedule) => void
  onToggle: (warehouseId: number, schedule: BackupSchedule) => void
  onDelete: (warehouseId: number) => void
}

function SchedulesEmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useAppTranslations()

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon
          className="size-6 text-muted-foreground"
          icon={Calendar03Icon}
        />
      </div>
      <h3 className="mb-1 font-semibold text-sm">
        {t("generated.admin.backups.noSchedulesTitle")}
      </h3>
      <p className="mb-4 max-w-sm text-muted-foreground text-sm">
        {t("generated.admin.backups.noSchedulesDescription")}
      </p>
      <Button onClick={onAdd} size="sm" variant="outline">
        <HugeiconsIcon className="mr-1.5 size-3.5" icon={Add01Icon} />
        {t("generated.admin.backups.addScheduleTitle")}
      </Button>
    </div>
  )
}

export function SchedulesSection({
  schedules,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: SchedulesSectionProps) {
  const t = useAppTranslations()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<
    BackupSchedule | undefined
  >()

  const handleDeleteClick = (schedule: BackupSchedule) => {
    setScheduleToDelete(schedule)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (scheduleToDelete) {
      onDelete(scheduleToDelete.warehouseId)
      setScheduleToDelete(undefined)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            className="size-4 text-muted-foreground"
            icon={Calendar03Icon}
          />
          <h2 className="font-semibold text-sm">
            {t("generated.admin.backups.schedulesSectionTitle")}
          </h2>
        </div>
        {schedules.length > 0 && (
          <Button onClick={onAdd} size="sm" variant="outline">
            <HugeiconsIcon className="mr-1.5 size-3.5" icon={Add01Icon} />
            {t("generated.admin.backups.addScheduleTitle")}
          </Button>
        )}
      </div>

      {schedules.length === 0 ? (
        <SchedulesEmptyState onAdd={onAdd} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.warehouseId}
              onDelete={handleDeleteClick}
              onEdit={onEdit}
              onToggle={onToggle}
              schedule={schedule}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        description={t("generated.admin.backups.deleteScheduleDescription", {
          value0: scheduleToDelete?.warehouseName,
        })}
        onConfirm={confirmDelete}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title={t("generated.admin.backups.deleteScheduleTitle")}
      />
    </div>
  )
}

function ScheduleCard({
  schedule,
  onEdit,
  onToggle,
  onDelete,
}: {
  schedule: BackupSchedule
  onEdit: (schedule: BackupSchedule) => void
  onToggle: (warehouseId: number, schedule: BackupSchedule) => void
  onDelete: (schedule: BackupSchedule) => void
}) {
  const t = useAppTranslations()
  const locale = useLocale()
  const [justToggled, setJustToggled] = useState(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setJustToggled(true)
    const timeout = setTimeout(() => setJustToggled(false), 600)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-in-out",
        !schedule.enabled && "bg-muted/30 opacity-60",
        schedule.enabled && "opacity-100",
        justToggled &&
          schedule.enabled &&
          "scale-[1.02] shadow-md ring-2 ring-green-500/40",
        justToggled &&
          !schedule.enabled &&
          "scale-[0.98] ring-2 ring-muted-foreground/20"
      )}
      key={schedule.id}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate font-medium text-sm transition-colors duration-500",
                !schedule.enabled && "text-muted-foreground"
              )}
            >
              {schedule.warehouseName}
            </span>
            <Badge
              className="transition-all duration-500"
              variant={schedule.enabled ? "success" : "secondary"}
            >
              {schedule.enabled
                ? t("generated.shared.active")
                : t("generated.shared.disabled")}
            </Badge>
          </div>

          <div
            className={cn(
              "space-y-1 transition-opacity duration-500",
              !schedule.enabled && "opacity-60"
            )}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <HugeiconsIcon className="size-3" icon={Calendar03Icon} />
              {getFrequencyLabel(schedule, t)}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <HugeiconsIcon className="size-3" icon={Clock01Icon} />
              {t("generated.admin.backups.lastBackupLabel")}:{" "}
              {schedule.lastBackupAt
                ? formatDateTime(schedule.lastBackupAt, locale)
                : "—"}
            </div>
            {schedule.nextBackupAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3" icon={Clock01Icon} />
                {t("generated.admin.backups.nextBackupLabel")}:{" "}
                {formatDateTime(schedule.nextBackupAt, locale)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Switch
            checked={schedule.enabled}
            className="cursor-pointer transition-all duration-300"
            onCheckedChange={() => onToggle(schedule.warehouseId, schedule)}
            size="sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("generated.admin.backups.openScheduleMenu")}
            >
              <HugeiconsIcon
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-xs" })
                )}
                icon={MoreHorizontalIcon}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(schedule)}>
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
                {t("generated.shared.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(schedule)}
              >
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
                {t("generated.shared.remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
