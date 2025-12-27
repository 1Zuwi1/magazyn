// Helper function to convert index to coordinate (R01-P01, R02-P03, etc.)
export function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = `P${String(col + 1).padStart(2, "0")}`
  return `${rowLabel}-${colLabel}`
}

export function pluralize(
  count: number,
  single: string,
  multiple: string,
  normal: string
) {
  if (count === 1) {
    return single
  }
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return normal
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return multiple
  }
  return normal
}
