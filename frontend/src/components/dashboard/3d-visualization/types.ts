export type ViewMode = "overview" | "focus"

export type ItemStatus = "normal" | "expired" | "dangerous"

export interface Item3D {
  id: string
  type: string
  status: ItemStatus
  label: string
  meta?: Record<string, unknown>
}

export interface Rack3D {
  id: string
  code: string
  name: string
  grid: { rows: number; cols: number }
  cell: { w: number; h: number; d: number }
  maxElementSize: { width: number; height: number; depth: number }
  spacing: { x: number; y: number; z: number }
  transform: { position: [number, number, number]; rotationY: number }
  frame?: { thickness: number; padding: number }
  items: (Item3D | null)[]
  zone?: string
}

export interface Warehouse3D {
  id: string
  name: string
  racks: Rack3D[]
  center: { x: number; y: number; z: number }
}

export interface ShelfPosition {
  rackId: string
  index: number
  row: number
  col: number
}

export interface FilterState {
  itemStatus?: ItemStatus
  zone?: string
  query: string
}

export function toIndex(row: number, col: number, cols: number): number {
  return row * cols + col
}

export function fromIndex(
  index: number,
  cols: number
): { row: number; col: number } {
  return {
    row: Math.floor(index / cols),
    col: index % cols,
  }
}

export function getItemColor(status: ItemStatus): string {
  if (status === "normal") {
    return "#22c55e"
  }
  if (status === "expired") {
    return "#f97316"
  }
  if (status === "dangerous") {
    return "#ef4444"
  }
  return "#94a3b8"
}

export function getOccupancyColor(percentage: number): string {
  if (percentage < 30) {
    return "#22c55e"
  }
  if (percentage < 60) {
    return "#f59e0b"
  }
  if (percentage < 90) {
    return "#f97316"
  }
  return "#ef4444"
}
