import { toast } from "sonner"
import { useTranslate } from "@/hooks/use-translate"
import { FetchError } from "@/lib/fetcher"

// Helper function to convert index to coordinate (R01-P01, R02-P03, etc.)
export function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = String(col + 1).padStart(2, "0")
  return `${rowLabel}-${colLabel}`
}

export function formatDate(date: Date, locale: string): string {
  // TODO: Use date-fns here
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function getDaysUntilExpiry(today: Date, expiryDate: Date): number {
  // TODO: use date-fns differenceInCalendarDays
  const todayDate = new Date(today)
  todayDate.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffTime = expiry.getTime() - todayDate.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const useHandleApiError = () => {
  const translator = useTranslate("auth.errors")

  return (err: unknown, fallback?: string) => {
    toast.error(
      err instanceof FetchError
        ? err.message
        : (fallback ?? translator("unknownError"))
    )
  }
}
