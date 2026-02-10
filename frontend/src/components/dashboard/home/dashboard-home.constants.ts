import { DEFAULT_APP_LOCALE } from "@/i18n/locale"

export const OCCUPANCY_WARNING_THRESHOLD = 75
export const OCCUPANCY_CRITICAL_THRESHOLD = 90
export const EXPIRY_WARNING_DAYS = 7
export const RECENT_ITEMS_LIMIT = 4
export const EXPIRING_ITEMS_LIMIT = 3
export const TOP_WAREHOUSES_LIMIT = 3

const numberFormatters = new Map<string, Intl.NumberFormat>()

export const formatNumber = (value: number, locale: string): string => {
  const formatterLocale = locale.trim() || DEFAULT_APP_LOCALE
  const existingFormatter = numberFormatters.get(formatterLocale)

  if (existingFormatter) {
    return existingFormatter.format(value)
  }

  const formatter = new Intl.NumberFormat(formatterLocale)
  numberFormatters.set(formatterLocale, formatter)

  return formatter.format(value)
}

export const getOccupancyStatVariant = (
  occupancy: number
): "default" | "warning" | "destructive" => {
  if (occupancy >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (occupancy >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "default"
}
