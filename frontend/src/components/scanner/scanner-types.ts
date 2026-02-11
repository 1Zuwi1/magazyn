export interface ScanItem {
  id: number
  code: string
  name: string
  photoUrl: string | null
  minTemp: number
  maxTemp: number
  weight: number
  sizeX: number
  sizeY: number
  sizeZ: number
  comment: string | null
  expireAfterDays: number
  dangerous: boolean
}

export interface PlacementPlanLocation {
  rackId: number
  rackMarker: string
  positionX: number
  positionY: number
}

export interface PlacementPlan {
  itemId: number
  requestedQuantity: number
  allocatedQuantity: number
  remainingQuantity: number
  placements: PlacementPlanLocation[]
  reserved: boolean
  reservedUntil: string | null
  reservedCount: number
}

export interface EditablePlacement {
  id: string
  rackId: number
  positionX: number
  positionY: number
  rackMarker?: string
}

export interface RackSelectOption {
  id: number
  name: string
  sizeX: number
  sizeY: number
}

// ── Outbound (Zdejmowanie) types ─────────────────────────────────────

export interface ScannedVerificationEntry {
  assortmentCode: string
  rackMarker: string
  positionX: number
  positionY: number
  scannedAt: Date
}

export type OutboundStep =
  | "camera"
  | "manual-input"
  | "choose-method"
  | "select-item"
  | "select-quantity"
  | "pick-list"
  | "scan-verification"
  | "fifo-warning"
  | "executing"
  | "success"
