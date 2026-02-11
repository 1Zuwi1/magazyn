import {
  GridViewIcon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWarehouseStore } from "./store"
import type { Rack3D } from "./types"

interface SidebarPanelProps {
  racks: Rack3D[]
}

function getOccupancyColor(percentage: number): {
  text: string
  bg: string
  bar: string
} {
  if (percentage >= 90) {
    return {
      text: "text-destructive",
      bg: "bg-destructive/10",
      bar: "bg-destructive",
    }
  }
  if (percentage >= 75) {
    return {
      text: "text-orange-500",
      bg: "bg-orange-500/10",
      bar: "bg-orange-500",
    }
  }
  if (percentage >= 50) {
    return {
      text: "text-primary",
      bg: "bg-primary/10",
      bar: "bg-primary",
    }
  }
  return {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
  }
}

export function SidebarPanel({ racks }: SidebarPanelProps) {
  const t = useTranslations()

  const { focusRack, selectedRackId, filters, setFilters } = useWarehouseStore()

  const filteredRacks = racks.filter(
    (rack) =>
      !filters.query ||
      rack.name.toLowerCase().includes(filters.query.toLowerCase()) ||
      rack.code.toLowerCase().includes(filters.query.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col border-r bg-linear-to-b from-background via-background to-muted/20">
      {/* Header with decorative pattern */}
      <div className="relative overflow-hidden border-b bg-linear-to-br from-primary/5 via-transparent to-transparent px-4 py-5">
        {/* Decorative grid pattern */}
        <div className="mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-30" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-5 text-primary"
              icon={GridViewIcon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-base tracking-tight">
              {t("generated.dashboard.visualization3d.value3dExplorer")}
            </h2>
            <p className="text-muted-foreground text-xs">
              {t("generated.dashboard.visualization3d.pluralLabel", {
                value0: racks.length,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-3">
        <div className="relative">
          <HugeiconsIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
          />
          <Input
            className="h-9 pl-9"
            onChange={(e) => {
              setFilters({ query: e.target.value })
            }}
            placeholder={t("generated.dashboard.visualization3d.searchRacks")}
            value={filters.query}
          />
        </div>
        {filters.query && (
          <p className="mt-2 text-muted-foreground text-xs">
            {t("generated.dashboard.visualization3d.foundRacks", {
              value0: filteredRacks.length.toString(),
              value1: racks.length.toString(),
            })}
          </p>
        )}
      </div>

      {/* Rack List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filteredRacks.map((rack) => {
          const occupiedCount = rack.items.filter(
            (item) => item !== null
          ).length
          const totalSlots = rack.grid.rows * rack.grid.cols
          const occupancy = Math.round((occupiedCount / totalSlots) * 100)
          const occupancyColors = getOccupancyColor(occupancy)
          const isSelected = selectedRackId === rack.id

          return (
            <Button
              className={cn(
                "group relative flex h-auto w-full flex-col items-start overflow-hidden rounded-xl border p-0 text-left transition-all duration-200",
                {
                  "border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20":
                    isSelected,
                  "border-border bg-card hover:border-muted-foreground/20 hover:bg-muted/50":
                    !isSelected,
                }
              )}
              key={rack.id}
              onClick={() => {
                focusRack(rack.id)
              }}
              variant="ghost"
            >
              {/* Content */}
              <div className="w-full p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isSelected ? "bg-primary/10" : "bg-muted"
                      )}
                    >
                      <HugeiconsIcon
                        className={cn(
                          "size-4 transition-colors",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                        icon={ViewIcon}
                      />
                    </div>
                    <div>
                      <span className="block font-semibold text-sm">
                        {rack.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {rack.code}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-bold font-mono text-xs",
                      occupancyColors.bg,
                      occupancyColors.text
                    )}
                  >
                    {occupancy}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {t("generated.dashboard.visualization3d.grid", {
                      value0: rack.grid.rows.toString(),
                      value1: rack.grid.cols.toString(),
                    })}
                  </span>
                  <span className="text-muted-foreground">
                    {t("generated.dashboard.visualization3d.slots", {
                      value0: occupiedCount.toString(),
                      value1: totalSlots.toString(),
                    })}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      occupancyColors.bar
                    )}
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
              </div>
            </Button>
          )
        })}

        {filteredRacks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon
                className="size-6 text-muted-foreground"
                icon={Search01Icon}
              />
            </div>
            <p className="font-medium text-muted-foreground text-sm">
              {t("generated.shared.results")}
            </p>
            <p className="text-muted-foreground/70 text-xs">
              {t("generated.dashboard.visualization3d.differentSearchPhrase")}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t bg-muted/30 p-4">
        <h3 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          {t("generated.dashboard.visualization3d.statusLegend")}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-emerald-500 shadow-sm" />
            <span className="text-muted-foreground">
              {t("generated.dashboard.shared.normal")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-orange-500 shadow-sm" />
            <span className="text-muted-foreground">
              {t("generated.dashboard.shared.expired")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-red-500 shadow-sm" />
            <span className="text-muted-foreground">
              {t("generated.dashboard.shared.dangerous")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-[linear-gradient(135deg,var(--color-red-500)_50%,var(--color-orange-500)_50%)] shadow-sm" />
            <span className="text-muted-foreground">
              {t("generated.dashboard.visualization3d.bothStatuses")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-slate-200 shadow-sm dark:bg-slate-700" />
            <span className="text-muted-foreground">
              {t("generated.dashboard.shared.emptyShelf")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-blue-500 shadow-sm ring-2 ring-blue-500/30" />
            <span className="text-muted-foreground">
              {t("generated.dashboard.visualization3d.chosen")}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
