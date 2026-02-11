"use client"

import {
  Alert02Icon,
  Delete02Icon,
  GridIcon,
  MoreHorizontalCircle01FreeIcons,
  Package,
  PencilEdit01Icon,
  ThermometerIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Rack } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { THRESHOLD } from "../../lib/constants"

interface RackCardProps {
  rack: Rack
  onEdit?: (rack: Rack) => void
  onDelete?: (rack: Rack) => void
}

function RackCard({ rack, onEdit, onDelete }: RackCardProps) {
  const t = useTranslations()

  const hasActions = onEdit || onDelete
  const isCritical = rack.occupiedSlots / rack.totalSlots >= THRESHOLD
  const isOverweight = rack.totalWeight > rack.maxWeight
  const hasWarning = isCritical || isOverweight

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
      {/* Decorative gradient */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br opacity-50",
          hasWarning
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
          hasWarning ? "bg-destructive" : "bg-primary",
          hasWarning ? "opacity-60" : "opacity-0 group-hover:opacity-100"
        )}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                hasWarning ? "bg-destructive/10" : "bg-primary/10"
              )}
            >
              <HugeiconsIcon
                className={cn(
                  "size-5",
                  hasWarning ? "text-destructive" : "text-primary"
                )}
                icon={GridIcon}
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-lg">{rack.marker}</h3>
              <p className="truncate text-muted-foreground text-xs">
                {t("generated.admin.warehouses.id", {
                  value0: rack.id,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isCritical ? "destructive" : "secondary"}>
              {rack.occupiedSlots}/{rack.totalSlots}
            </Badge>
            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={t("generated.admin.warehouses.bookcaseActions")}
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
                      onClick={() => onEdit(rack)}
                    >
                      <HugeiconsIcon
                        className="mr-2 size-4"
                        icon={PencilEdit01Icon}
                      />
                      {t("generated.shared.edit")}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => onDelete(rack)}
                    >
                      <HugeiconsIcon
                        className="mr-2 size-4"
                        icon={Delete02Icon}
                      />
                      {t("generated.shared.remove")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content - Specs */}
        <div className="mt-4 space-y-3">
          {/* Dimensions */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon className="size-4" icon={GridIcon} />
              <span>
                {t("generated.admin.warehouses.dimensionsRowsColumns")}
              </span>
            </div>
            <span className="font-medium font-mono">
              {rack.sizeY} × {rack.sizeX}
            </span>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon className="size-4" icon={ThermometerIcon} />
              <span>{t("generated.shared.temperature")}</span>
            </div>
            <span className="font-medium font-mono">
              {t("generated.shared.cC", {
                value0: rack.minTemp,
                value1: rack.maxTemp,
              })}
            </span>
          </div>

          {/* Weight */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon className="size-4" icon={WeightScale01Icon} />
              <span>{t("generated.shared.weight")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn("font-medium font-mono", {
                  "text-destructive": isOverweight,
                })}
              >
                {t("generated.admin.warehouses.kg", {
                  value0: rack.totalWeight,
                  value1: rack.maxWeight,
                })}
              </span>
              {isOverweight && (
                <Badge className="text-[10px]" variant="destructive">
                  {t("generated.admin.warehouses.overload")}
                </Badge>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon className="size-4" icon={Package} />
              <span>{t("generated.shared.items")}</span>
            </div>
            <span className="font-medium font-mono">{rack.occupiedSlots}</span>
          </div>

          {/* Dangerous */}
          <div
            className={cn("flex items-center justify-between text-sm", {
              "**:text-destructive!": rack.acceptsDangerous,
            })}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon className="size-4" icon={Alert02Icon} />
              <span>{t("generated.admin.warehouses.acceptsDangerous")}</span>
            </div>
            <span className="font-medium font-mono">
              {rack.acceptsDangerous
                ? t("generated.admin.shared.yes")
                : t("generated.admin.shared.label")}
            </span>
          </div>

          {/* Comment if present */}
          {rack.comment && (
            <div className="mt-2 border-t pt-3">
              <p className="line-clamp-2 text-muted-foreground text-xs italic">
                "{rack.comment}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface RackGridProps {
  racks: Rack[]
  onEdit?: (rack: Rack) => void
  onDelete?: (rack: Rack) => void
}

export function RackGrid({ racks, onEdit, onDelete }: RackGridProps) {
  const t = useTranslations()

  if (racks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-16">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-7 text-muted-foreground"
            icon={GridIcon}
          />
        </div>
        <p className="mt-4 font-medium text-foreground">
          {t("generated.shared.racks")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.admin.warehouses.addFirstRackGetStarted")}
        </p>
      </div>
    )
  }

  return (
    <div className="@container">
      <div className="grid @xl:grid-cols-2 gap-4">
        {racks.map((rack) => (
          <RackCard
            key={rack.id}
            onDelete={onDelete}
            onEdit={onEdit}
            rack={rack}
          />
        ))}
      </div>
    </div>
  )
}
