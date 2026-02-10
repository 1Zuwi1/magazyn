export type ReportFormat = "xlsx" | "pdf" | "csv"

export interface ExpiryReportRow {
  id: string
  item: string
  warehouse: string
  rack: string
  expiryDate: string
  daysLeft: number
  batch: string
}

export interface TemperatureReportRow {
  id: string
  scope: "RACK" | "ASSORTMENT"
  targetRange: string
  recordedTemp: string
  location: string
  recordedAt: string
  item?: string
}

export interface InventoryReportRow {
  id: string
  item: string
  sku: string
  warehouse: string
  rack: string
  quantity: number
  unit: string
  status: "OK" | "LOW" | "OVERSTOCK"
}
