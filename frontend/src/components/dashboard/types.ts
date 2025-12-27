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

interface BaseItem {
  id: string
  name: string
  expiryDate: Date
  weight: number
  isDangerous: boolean
  imageUrl?: string | null
}

export type Item = BaseItem | null

export interface FilterState {
  query: string
  minOccupancy: number
  tempRange: [number, number]
  showEmpty: boolean
}
