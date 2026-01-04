export type ViewMode = "overview" | "focus"

export type ItemStatus =
  | "normal"
  | "dangerous"
  | "expired"
  | "expired-dangerous"

export interface Item3D {
  id: string
  type: string
  status: ItemStatus
  label: string
  imageUrl?: string
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
}

export interface FocusWindow {
  rackId: string
  startRow: number
  startCol: number
  rows: number
  cols: number
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
  query: string
}

export const RACK_ZONE_SIZE = 10

export interface ItemVisual {
  color: string
  glow: string
  emissiveIntensity: number
}

export const ITEM_STATUS_ORDER: ItemStatus[] = [
  "normal",
  "dangerous",
  "expired",
  "expired-dangerous",
]

export const ITEM_STATUS_SEVERITY: Record<ItemStatus, number> = {
  normal: 0,
  dangerous: 1,
  expired: 2,
  "expired-dangerous": 3,
}

const ITEM_VISUALS: Record<ItemStatus, ItemVisual> = {
  normal: {
    color: "#2f855a",
    glow: "#34d399",
    emissiveIntensity: 0.05,
  },
  expired: {
    color: "#d97706",
    glow: "#f59e0b",
    emissiveIntensity: 0.12,
  },
  dangerous: {
    color: "#b91c1c",
    glow: "#ef4444",
    emissiveIntensity: 0.18,
  },
  "expired-dangerous": {
    color: "#b91c1c",
    glow: "#f59e0b",
    emissiveIntensity: 0.22,
  },
}

export function getItemVisuals(status: ItemStatus): ItemVisual {
  return ITEM_VISUALS[status]
}

export function getWorstStatus(
  current: ItemStatus | null,
  next: ItemStatus
): ItemStatus {
  if (!current) {
    return next
  }
  return ITEM_STATUS_SEVERITY[next] > ITEM_STATUS_SEVERITY[current]
    ? next
    : current
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
  return getItemVisuals(status).color
}

export function getItemGlowColor(status: ItemStatus): string {
  return getItemVisuals(status).glow
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
