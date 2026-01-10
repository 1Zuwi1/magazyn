// Helper function to convert index to coordinate.
export function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = String(col + 1).padStart(2, "0")
  return `${rowLabel}-${colLabel}`
}
