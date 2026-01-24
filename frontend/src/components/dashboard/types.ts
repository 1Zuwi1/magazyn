export interface Rack {
  id: string
  symbol?: string
  name: string
  rows: number
  cols: number
  minTemp: number
  maxTemp: number
  maxWeight: number
  currentWeight: number
  maxItemSize: Dimensions
  comment?: string
  occupancy: number // 0-100
  items: ItemSlot[]
}

export interface Warehouse {
  id: string
  name: string
  capacity: number
  used: number
  racks: Rack[]
}
export interface FilterState {
  query: string
  minOccupancy: number
  tempRange: [number, number]
  showEmpty: boolean
}

export interface Dimensions {
  x: number
  y: number
  z: number
}

export interface Item {
  id: string
  name: string
  qrCode: string
  expiryDate: Date
  weight: number
  dimensions: Dimensions
  minTemp: number
  maxTemp: number
  comment?: string
  isDangerous: boolean
  imageUrl?: string | null
}

export type ItemSlot = Item | null

export type NotificationType =
  | "UNAUTHORIZED_REMOVAL"
  | "RACK_OVERWEIGHT"
  | "SENSOR_OFFLINE"
  | "ITEM_EXPIRED"
  | "TEMPERATURE_VIOLATION"

export type NotificationSeverity = "info" | "warning" | "critical"

export interface Notification {
  id: string
  title: string
  description: string
  type: NotificationType
  severity: NotificationSeverity
  warehouseId?: string
  rackId?: string
  itemId?: string
  metadata: Record<string, unknown>
  date: string
  read: boolean
}

export type Role = "user" | "admin"
export type Status = "active" | "inactive"

export interface User {
  id: string
  username: string
  email: string
  role: Role
  status: Status
}
