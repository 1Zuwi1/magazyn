import {
  Analytics01Icon,
  CheckmarkCircle02Icon,
  GridViewIcon,
  InformationCircleIcon,
  PackageIcon,
  SquareLock02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { ItemPhoto } from "@/components/ui/item-photo"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import type { IconComponent } from "../types"
import { useWarehouseStore } from "./store"
import type { Item3D, Rack3D, Warehouse3D } from "./types"
import { RACK_ZONE_SIZE } from "./types"

interface DetailsPanelProps {
  warehouse: Warehouse3D
}

const STATUS_TEXT_KEYS: Record<Item3D["status"], string> = {
  normal: "warehouseVisualization.statusLabels.normal",
  expired: "warehouseVisualization.statusLabels.expired",
  "expired-dangerous": "warehouseVisualization.statusLabels.expiredDangerous",
  dangerous: "warehouseVisualization.statusLabels.dangerous",
}

function getStatusText(status: Item3D["status"]): string {
  return translateMessage(STATUS_TEXT_KEYS[status])
}

function getStatusColor(status: Item3D["status"]): {
  dot: string
  bg: string
  text: string
} {
  if (status === "normal") {
    return {
      dot: "bg-emerald-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
    }
  }
  if (status === "expired") {
    return {
      dot: "bg-amber-500",
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
    }
  }
  if (status === "expired-dangerous") {
    return {
      dot: "bg-red-500 ring-2 ring-amber-400",
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
    }
  }
  return {
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  }
}

function getOccupancyColor(percentage: number): {
  text: string
  bg: string
  bar: string
  label: string
} {
  if (percentage >= 90) {
    return {
      text: "text-destructive",
      bg: "bg-destructive/10",
      bar: "bg-destructive",
      label: translateMessage("generated.dashboard.shared.critical"),
    }
  }
  if (percentage >= 75) {
    return {
      text: "text-orange-500",
      bg: "bg-orange-500/10",
      bar: "bg-orange-500",
      label: translateMessage("generated.dashboard.shared.high"),
    }
  }
  if (percentage >= 50) {
    return {
      text: "text-primary",
      bg: "bg-primary/10",
      bar: "bg-primary",
      label: translateMessage("generated.dashboard.shared.moderate"),
    }
  }
  return {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
    label: translateMessage("generated.dashboard.shared.low"),
  }
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: IconComponent
  label: string
  value: number | string
  color: string
  bgColor: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border bg-card/50 px-3 py-3 transition-colors hover:bg-muted/30">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          bgColor
        )}
      >
        <HugeiconsIcon className={cn("size-4", color)} icon={icon} />
      </div>
      <span className="font-bold font-mono text-lg">{value}</span>
      <span className="text-center text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

function OverviewContent({ warehouse }: { warehouse: Warehouse3D }) {
  const totalSlots = warehouse.racks.reduce(
    (sum: number, rack: Rack3D) => sum + rack.grid.rows * rack.grid.cols,
    0
  )
  const totalItems = warehouse.racks.reduce(
    (sum: number, rack: Rack3D) =>
      sum + rack.items.filter((item) => item !== null).length,
    0
  )
  const occupiedSlots = totalItems
  const freeSlots = totalSlots - occupiedSlots
  const occupancyPercentage =
    totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0
  const occupancyColors = getOccupancyColor(occupancyPercentage)

  return (
    <div className="flex h-full flex-col border-l bg-linear-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-linear-to-br from-primary/5 via-transparent to-transparent px-4 py-5">
        <div className="mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-30" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-5 text-primary"
              icon={Analytics01Icon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-base tracking-tight">
              {translateMessage(
                "generated.dashboard.visualization3d.warehouseReview"
              )}
            </h2>
            <p className="text-muted-foreground text-xs">
              {translateMessage(
                "generated.dashboard.visualization3d.statisticsSummary"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Occupancy Gauge */}
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {translateMessage(
                "generated.dashboard.visualization3d.totalOccupancy"
              )}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-medium text-xs",
                occupancyColors.bg,
                occupancyColors.text
              )}
            >
              {occupancyColors.label}
            </span>
          </div>
          <span
            className={cn("font-bold font-mono text-2xl", occupancyColors.text)}
          >
            {occupancyPercentage}%
          </span>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              occupancyColors.bar
            )}
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>

        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <StatCard
          bgColor="bg-muted"
          color="text-muted-foreground"
          icon={GridViewIcon}
          label={translateMessage("generated.dashboard.shared.racks")}
          value={warehouse.racks.length}
        />
        <StatCard
          bgColor="bg-primary/10"
          color="text-primary"
          icon={PackageIcon}
          label={translateMessage("generated.dashboard.shared.capacity")}
          value={totalSlots}
        />
        <StatCard
          bgColor="bg-muted"
          color="text-muted-foreground"
          icon={SquareLock02Icon}
          label={translateMessage(
            "generated.dashboard.visualization3d.occupied"
          )}
          value={occupiedSlots}
        />
        <StatCard
          bgColor="bg-emerald-500/10"
          color="text-emerald-500"
          icon={CheckmarkCircle02Icon}
          label={translateMessage("generated.dashboard.shared.free")}
          value={freeSlots}
        />
      </div>
    </div>
  )
}

