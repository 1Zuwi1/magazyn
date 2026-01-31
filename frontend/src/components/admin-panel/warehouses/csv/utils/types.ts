import type z from "zod"
import type {
  ItemSchema,
  RackCsvSchema,
  RackSchema,
} from "@/lib/schemas/admin-schemas"

export interface Column {
  key: string
  label: string
}

export type RackFormData = z.infer<typeof RackCsvSchema>

export type CsvImporterType = "rack" | "item"

export type CsvRowType<T extends CsvImporterType> = T extends "rack"
  ? z.infer<typeof RackSchema>
  : z.infer<typeof ItemSchema>

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
