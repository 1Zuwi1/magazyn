import {
  InformationCircleIcon,
  PackageIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { translateMessage } from "@/i18n/translate-message"
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
              {translateMessage("generated.m0505")}
            </h3>
            <p className="text-muted-foreground text-xs">
              {selectedPosition
                ? translateMessage("generated.m0506", {
                    value0: selectedPosition.row + 1,
                    value1: selectedPosition.col + 1,
                  })
                : translateMessage("generated.m0507")}
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
              {translateMessage("generated.m0413")}
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
            {translateMessage("generated.m0416")}
          </p>
          <p className="text-muted-foreground/70 text-xs">
            {translateMessage("generated.m0417")}
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
            {translateMessage("generated.m0414")}
          </p>
          <p className="text-muted-foreground/70 text-xs">
            {translateMessage("generated.m0415")}
            <br />
            {selectedPosition
              ? translateMessage("generated.m0506", {
                  value0: selectedPosition.row + 1,
                  value1: selectedPosition.col + 1,
                })
              : ""}
          </p>
        </div>
      )}

      {assortment && selectedPosition && (
        <div className="space-y-3 p-4">
          <div className="space-y-2 text-xs">
            <DetailRow
              label={translateMessage("generated.m0457")}
              value={
                <span className="font-mono font-semibold">
                  {assortment.item.name}
                </span>
              }
            />
            <DetailRow
              label={translateMessage("generated.m0906")}
              value={
                <span className="font-mono font-semibold">
                  {assortment.code}
                </span>
              }
            />
            <DetailRow
              label={translateMessage("generated.m0908")}
              value={
                <span className="font-mono font-semibold">
                  {translateMessage("generated.m1073", {
                    value0: assortment.positionX,
                    value1: assortment.positionY,
                  })}
                </span>
              }
            />
            <DetailRow
              label={translateMessage("generated.m0898")}
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
              label={translateMessage("generated.m0986")}
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
