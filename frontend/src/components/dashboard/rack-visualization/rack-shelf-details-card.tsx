import {
  InformationCircleIcon,
  PackageIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Assortment, Rack } from "@/lib/schemas"
import type { SlotCoordinates } from "../types"
import { getSlotCoordinate } from "../utils/helpers"

interface RackShelfDetailsCardProps {
  rack: Rack
  selectedSlotCoordinates: SlotCoordinates | null
  assortment: Assortment | null
  onClearSelection: () => void
  onOpenDetails?: () => void
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
  onOpenDetails,
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
            <h3 className="font-semibold text-sm">Szczegóły półki</h3>
            <p className="text-muted-foreground text-xs">
              {selectedPosition
                ? `Rząd ${selectedPosition.row + 1}, Półka ${selectedPosition.col + 1}`
                : "Wybierz półkę"}
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
              Wyczyść
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
            Kliknij na półkę
          </p>
          <p className="text-muted-foreground/70 text-xs">
            aby zobaczyć szczegóły elementu
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
            Pusta półka
          </p>
          <p className="text-muted-foreground/70 text-xs">
            Brak elementu na pozycji
            <br />
            {selectedPosition
              ? `Rząd ${selectedPosition.row + 1}, Półka ${selectedPosition.col + 1}`
              : ""}
          </p>
        </div>
      )}

      {assortment && selectedPosition && (
        <div className="space-y-3 p-4">
          <div className="space-y-2 text-xs">
            <DetailRow
              label="ID"
              value={
                <span className="font-mono font-semibold">{assortment.id}</span>
              }
            />
            <DetailRow
              label="Kod"
              value={
                <span className="font-mono font-semibold">
                  {assortment.code}
                </span>
              }
            />
            <DetailRow
              label="ID przedmiotu"
              value={
                <span className="font-mono font-semibold">
                  {assortment.itemId}
                </span>
              }
            />
            <DetailRow
              label="Pozycja"
              value={
                <span className="font-mono font-semibold">
                  X: {assortment.positionX}, Y: {assortment.positionY}
                </span>
              }
            />
            <DetailRow
              label="Utworzono"
              value={
                <span className="font-mono font-semibold">
                  {assortment.createdAt}
                </span>
              }
            />
            <DetailRow
              label="Wygasa"
              value={
                <span className="font-mono font-semibold">
                  {assortment.expiresAt}
                </span>
              }
            />
          </div>

          <Button
            className="w-full"
            disabled={!onOpenDetails}
            onClick={onOpenDetails}
            size="sm"
            variant="outline"
          >
            Podgląd elementu
          </Button>
        </div>
      )}
    </div>
  )
}
