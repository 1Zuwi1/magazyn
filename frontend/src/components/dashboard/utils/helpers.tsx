import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { pl } from "date-fns/locale"
import { toast } from "sonner"
import { FetchError } from "@/lib/fetcher"
import type { RackAssortment } from "@/lib/schemas"
import type { Item, ItemSlot } from "../types"

// Helper function to convert index to coordinate (R01-P01, R02-P03, etc.)
export function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = String(col + 1).padStart(2, "0")
  return `${rowLabel}-${colLabel}`
}

export function formatDate(date: Date): string {
  return format(date, "dd.MM.yyyy", { locale: pl })
}

export function formatDimensions(item: Item): string {
  return `${item.width}×${item.height}×${item.depth} mm`
}

export function getDaysUntilExpiry(today: Date, expiryDate: Date): number {
  return differenceInCalendarDays(expiryDate, today)
}

export function pluralize(
  count: number,
  singular: string,
  few: string,
  many: string
): string {
  if (count === 1) {
    return singular
  }
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    !(lastTwoDigits >= 12 && lastTwoDigits <= 14)
  ) {
    return few
  }

  return many
}

export const handleApiError = (err: unknown, fallback?: string) => {
  toast.error(
    FetchError.isError(err)
      ? err.message
      : (fallback ?? "Wystąpił nieoczekiwany błąd.")
  )
}
export const getOccupancyPercentage = (
  used: number,
  capacity: number
): number => {
  return capacity > 0 ? (used / capacity) * 100 : 0
}

/**
 * Combines an Assortment record with its corresponding ItemDefinition
 * into the frontend display Item type used by rack grid components.
 */
export function mapToDisplayItem(assortment: RackAssortment): Item {
  const expiresAt = parseISO(assortment.expiresAt)

  return {
    id: String(assortment.id),
    name: assortment.item.name,
    qrCode: assortment.code,
    weight: assortment.item.weight,
    width: assortment.item.sizeX,
    height: assortment.item.sizeY,
    depth: assortment.item.sizeZ,
    minTemp: assortment.item.minTemp,
    maxTemp: assortment.item.maxTemp,
    comment: assortment.item.comment ?? undefined,
    daysToExpiry: assortment.item.expireAfterDays,
    expiryDate: expiresAt,
    isDangerous: assortment.item.dangerous,
    imageUrl: assortment.item.photoUrl,
  }
}

/**
 * Builds the items slot array for the rack grid from assortments and item definitions.
 * Each slot is either an Item (occupied) or null (empty), placed at the correct grid position.
 */
export function buildItemsGrid(
  sizeX: number,
  sizeY: number,
  assortments: RackAssortment[]
): ItemSlot[] {
  const slotCount = sizeX * sizeY
  const slots: ItemSlot[] = Array.from({ length: slotCount }, () => null)

  for (const assortment of assortments) {
    const index = assortment.positionY * sizeX + assortment.positionX
    if (index >= 0 && index < slotCount) {
      slots[index] = mapToDisplayItem(assortment)
    }
  }

  return slots
}
