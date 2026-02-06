import { differenceInCalendarDays, format } from "date-fns"
import { pl } from "date-fns/locale"
import { toast } from "sonner"
import { FetchError } from "@/lib/fetcher"
import type { Item } from "../types"

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

export const getCookieValue = (cookieName: string): string | undefined => {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${cookieName}=`))

  if (!cookie) {
    return undefined
  }

  return decodeURIComponent(cookie.slice(cookieName.length + 1))
}
