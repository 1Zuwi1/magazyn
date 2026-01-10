import { differenceInCalendarDays, format } from "date-fns"
import { pl } from "date-fns/locale"
import { toast } from "sonner"
import { FetchError } from "@/lib/fetcher"

// Helper function to convert index to coordinate (R01-P01, R02-P03, etc.)
export function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = `P${String(col + 1).padStart(2, "0")}`
  return `${rowLabel}-${colLabel}`
}

export function formatDate(date: Date): string {
  return format(date, "dd.MM.yyyy", { locale: pl })
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
    err instanceof FetchError
      ? err.message
      : (fallback ?? "Wystąpił nieoczekiwany błąd.")
  )
}
