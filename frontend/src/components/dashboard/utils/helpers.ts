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
  singular: string,
  few: string,
  many: string
): string {
  if (count === 1) {
    return singular
  }
  if (count >= 2 && count <= 4) {
    return few
  }
  return many
}
