export interface ItemDefinition {
  id: string
  name: string
  category: string
  description?: string
  defaultMinTemp?: number
  defaultMaxTemp?: number
  defaultWeight?: number
  shelfLife?: number // dni do przeterminowania
  isDangerous: boolean
  imageUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ItemInstance {
  id: string
  definitionId: string
  definition: ItemDefinition
  qrCode: string
  addedDate: Date
  expiryDate: Date
  weight: number
  warehouseId: string
  warehouseName: string
  rackId: string
  rackName: string
  position: {
    row: number
    col: number
  }
  currentTemp?: number
  comment?: string
}

export interface ItemStats {
  definitionId: string
  definition: ItemDefinition
  totalQuantity: number
  warehouseQuantities: Record<string, number>
  nearestExpiryDate?: Date
  daysUntilExpiry?: number
}
