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
import { formatDateTime } from "../lib/utils"
import type { BackupSchedule, ScheduleFrequency } from "./types"

function frequencyLabel(schedule: BackupSchedule): string {
  const map: Record<ScheduleFrequency, string> = {
    DAILY: "Codziennie",
    WEEKLY: "Co tydzień",
    MONTHLY: "Co miesiąc",
    CUSTOM: `Co ${schedule.customDays} dni`,
  }
  return map[schedule.frequency]
}

interface SchedulesSectionProps {
  schedules: BackupSchedule[]
  onAdd: () => void
  onEdit: (schedule: BackupSchedule) => void
  onToggle: (warehouseId: string | null) => void
  onDelete: (warehouseId: string | null) => void
}

export function SchedulesSection({
  schedules,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: SchedulesSectionProps) {
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
        <Button onClick={onAdd} size="sm" variant="outline">
          <HugeiconsIcon className="mr-1.5 size-3.5" icon={Add01Icon} />
          Dodaj harmonogram
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
          <Card className="relative p-4" key={schedule.warehouseId}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-sm">
                    {schedule.warehouseName}
                  </span>
                  <Badge variant={schedule.enabled ? "success" : "secondary"}>
                    {schedule.enabled ? "Aktywny" : "Wyłączony"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <HugeiconsIcon className="size-3" icon={Calendar03Icon} />
                    {frequencyLabel(schedule)}
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
                      <HugeiconsIcon
                        className="mr-2 h-4 w-4"
                        icon={PencilIcon}
                      />
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(schedule.warehouseId)}
                    >
                      <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
