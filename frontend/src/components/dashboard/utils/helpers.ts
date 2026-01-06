// Helper function to convert index to coordinate (R01-P01, R02-P03, etc.)
export function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = `P${String(col + 1).padStart(2, "0")}`
  return `${rowLabel}-${colLabel}`
}

export function formatDate(date: Date): string {
  // TODO: Use date-fns here
  return new Intl.DateTimeFormat("pl-PL", {
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
