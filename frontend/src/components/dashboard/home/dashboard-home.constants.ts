export const OCCUPANCY_WARNING_THRESHOLD = 75
export const OCCUPANCY_CRITICAL_THRESHOLD = 90
export const EXPIRY_WARNING_DAYS = 7
export const RECENT_ITEMS_LIMIT = 4
export const EXPIRING_ITEMS_LIMIT = 3
export const TOP_WAREHOUSES_LIMIT = 3

const NUMBER_FORMATTER = new Intl.NumberFormat("pl-PL")

export const formatNumber = (value: number): string =>
  NUMBER_FORMATTER.format(value)

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