export function DetailsPanel({ warehouse }: DetailsPanelProps) {
  const { mode, selectedRackId, selectedShelf, clearSelection, focusWindow } =
    useWarehouseStore()

  const selectedRack = warehouse.racks.find(
    (rack: Rack3D) => rack.id === selectedRackId
  )

  const selectedItem =
    selectedShelf && selectedRack
      ? (selectedRack.items[selectedShelf.index] ?? null)
      : null
  const isLargeGrid = selectedRack
    ? selectedRack.grid.rows > RACK_ZONE_SIZE ||
      selectedRack.grid.cols > RACK_ZONE_SIZE
    : false
  const showBlockHint = isLargeGrid && !focusWindow

  if (mode === "overview") {
    return <OverviewContent warehouse={warehouse} />
  }

  const rackOccupancy = selectedRack
    ? Math.round(
        (selectedRack.items.filter((item) => item !== null).length /
          (selectedRack.grid.rows * selectedRack.grid.cols)) *
          100
      )
    : 0
  const occupancyColors = getOccupancyColor(rackOccupancy)

  return (
    <div className="flex h-full flex-col border-l bg-linear-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-linear-to-br from-primary/5 via-transparent to-transparent px-4 py-4">
        <div className="mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-30" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={InformationCircleIcon}
              />
            </div>
            <div>
              <h2 className="font-semibold text-base tracking-tight">
                {translateMessage("generated.dashboard.shared.rackDetails")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {selectedRack?.name ??
                  translateMessage("generated.shared.selectRack")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rack Info */}
      {selectedRack && (
        <div className="space-y-4 p-4">
          {/* Rack Card */}
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <HugeiconsIcon
                  className="size-4 text-primary"
                  icon={GridViewIcon}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-sm">
                  {selectedRack.name}
                </h3>
                <p className="font-mono text-muted-foreground text-xs">
                  {selectedRack.code}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-bold font-mono text-xs",
                  occupancyColors.bg,
                  occupancyColors.text
                )}
              >
                {rackOccupancy}%
              </span>
            </div>

            <div className="space-y-2 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {translateMessage("generated.dashboard.visualization3d.net")}
                </span>
                <span className="font-mono font-semibold">
                  {selectedRack.grid.rows}×{selectedRack.grid.cols}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {translateMessage(
                    "generated.dashboard.visualization3d.allPlaces"
                  )}
                </span>
                <span className="font-mono font-semibold">
                  {selectedRack.grid.rows * selectedRack.grid.cols}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {translateMessage("generated.dashboard.shared.occupied")}
                </span>
                <span className="font-mono font-semibold">
                  {selectedRack.items.filter((item) => item !== null).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {translateMessage(
                    "generated.dashboard.visualization3d.maxSize"
                  )}
                </span>
                <span className="font-mono font-semibold">
                  {translateMessage(
                    "generated.dashboard.visualization3d.maxMm",
                    {
                      value0: selectedRack.maxElementSize.width,
                      value1: selectedRack.maxElementSize.height,
                      value2: selectedRack.maxElementSize.depth,
                    }
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Shelf Info */}
          {selectedShelf && (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <HugeiconsIcon
                      className="size-4 text-blue-500"
                      icon={Tag01Icon}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">
                      {translateMessage("generated.dashboard.shared.rowShelf", {
                        value0: selectedShelf.row + 1,
                        value1: selectedShelf.col + 1,
                      })}
                    </h4>
                  </div>
                </div>
                <Button onClick={clearSelection} size="sm" variant="ghost">
                  {translateMessage("generated.shared.clear")}
                </Button>
              </div>

              {selectedItem ? (
                <div className="p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className={`size-3 rounded-full ${getStatusColor(selectedItem.status).dot}`}
                    />
                    <span
                      className={cn(
                        "font-medium text-sm",
                        getStatusColor(selectedItem.status).text
                      )}
                    >
                      {getStatusText(selectedItem.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {translateMessage("generated.dashboard.shared.id")}
                      </span>
                      <span className="font-mono">{selectedItem.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {translateMessage("generated.shared.name")}
                      </span>
                      <span className="font-medium">{selectedItem.label}</span>
                    </div>
                  </div>

                  <ItemPhoto
                    alt={selectedItem.label}
                    containerClassName="mt-4 min-h-20"
                    src={selectedItem.imageUrl}
                    zoomable
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon
                      className="size-6 text-muted-foreground"
                      icon={PackageIcon}
                    />
                  </div>
                  <p className="font-medium text-muted-foreground text-sm">
                    {translateMessage("generated.dashboard.shared.emptyShelf")}
                  </p>
                  <p className="text-muted-foreground/70 text-xs">
                    {translateMessage(
                      "generated.dashboard.shared.itemPosition"
                    )}
                    <br />
                    {translateMessage("generated.dashboard.shared.rowShelf", {
                      value0: selectedShelf.row + 1,
                      value1: selectedShelf.col + 1,
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Hint when no shelf selected */}
          {!selectedShelf && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  className="size-6 text-muted-foreground"
                  icon={InformationCircleIcon}
                />
              </div>
              <p className="font-medium text-muted-foreground text-sm">
                {showBlockHint
                  ? `Kliknij blok ${RACK_ZONE_SIZE}×${RACK_ZONE_SIZE}`
                  : translateMessage("generated.dashboard.shared.clickShelf")}
              </p>
              <p className="text-muted-foreground/70 text-xs">
                {translateMessage("generated.dashboard.shared.seeItemDetails")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
