"use client"

import {
  ArrowRight02Icon,
  Delete02Icon,
  MoreHorizontalCircle01FreeIcons,
  Package,
  PencilEdit01Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"

import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { getOccupancyPercentage } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { WarehousesList } from "@/hooks/use-warehouses"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import { THRESHOLD } from "../../lib/constants"

type WarehouseListItem = WarehousesList["content"][number]

interface WarehouseCardProps {
  warehouse: WarehouseListItem
  onEdit?: (warehouse: WarehouseListItem) => void
  onDelete?: (warehouse: WarehouseListItem) => void
}

export function WarehouseCard({
  warehouse,
  onEdit,
  onDelete,
}: WarehouseCardProps) {
  const usedSlots = warehouse.occupiedSlots
  const totalCapacity = warehouse.occupiedSlots + warehouse.freeSlots
  const occupancyPercentage = getOccupancyPercentage(usedSlots, totalCapacity)
  const isCritical = occupancyPercentage >= THRESHOLD

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
      {/* Decorative gradient */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br opacity-50",
          isCritical
            ? "from-destructive/5 via-transparent to-transparent"
            : "from-primary/5 via-transparent to-transparent"
        )}
      />

      {/* Grid pattern */}
      <div className="mask-[radial-gradient(ellipse_80%_80%_at_100%_0%,black_30%,transparent_70%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-20" />

      {/* Status indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 h-1 w-full transition-opacity",
          isCritical ? "bg-destructive" : "bg-primary",
          isCritical ? "opacity-60" : "opacity-0 group-hover:opacity-100"
        )}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                isCritical ? "bg-destructive/10" : "bg-primary/10"
              )}
            >
              <HugeiconsIcon
                className={cn(
                  "size-5",
                  isCritical ? "text-destructive" : "text-primary"
                )}
                icon={WarehouseIcon}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{warehouse.name}</h3>
              <p className="text-muted-foreground text-xs">
                {translateMessage("generated.m1095", { value0: warehouse.id })}
              </p>
            </div>
          </div>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={translateMessage("generated.m0321")}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md opacity-0 transition-all hover:bg-muted group-hover:opacity-100",
                  "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                )}
              >
                <HugeiconsIcon
                  className="size-5"
                  icon={MoreHorizontalCircle01FreeIcons}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onEdit(warehouse)}
                  >
                    <HugeiconsIcon
                      className="mr-2 size-4"
                      icon={PencilEdit01Icon}
                    />
                    {translateMessage("generated.m0934")}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => onDelete(warehouse)}
                  >
                    <HugeiconsIcon
                      className="mr-2 size-4"
                      icon={Delete02Icon}
                    />
                    {translateMessage("generated.m0230")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Occupancy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {translateMessage("generated.m0322")}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {usedSlots} / {totalCapacity}
                </span>
                <Badge variant={isCritical ? "destructive" : "secondary"}>
                  {Math.round(occupancyPercentage)}%
                </Badge>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isCritical ? "bg-destructive" : "bg-primary"
                )}
                style={{
                  width: `${Math.min(occupancyPercentage, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon className="size-4" icon={Package} />
              <span>
                {translateMessage("generated.m1064", {
                  value0: warehouse.racksCount,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t pt-4">
          <Link
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 font-medium text-sm transition-all",
              "hover:border-primary/30 hover:bg-muted"
            )}
            href={`/admin/warehouses/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
          >
            {translateMessage("generated.m0325")}
            <HugeiconsIcon
              className="size-4 transition-transform group-hover:translate-x-0.5"
              icon={ArrowRight02Icon}
            />
          </Link>
        </div>
      </div>
    </div>
  )
}
