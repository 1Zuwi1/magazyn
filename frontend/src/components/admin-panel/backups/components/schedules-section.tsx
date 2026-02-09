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
import { useEffect, useRef, useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
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
import { cn } from "@/lib/utils"
import { formatDateTime } from "../../lib/utils"
import { type BackupSchedule, getFrequencyLabel } from "../types"

interface SchedulesSectionProps {
  schedules: BackupSchedule[]
  onAdd: () => void
  onEdit: (schedule: BackupSchedule) => void
  onToggle: (warehouseId: string | null) => void
  onDelete: (warehouseId: string | null) => void
}

function SchedulesEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon
          className="size-6 text-muted-foreground"
          icon={Calendar03Icon}
        />
      </div>
      <h3 className="mb-1 font-semibold text-sm">Brak harmonogramów</h3>
      <p className="mb-4 max-w-sm text-muted-foreground text-sm">
        Nie masz jeszcze żadnych harmonogramów kopii zapasowych. Dodaj pierwszy
        harmonogram, aby automatycznie tworzyć kopie zapasowe.
      </p>
      <Button onClick={onAdd} size="sm" variant="outline">
        <HugeiconsIcon className="mr-1.5 size-3.5" icon={Add01Icon} />
        Dodaj harmonogram
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
          <h2 className="font-semibold text-sm">Harmonogramy</h2>
        </div>
        {schedules.length > 0 && (
          <Button onClick={onAdd} size="sm" variant="outline">
            <HugeiconsIcon className="mr-1.5 size-3.5" icon={Add01Icon} />
            Dodaj harmonogram
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
        description={`Czy na pewno chcesz usunąć harmonogram dla "${scheduleToDelete?.warehouseName}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDelete}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Usuń harmonogram"
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
  onToggle: (warehouseId: string | null) => void
  onDelete: (schedule: BackupSchedule) => void
}) {
  const [justToggled, setJustToggled] = useState(false)
  const prevEnabledRef = useRef(schedule.enabled)

  useEffect(() => {
    if (prevEnabledRef.current !== schedule.enabled) {
      prevEnabledRef.current = schedule.enabled
      setJustToggled(true)
      const timeout = setTimeout(() => setJustToggled(false), 600)
      return () => clearTimeout(timeout)
    }
  }, [schedule.enabled])

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
      key={schedule.warehouseId}
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
              {schedule.enabled ? "Aktywny" : "Wyłączony"}
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
              {getFrequencyLabel(schedule.frequency, schedule.customDays)}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <HugeiconsIcon className="size-3" icon={Clock01Icon} />
              Ostatnia: {formatDateTime(schedule.lastBackupAt)}
            </div>
            {schedule.nextBackupAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3" icon={Clock01Icon} />
                Następna: {formatDateTime(schedule.nextBackupAt)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Switch
            checked={schedule.enabled}
            className="cursor-pointer transition-all duration-300"
            onCheckedChange={() => onToggle(schedule.warehouseId)}
            size="sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Otwórz menu harmonogramu">
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
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(schedule)}
              >
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
