import {
  InformationCircleIcon,
  PackageIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { useTranslations } from "next-intl"
import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Rack, RackAssortment } from "@/lib/schemas"
import type { SlotCoordinates } from "../types"
import { getSlotCoordinate } from "../utils/helpers"

interface RackShelfDetailsCardProps {
  rack: Rack
  selectedSlotCoordinates: SlotCoordinates | null
  assortment: RackAssortment | null
  onClearSelection: () => void
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

export function RackShelfDetailsCard({
  rack,
  selectedSlotCoordinates,
  assortment,
  onClearSelection,
}: RackShelfDetailsCardProps) {
  const t = useTranslations()

  const hasSelection = selectedSlotCoordinates !== null
  const selectedPosition = selectedSlotCoordinates
    ? {
        row: selectedSlotCoordinates.y,
        col: selectedSlotCoordinates.x,
      }
    : null
  const selectedIndex = selectedSlotCoordinates
    ? selectedSlotCoordinates.y * rack.sizeX + selectedSlotCoordinates.x
    : null
  const coordinate =
    selectedIndex !== null ? getSlotCoordinate(selectedIndex, rack.sizeX) : null

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <HugeiconsIcon className="size-4 text-primary" icon={Tag01Icon} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {t("generated.dashboard.rackVisualization.shelfDetails")}
            </h3>
            <p className="text-muted-foreground text-xs">
              {selectedPosition
                ? t("generated.dashboard.shared.rowShelf", {
                    value0: (selectedPosition.row + 1).toString(),
                    value1: (selectedPosition.col + 1).toString(),
                  })
                : t("generated.dashboard.rackVisualization.selectShelf")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {coordinate && (
            <Badge className="font-mono" variant="outline">
              {coordinate}
            </Badge>
          )}
          {selectedPosition && (
            <Button onClick={onClearSelection} size="sm" variant="ghost">
              {t("generated.shared.clear")}
            </Button>
          )}
        </div>
      </div>

      {!hasSelection && (
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              className="size-6 text-muted-foreground"
              icon={InformationCircleIcon}
            />
          </div>
          <p className="font-medium text-muted-foreground text-sm">
            {t("generated.dashboard.shared.clickShelf")}
          </p>
          <p className="text-muted-foreground/70 text-xs">
            {t("generated.dashboard.shared.seeItemDetails")}
          </p>
        </div>
      )}

      {hasSelection && !assortment && (
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              className="size-6 text-muted-foreground"
              icon={PackageIcon}
            />
          </div>
          <p className="font-medium text-muted-foreground text-sm">
            {t("generated.dashboard.shared.emptyShelf")}
          </p>
          <p className="text-muted-foreground/70 text-xs">
            {t("generated.dashboard.shared.itemPosition")}
            <br />
            {selectedPosition
              ? t("generated.dashboard.shared.rowShelf", {
                  value0: (selectedPosition.row + 1).toString(),
                  value1: (selectedPosition.col + 1).toString(),
                })
              : ""}
          </p>
        </div>
      )}

      {assortment && selectedPosition && (
        <div className="space-y-3 p-4">
          <div className="space-y-2 text-xs">
            <DetailRow
              label={t("generated.dashboard.shared.itemName")}
              value={
                <span className="font-mono font-semibold">
                  {assortment.item.name}
                </span>
              }
            />
            <DetailRow
              label={t("generated.shared.code")}
              value={
                <span className="font-mono font-semibold">
                  {assortment.code}
                </span>
              }
            />
            <DetailRow
              label={t("generated.shared.position")}
              value={
                <span className="font-mono font-semibold">
                  {t("generated.dashboard.rackVisualization.xY", {
                    value0: assortment.positionX.toString(),
                    value1: assortment.positionY.toString(),
                  })}
                </span>
              }
            />
            <DetailRow
              label={t("generated.shared.created")}
              value={
                <span className="font-mono font-semibold">
                  {format(
                    new Date(assortment.createdAt),
                    "yyyy-MM-dd HH:mm:ss"
                  )}
                </span>
              }
            />
            <DetailRow
              label={t("generated.dashboard.shared.expires")}
              value={
                <span className="font-mono font-semibold">
                  {format(
                    new Date(assortment.expiresAt),
                    "yyyy-MM-dd HH:mm:ss"
                  )}
                </span>
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
