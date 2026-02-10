export type ReportFormat = "xlsx" | "pdf" | "csv"

export interface ExpiryReportRow {
  id: string
  item: string
  warehouse: string
  rack: string
  expiryDate: string
  daysLeft: number
  batch: string
  quantity: number
  unit: string
  category: string
}

export type TemperatureSeverity = "CRITICAL" | "WARNING" | "MINOR"

export interface TemperatureReportRow {
  id: string
  scope: "RACK" | "ASSORTMENT"
  targetRange: string
  recordedTemp: string
  location: string
  warehouse: string
  recordedAt: string
  item?: string
  severity: TemperatureSeverity
  deviation: number
}

export interface InventoryReportRow {
  id: string
  warehouse: string
  rack: string
  item: string
  sku: string
  quantity: number
  unit: string
  nearestExpiry: string | null
}
