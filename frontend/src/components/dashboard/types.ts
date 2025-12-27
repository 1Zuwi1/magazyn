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

export interface Item {
  id: string
  name: string
  expiryDate: Date
  weight: number
  isDangerous: boolean
}

export interface FilterState {
  query: string
  minOccupancy: number
  tempRange: [number, number]
  showEmpty: boolean
}
