import {
  differenceInCalendarDays,
  formatDate,
  isValid,
  parseISO,
} from "date-fns"
import { toast } from "sonner"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import type { AppTranslate } from "@/i18n/use-translations"
import { FetchError } from "@/lib/fetcher"
import type { RackAssortment } from "@/lib/schemas"
import { translateZodMessage } from "@/lib/zod-message"
import type { Item, ItemSlot } from "../types"

// Helper function to convert index to coordinate (R01-P01, R02-P03, etc.)
export function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = String(col + 1).padStart(2, "0")
  return `${rowLabel}-${colLabel}`
}

export const formatDateTime = (value: string, locale: string): string => {
  const parsedDate = parseISO(value)
  if (!isValid(parsedDate)) {
    return value
  }

  return formatDate(parsedDate, "Pp", {
    locale: getDateFnsLocale(locale),
  })
}

export function formatDimensions(item: Item): string {
  return `${item.width}×${item.height}×${item.depth} mm`
}

export function getDaysUntilExpiry(today: Date, expiryDate: Date): number {
  return differenceInCalendarDays(expiryDate, today)
}

const ERROR_CODE_PATTERN = /^[A-Z0-9_]+$/
const DEFAULT_ERROR_CODE = "UNEXPECTED_ERROR"

const getErrorCode = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined
  }

  return ERROR_CODE_PATTERN.test(value) ? value : undefined
}

const translateErrorCode = (
  t: AppTranslate,
  errorCode: string,
  fallback?: string
): string => {
  try {
    if (t.has(`errorCodes.${errorCode}`)) {
      return t(`errorCodes.${errorCode}`)
    }
    return fallback ?? errorCode
  } catch {
    return fallback ?? errorCode
  }
}

export const handleApiError = (
  err: unknown,
  fallback: string | undefined,
  t: AppTranslate
) => {
  const rawMessage = err instanceof Error ? err.message : undefined
  const resolvedCode =
    (FetchError.isError(err) ? err.message : undefined) ??
    getErrorCode(rawMessage)

  if (resolvedCode) {
    toast.error(translateErrorCode(t, resolvedCode, fallback))
    return
  }

  if (rawMessage) {
    toast.error(translateZodMessage(rawMessage, t))
    return
  }

  if (fallback) {
    toast.error(fallback)
    return
  }

  toast.error(translateErrorCode(t, DEFAULT_ERROR_CODE))
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
    id: assortment.item.id,
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
    const index =
      (assortment.positionY - 1) * sizeX + (assortment.positionX - 1)
    if (index >= 0 && index < slotCount) {
      slots[index] = mapToDisplayItem(assortment)
    }
  }

  return slots
}

/**
 * Translates a value in rem units to pixels based on the current document's root font size.
 * This is useful for calculating dynamic heights or widths in virtualized lists where pixel values are needed.
 * @param rem Value you want to parse into pixels
 * @returns Value of rems in pixels
 */
export const remToPixels = (rem: number) => {
  if (typeof window === "undefined" || !window.getComputedStyle) {
    return rem * 16 // Default to 16px if window is not available (e.g. during SSR)
  }
  return (
    rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  )
}

export const toTitleCase = (value: string): string =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`)
    .join(" ")
