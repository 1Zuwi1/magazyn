export interface Location {
  rack: number
  row: number
  col: number
}

export interface ScanItem {
  id?: string
  name?: string
  qrCode?: string
  expiresIn?: number
  weight?: number
  imageUrl?: string
}
