import type z from "zod"
import type { ItemCsvSchema, RackCsvSchema } from "@/lib/schemas/csv-schemas"

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

export type CsvImporterType = "rack" | "item"

export type CsvRowType<T extends CsvImporterType> = T extends "rack"
  ? RackCsvData
  : ItemCsvData

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
