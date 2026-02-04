import {
  InformationCircleIcon,
  PackageIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { addDays } from "date-fns"
import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Rack } from "../types"
import {
  formatDate,
  formatDimensions,
  getDaysUntilExpiry,
  getSlotCoordinate,
  pluralize,
} from "../utils/helpers"
import {
  getItemStatus,
  getStatusColors,
  getStatusText,
  type ItemStatus,
} from "../utils/item-status"

interface RackShelfDetailsCardProps {
  rack: Rack
  selectedIndex: number | null
  onClearSelection: () => void
  onOpenDetails?: () => void
}

type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>

function getStatusBadgeVariant(status: ItemStatus): BadgeVariant {
  if (status === "normal") {
    return "success"
  }
  if (status === "expired") {
    return "warning"
  }
  return "destructive"
}

function formatExpiryHint(daysUntilExpiry: number): string {
  if (daysUntilExpiry === 0) {
    return "Wygasa dzisiaj"
  }

  const absDays = Math.abs(daysUntilExpiry)
  const daysLabel = `${absDays} ${pluralize(absDays, "dzień", "dni", "dni")}`
  if (daysUntilExpiry < 0) {
    return `Po terminie ${daysLabel}`
  }

  return `Wygasa za ${daysLabel}`
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
  selectedIndex,
  onClearSelection,
  onOpenDetails,
}: RackShelfDetailsCardProps) {
  const selectedItem = selectedIndex !== null ? rack.items[selectedIndex] : null
  const selectedPosition =
    selectedIndex !== null
      ? {
          row: Math.floor(selectedIndex / rack.cols),
          col: selectedIndex % rack.cols,
        }
      : null
  const coordinate =
    selectedIndex !== null ? getSlotCoordinate(selectedIndex, rack.cols) : null
  const daysUntilExpiry = selectedItem
    ? getDaysUntilExpiry(
        new Date(),
        selectedItem.expiryDate ??
          addDays(new Date(), selectedItem.daysToExpiry)
      )
    : null
  const status = selectedItem ? getItemStatus(selectedItem) : null
  const statusColors = status ? getStatusColors(status) : null
  const statusText = status ? getStatusText(status) : null
  const badgeVariant = status ? getStatusBadgeVariant(status) : null
  const expiryHint =
    daysUntilExpiry !== null ? formatExpiryHint(daysUntilExpiry) : null

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

      {selectedIndex === null && (
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

      {selectedIndex !== null && !selectedItem && (
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

      {selectedItem && selectedPosition && statusColors && statusText && (
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("size-2.5 rounded-full", statusColors.dot)} />
            <span className={cn("font-medium text-sm", statusColors.text)}>
              {statusText}
            </span>
            {expiryHint && badgeVariant && (
              <Badge variant={badgeVariant}>{expiryHint}</Badge>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <DetailRow
              label="ID"
              value={
                <span className="font-mono font-semibold">
                  {selectedItem.id}
                </span>
              }
            />
            <DetailRow
              label="Nazwa"
              value={<span className="font-medium">{selectedItem.name}</span>}
            />
            <DetailRow
              label="Kod QR"
              value={
                <span className="font-mono font-semibold">
                  {selectedItem.qrCode}
                </span>
              }
            />
            <DetailRow
              label="Waga"
              value={
                <span className="font-mono font-semibold">
                  {selectedItem.weight.toFixed(2)} kg
                </span>
              }
            />
            <DetailRow
              label="Wymiary"
              value={
                <span className="font-mono font-semibold">
                  {formatDimensions(selectedItem)}
                </span>
              }
            />
            <DetailRow
              label="Temperatura"
              value={
                <span className="font-mono font-semibold">
                  {selectedItem.minTemp}°C – {selectedItem.maxTemp}°C
                </span>
              }
            />
            <DetailRow
              label="Ważność"
              value={
                <span
                  className={cn("font-mono font-semibold", statusColors.text)}
                >
                  {formatDate(
                    selectedItem.expiryDate ??
                      addDays(new Date(), selectedItem.daysToExpiry)
                  )}
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
