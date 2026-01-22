import type z from "zod"
import type {
  CsvItemRowSchema,
  CsvRackRowSchema,
} from "@/lib/schemas/admin-schemas"
export interface Column {
  key: string
  label: string
}

export interface RackFormData {
  id: string
  symbol?: string
  name: string
  rows: number
  cols: number
  minTemp: number
  maxTemp: number
  maxWeight: number
  comment?: string
}

export type CsvImporterType = "rack" | "item"

export type CsvRowType<T extends CsvImporterType> = T extends "rack"
  ? z.infer<typeof CsvRackRowSchema>
  : z.infer<typeof CsvItemRowSchema>

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
