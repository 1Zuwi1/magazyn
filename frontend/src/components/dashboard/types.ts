export interface Rack {
  id: string
  name: string
  rows: number
  cols: number
  minTemp: number
  maxTemp: number
  maxWeight: number
  currentWeight: number
  occupancy: number // 0-100
  items: Item[]
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

// z wymagań wzięte te pola
interface BaseItem {
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

export type Item = BaseItem | null
