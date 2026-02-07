export interface FilterState {
  query: string
  minOccupancy: number
  tempRange: [number, number]
  showEmpty: boolean
}

export interface Item {
  id: string
  name: string
  qrCode: string
  weight: number
  width: number
  height: number
  depth: number
  minTemp: number
  maxTemp: number
  comment?: string
  daysToExpiry: number
  expiryDate?: Date
  isDangerous: boolean
  imageUrl?: string | null
}

export type ItemSlot = Item | null

export type NotificationType =
  | "UNAUTHORIZED_REMOVAL"
  | "RACK_OVERWEIGHT"
  | "ITEM_EXPIRED"
  | "TEMPERATURE_VIOLATION"

export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL"

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
  createdAt: Date
}

export type Role = "USER" | "ADMIN"
export type Status = "ACTIVE" | "INACTIVE"

export interface User {
  id: string
  username: string
  email: string
  role: Role
  team: string
  status: Status
}
