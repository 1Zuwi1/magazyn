import type z from "zod"
import type {
  ItemCsvSchema,
  RackCsvSchema,
  WarehouseCsvSchema,
} from "@/lib/schemas/csv-schemas"

export interface Column {
  key: string
  label: string
}

export type RackCsvData = z.infer<typeof RackCsvSchema>

export interface RackFormData {
  marker: string
  rows: number
  cols: number
  minTemp: number
  maxTemp: number
  maxWeight: number
  maxItemWidth: number
  maxItemHeight: number
  maxItemDepth: number
  comment?: string
}

export type ItemCsvData = z.infer<typeof ItemCsvSchema>

export type WarehouseCsvData = z.infer<typeof WarehouseCsvSchema>

export type CsvImporterType = "rack" | "item" | "warehouse"

export type CsvRowType<T extends CsvImporterType> = T extends "rack"
  ? RackCsvData
  : T extends "item"
    ? ItemCsvData
    : WarehouseCsvData

export interface CsvParseError {
  row: number
  message: string
}

export interface CsvParseResult<T extends CsvImporterType> {
  headers: string[]
  rows: CsvRowType<T>[]
  rawRows: Record<string, string>[]
  errors: CsvParseError[]
}
