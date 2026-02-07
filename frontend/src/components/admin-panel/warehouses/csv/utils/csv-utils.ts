import Papa from "papaparse"
import {
  ItemCsvSchema,
  RackCsvSchema,
  WarehouseCsvSchema,
} from "@/lib/schemas/csv-schemas"
import {
  DEFAULT_CONFIG,
  ITEM_COLUMNS,
  RACK_COLUMNS,
  WAREHOUSE_COLUMNS,
} from "./constants"
import type {
  CsvImporterType,
  CsvParseError,
  CsvParseResult,
  CsvRowType,
} from "./types"

const BOM_HEADER_REGEX = /^\uFEFF/

const NUMBER_FIELDS = new Set([
  "warehouseId",
  "rows",
  "cols",
  "minTemp",
  "maxTemp",
  "maxWeight",
  "maxItemWidth",
  "maxItemHeight",
  "maxItemDepth",
  "weight",
  "width",
  "height",
  "depth",
  "daysToExpiry",
])

const BOOLEAN_FIELDS = new Set(["isDangerous"])

const WAREHOUSE_HEADER_MAP: Record<string, string> = {
  name: "name",
  nazwa: "name",
  warehouse: "name",
}

const RACK_FIELD_ORDER = [
  "marker",
  "rows",
  "cols",
  "minTemp",
  "maxTemp",
  "maxWeight",
  "maxItemWidth",
  "maxItemHeight",
  "maxItemDepth",
  "isDangerous",
  "comment",
] as const

const ITEM_FIELD_ORDER = [
  "name",
  "minTemp",
  "maxTemp",
  "weight",
  "width",
  "height",
  "depth",
  "daysToExpiry",
  "isDangerous",
  "comment",
] as const

const RACK_PREVIEW_HEADERS = RACK_COLUMNS.map((column) => column.key)
const ITEM_PREVIEW_HEADERS = ITEM_COLUMNS.map((column) => column.key)
const WAREHOUSE_PREVIEW_HEADERS = WAREHOUSE_COLUMNS.map((column) => column.key)

function normalizeHeader(header: string): string {
  return header
    .replace(BOM_HEADER_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
}

function coerceValue(value: string, field: string): unknown {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  if (NUMBER_FIELDS.has(field)) {
    const parsed = Number.parseFloat(trimmed.replace(",", "."))
    return Number.isNaN(parsed) ? undefined : parsed
  }

  if (BOOLEAN_FIELDS.has(field)) {
    const lower = trimmed.toLowerCase()
    if (lower === "true" || lower === "1" || lower === "yes") {
      return true
    }
    if (lower === "false" || lower === "0" || lower === "no") {
      return false
    }
    return undefined
  }

  return trimmed
}

function mapRow(
  row: Record<string, string>,
  headerMap: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [csvKey, value] of Object.entries(row)) {
    const targetField = headerMap[csvKey]

    if (!(targetField && value?.trim())) {
      continue
    }

    const coercedValue = coerceValue(value, targetField)
    if (coercedValue !== undefined) {
      result[targetField] = coercedValue
    }
  }

  return result
}

function isRowEmpty(row: Record<string, string>): boolean {
  return !Object.values(row).some((v) => v.trim())
}

function isFixedRowEmpty(row: unknown[]): boolean {
  return !row.some((cell) => String(cell ?? "").trim())
}

function appendParserErrors(
  errors: CsvParseError[],
  parserErrors: Papa.ParseError[],
  rowOffset: number
) {
  for (const error of parserErrors) {
    errors.push({
      row: (error.row ?? 0) + rowOffset,
      message: error.message,
    })
  }
}

function buildRawPreviewRow(
  previewHeaders: string[],
  values: string[]
): Record<string, string> {
  const rawRow: Record<string, string> = {}

  for (const [headerIndex, header] of previewHeaders.entries()) {
    rawRow[normalizeHeader(header)] = values[headerIndex] ?? ""
  }

  return rawRow
}

function mapFixedValuesToFields(
  fieldOrder: readonly string[],
  values: string[]
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}

  for (const [fieldIndex, field] of fieldOrder.entries()) {
    const coercedValue = coerceValue(values[fieldIndex] ?? "", field)
    if (coercedValue !== undefined) {
      mapped[field] = coercedValue
    }
  }

  return mapped
}

