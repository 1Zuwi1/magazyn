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
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"

import type { BackupSchedule } from "../types"
import { getFrequencyLabel } from "../utils"

interface SchedulesSectionProps {
  schedules: BackupSchedule[]
  isLoading?: boolean
  onAdd: () => void
  onEdit: (schedule: BackupSchedule) => void
  onToggle: (warehouseId: number, schedule: BackupSchedule) => void
  onDelete: (warehouseId: number) => void
}

function SchedulesEmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useAppTranslations()

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-linear-to-br from-muted/30 via-background to-muted/20 px-6 py-14 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,var(--primary)/0.03,transparent_70%)]" />
      <div className="relative">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/80 ring-1 ring-border">
          <HugeiconsIcon
            className="size-6 text-muted-foreground"
            icon={Calendar03Icon}
          />
        </div>
      </div>
      <h3 className="relative mb-1.5 font-semibold text-sm">
        {t("generated.admin.backups.noSchedulesTitle")}
      </h3>
      <p className="relative mb-5 max-w-sm text-muted-foreground text-sm">
        {t("generated.admin.backups.noSchedulesDescription")}
      </p>
      <Button className="relative" onClick={onAdd} size="sm" variant="outline">
        <HugeiconsIcon className="mr-1.5 size-3.5" icon={Add01Icon} />
        {t("generated.admin.backups.addScheduleTitle")}
      </Button>
    </div>
  )
}

function ScheduleCardSkeleton() {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-muted" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-44" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-5 w-8 rounded-full" />
          <Skeleton className="size-7 rounded-md" />
        </div>
      </div>
    </Card>
  )
}

export function SchedulesSection({
  schedules,
  isLoading,
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

  const getContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <ScheduleCardSkeleton key={`skeleton-${String(i)}`} />
          ))}
        </div>
      )
    }

    if (schedules.length === 0) {
      return <SchedulesEmptyState onAdd={onAdd} />
    }

    return (
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
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-1 rounded-full bg-primary/60" />
          <HugeiconsIcon
            className="size-4 text-muted-foreground"
            icon={Calendar03Icon}
          />
          <h2 className="font-semibold text-base">
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

      {getContent()}

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
        "relative overflow-hidden p-4 transition-all duration-500 ease-in-out",
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
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 transition-colors duration-500",
          schedule.enabled
            ? "bg-linear-to-r from-green-500/60 via-green-400/40 to-green-500/10"
            : "bg-linear-to-r from-muted-foreground/20 via-muted-foreground/10 to-transparent"
        )}
      />
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
