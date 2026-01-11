export interface Location {
  rack: number
  row: number
  col: number
}

export type ScanItem = {
  id?: string
  name?: string
  qrCode?: string
  expiresIn?: number
  weight?: number
  imageUrl?: string | null
} | null