function appendSchemaIssues(
  errors: CsvParseError[],
  rowNumber: number,
  issues: { path: PropertyKey[]; message: string }[]
) {
  for (const issue of issues) {
    errors.push({
      row: rowNumber,
      message: `${issue.path.map(String).join(".")}: ${issue.message}`,
    })
  }
}

function parseWarehouseCsv(file: File): Promise<CsvParseResult<"warehouse">> {
  const errors: CsvParseError[] = []

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      comments: "#",
      encoding: "UTF-8",
      delimiter: DEFAULT_CONFIG.delimiter,
      transformHeader: normalizeHeader,
      complete: (results) => {
        appendParserErrors(errors, results.errors, 2)

        const rawRows = results.data.filter((row) => !isRowEmpty(row))
        const validRows: CsvRowType<"warehouse">[] = []

        for (const [index, row] of rawRows.entries()) {
          const mapped = mapRow(row, WAREHOUSE_HEADER_MAP)
          const parsed = WarehouseCsvSchema.safeParse(mapped)

          if (parsed.success) {
            validRows.push(parsed.data)
            continue
          }

          const rowNumber = index + 2
          appendSchemaIssues(errors, rowNumber, parsed.error.issues)
        }

        resolve({
          headers: results.meta.fields ?? WAREHOUSE_PREVIEW_HEADERS,
          rows: validRows,
          rawRows,
          errors,
        })
      },
      error: reject,
    })
  })
}

function parseFixedCsv<T extends "rack" | "item">(
  file: File,
  {
    fieldOrder,
    maxColumns,
    minColumns,
    previewHeaders,
    schema,
  }: {
    fieldOrder: readonly string[]
    maxColumns: number
    minColumns: number
    previewHeaders: string[]
    schema: typeof RackCsvSchema | typeof ItemCsvSchema
  }
): Promise<CsvParseResult<T>> {
  const errors: CsvParseError[] = []

  return new Promise((resolve, reject) => {
    Papa.parse<unknown[]>(file, {
      header: false,
      skipEmptyLines: true,
      comments: "#",
      encoding: "UTF-8",
      delimiter: DEFAULT_CONFIG.delimiter,
      complete: (results) => {
        appendParserErrors(errors, results.errors, 1)

        const rawRows: Record<string, string>[] = []
        const validRows: CsvRowType<T>[] = []

        for (const [index, row] of results.data.entries()) {
          if (isFixedRowEmpty(row)) {
            continue
          }

          const values = row.map((cell) => String(cell ?? "").trim())
          const rowNumber = index + 1

          if (values.length < minColumns || values.length > maxColumns) {
            errors.push({
              row: rowNumber,
              message: `Nieprawidłowa liczba kolumn: ${values.length}. Oczekiwano ${minColumns}-${maxColumns}.`,
            })
            continue
          }

          rawRows.push(buildRawPreviewRow(previewHeaders, values))
          const mapped = mapFixedValuesToFields(fieldOrder, values)

          const parsed = schema.safeParse(mapped)

          if (parsed.success) {
            validRows.push(parsed.data as CsvRowType<T>)
            continue
          }

          appendSchemaIssues(errors, rowNumber, parsed.error.issues)
        }

        resolve({
          headers: previewHeaders,
          rows: validRows,
          rawRows,
          errors,
        })
      },
      error: reject,
    })
  })
}

function parseRackCsv(file: File): Promise<CsvParseResult<"rack">> {
  return parseFixedCsv<"rack">(file, {
    fieldOrder: RACK_FIELD_ORDER,
    minColumns: 10,
    maxColumns: 12,
    previewHeaders: RACK_PREVIEW_HEADERS,
    schema: RackCsvSchema,
  })
}

function parseItemCsv(file: File): Promise<CsvParseResult<"item">> {
  return parseFixedCsv<"item">(file, {
    fieldOrder: ITEM_FIELD_ORDER,
    minColumns: 7,
    maxColumns: 10,
    previewHeaders: ITEM_PREVIEW_HEADERS,
    schema: ItemCsvSchema,
  })
}

export function parseCsvFile<T extends CsvImporterType>(
  file: File,
  type: T
): Promise<CsvParseResult<T>> {
  if (type === "warehouse") {
    return parseWarehouseCsv(file) as Promise<CsvParseResult<T>>
  }
  if (type === "rack") {
    return parseRackCsv(file) as Promise<CsvParseResult<T>>
  }
  return parseItemCsv(file) as Promise<CsvParseResult<T>>
}

export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, "")
}
